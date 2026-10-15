import OpenAI from 'openai';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let openaiClient = null;

function getOpenAiClient() {
  if (!env.AI_API_KEY) {
    return null;
  }

  if (!openaiClient) {
    const config = {
      apiKey: env.AI_API_KEY
    };

    if (env.AI_BASE_URL) {
      config.baseURL = env.AI_BASE_URL;
    }

    openaiClient = new OpenAI(config);
  }

  return openaiClient;
}

/**
 * Checks if an AI provider is configured and available
 */
export function isAiConfigured() {
  return Boolean(env.AI_API_KEY && env.AI_API_KEY.trim().length > 0);
}

/**
 * Maps any deprecated or legacy model names to modern active Gemini models.
 * Automatically resolves deprecated gemini-2.5-flash-lite to gemini-3.5-flash-lite.
 */
export function resolveGeminiModel(configuredModel) {
  const model = (configuredModel || '').replace(/^models\//, '').trim();
  const legacyModels = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite'
  ];
  if (!model || legacyModels.includes(model)) {
    return 'gemini-3.5-flash-lite';
  }
  return model;
}

/**
 * Calls Google Gemini REST API directly using official endpoint with timeout and candidate fallbacks.
 * Preserves existing API implementation and validates compatibility with gemini-3.5-flash-lite.
 */
async function callGeminiApi({ systemPrompt, userPrompt, temperature = 0.3 }) {
  if (!isAiConfigured()) {
    throw new Error('AI_NOT_CONFIGURED: Google Gemini API key is missing. Please configure AI_API_KEY or GEMINI_API_KEY in server/.env.');
  }

  const primaryModel = resolveGeminiModel(env.AI_MODEL);
  const candidateModels = [primaryModel, 'gemini-3.5-flash-lite', 'gemini-flash-latest'].filter(
    (m, i, arr) => arr.indexOf(m) === i
  );

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature
    }
  };

  if (systemPrompt) {
    payload.systemInstruction = {
      parts: [{ text: systemPrompt }]
    };
  }

  let lastError = null;

  for (const model of candidateModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.AI_API_KEY}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(45000) // 45-second timeout
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.error) {
        const status = response.status;
        const errorMsg = data.error?.message || `Gemini API error (HTTP ${status})`;
        logger.error(`Gemini model ${model} request failed: HTTP ${status} - ${errorMsg}`);

        if (
          (status === 404 || status === 400) &&
          (errorMsg.includes('not found') || errorMsg.includes('no longer available') || errorMsg.includes('Update to models/'))
        ) {
          // Model deprecated / not found on this account, try next candidate model
          lastError = new Error(`AI_MODEL_UNAVAILABLE: Model '${model}' is unavailable: ${errorMsg}`);
          continue;
        }

        if (status === 429) {
          throw new Error('AI_RATE_LIMIT: Google Gemini rate limit exceeded. Please wait a moment and try again.');
        }

        if (status === 503) {
          // Overloaded, try next candidate or wait briefly
          lastError = new Error('AI_OVERLOADED: Google Gemini is currently experiencing heavy traffic. Please retry in a few moments.');
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }

        throw new Error(`AI_PROCESSING_ERROR: ${errorMsg}`);
      }

      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content || content.trim().length === 0) {
        throw new Error('AI_EMPTY_RESPONSE: Google Gemini returned an empty response. Please verify the uploaded document contains clear text.');
      }

      return content;
    } catch (err) {
      if (err.name === 'TimeoutError' || err.message?.includes('aborted')) {
        lastError = new Error('AI_TIMEOUT: The AI request timed out. Please try again with a shorter document section or wait a moment.');
        continue;
      }
      if (
        err.message.startsWith('AI_RATE_LIMIT') ||
        err.message.startsWith('AI_PROCESSING_ERROR') ||
        err.message.startsWith('AI_NOT_CONFIGURED')
      ) {
        throw err;
      }
      lastError = err;
    }
  }

  throw lastError || new Error('AI_PROCESSING_ERROR: Failed to obtain a valid response from Google Gemini.');
}

/**
 * Calls OpenAI API (if configured)
 */
async function callOpenAiApi({ systemPrompt, userPrompt, temperature = 0.3 }) {
  const client = getOpenAiClient();
  if (!client) {
    throw new Error('AI_NOT_CONFIGURED: OpenAI API key is missing. Please configure AI_API_KEY in server/.env.');
  }

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userPrompt });

  try {
    const response = await client.chat.completions.create({
      model: env.AI_MODEL || 'gpt-4o-mini',
      messages,
      temperature,
      response_format: { type: 'json_object' }
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('AI_EMPTY_RESPONSE: OpenAI returned an empty response.');
    }
    return content;
  } catch (err) {
    logger.error('OpenAI processing error:', { error: err.message });
    throw new Error(`AI_PROCESSING_ERROR: ${err.message}`);
  }
}

/**
 * Unified AI dispatch: defaults to Google Gemini
 */
async function generateAiJson({ systemPrompt, userPrompt, temperature = 0.3 }) {
  const provider = (env.AI_PROVIDER || 'gemini').toLowerCase();

  if (provider === 'openai') {
    return callOpenAiApi({ systemPrompt, userPrompt, temperature });
  }

  return callGeminiApi({ systemPrompt, userPrompt, temperature });
}

/**
 * Extracts and parses JSON from model responses (handles markdown code blocks)
 */
function parseJsonFromResponse(rawText) {
  if (!rawText) {
    throw new Error('AI_EMPTY_RESPONSE: Received empty response from AI.');
  }
  let text = rawText.trim();

  // Strip markdown code fences if present (e.g. ```json ... ```)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    text = jsonMatch[1].trim();
  }

  try {
    return JSON.parse(text);
  } catch {
    // Attempt to locate outer { ... } or [ ... ]
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(text.slice(firstBrace, lastBrace + 1));
      } catch {}
    }
    throw new Error('AI_INVALID_JSON: The AI provider returned a response that could not be parsed as valid JSON.');
  }
}

/**
 * 1. SIMPLIFY STUDY NOTES
 * Returns valid structured notes with readable simplified text, key points, and definitions.
 * Safe error handling: never returns fabricated notes data.
 */
export async function simplifyNotes(sourceText, targetAudience = 'beginner') {
  if (!sourceText || sourceText.trim().length < 20) {
    throw new Error('INVALID_INPUT: Please provide at least 20 characters of study material to simplify.');
  }

  const systemPrompt = 'You are an educational accessibility specialist. You analyze academic documents and generate structured, crystal-clear study notes. Always output valid JSON only.';
  const userPrompt = `Your task is to analyze the following academic study material and provide an accessible, crystal-clear explanation for a ${targetAudience} level student while maintaining 100% technical accuracy.

Format your output strictly as a JSON object with this exact structure:
{
  "simplifiedText": "Clear, accessible explanation written in comfortable paragraphs with clean language, analogies where helpful, and logical flow.",
  "keyPoints": [
    "Core takeaway 1",
    "Core takeaway 2",
    "Core takeaway 3",
    "Core takeaway 4",
    "Core takeaway 5"
  ],
  "definitions": [
    {
      "term": "Key Technical Term",
      "definition": "Simple, precise explanation of the term in plain language."
    }
  ]
}

Study Material:
"""
${sourceText.slice(0, 30000)}
"""`;

  const content = await generateAiJson({ systemPrompt, userPrompt, temperature: 0.3 });
  const result = parseJsonFromResponse(content);

  if (!result || typeof result !== 'object') {
    throw new Error('AI_VALIDATION_ERROR: AI response was not a valid object.');
  }

  const simplifiedText = typeof result.simplifiedText === 'string' ? result.simplifiedText.trim() : '';
  if (!simplifiedText || simplifiedText.length < 20) {
    throw new Error('AI_VALIDATION_ERROR: AI did not generate sufficient simplified explanation text.');
  }

  const keyPoints = Array.isArray(result.keyPoints)
    ? result.keyPoints.map(p => String(p).trim()).filter(Boolean)
    : [];
  if (keyPoints.length === 0) {
    throw new Error('AI_VALIDATION_ERROR: AI did not provide key takeaways/points.');
  }

  const definitions = Array.isArray(result.definitions)
    ? result.definitions.map(d => ({
        term: String(d?.term || '').trim(),
        definition: String(d?.definition || '').trim()
      })).filter(d => d.term && d.definition)
    : [];

  return {
    simplifiedText,
    keyPoints,
    keyTakeaways: keyPoints, // Alias for frontend compatibility
    definitions
  };
}

/**
 * 2. GENERATE INTERACTIVE CONCEPT MAP
 * Returns valid concept map data with nodes and edges.
 * Safe error handling: never returns fabricated map nodes or edges.
 */
export async function generateConceptMapAi(sourceText, title = 'Concept Map') {
  if (!sourceText || sourceText.trim().length < 20) {
    throw new Error('INVALID_INPUT: Please provide study material or context to generate a concept map.');
  }

  const systemPrompt = 'You are an educational knowledge graph generator. Analyze academic texts and create structured hierarchical concept maps. Output valid JSON only.';
  const userPrompt = `Analyze the provided study material and construct an interconnected Concept Map suitable for visual rendering.

Instructions:
1. Extract 5 to 12 core concepts from the text.
2. Root concept MUST have id "root", level 0, importance "high", and label representing the overall topic.
3. Major subtopics MUST have level 1 and importance "high" or "medium".
4. Specific sub-concepts MUST have level 2 and importance "medium" or "low".
5. Every node must include "details" (1-2 sentence explanation) and 2-3 "keywords".
6. Create meaningful directional edges between related concepts with descriptive action labels (e.g., "defines", "implements", "controls", "contains", "causes").

Format output strictly as a JSON object:
{
  "title": "${(title || 'Concept Map').replace(/"/g, '')}",
  "description": "Brief 1-2 sentence overview of the concept hierarchy.",
  "nodes": [
    {
      "id": "root",
      "label": "Central Topic Name",
      "description": "Clear 1-2 sentence description of central concept.",
      "level": 0,
      "details": ["Key conceptual aspect 1", "Key conceptual aspect 2"],
      "keywords": ["keyword1", "keyword2"],
      "importance": "high"
    },
    {
      "id": "concept_1",
      "label": "First Key Subtopic",
      "description": "Concise explanation of this subtopic.",
      "level": 1,
      "details": ["Specific principle or function"],
      "keywords": ["subtopic", "principle"],
      "importance": "medium"
    }
  ],
  "edges": [
    {
      "id": "e_root_concept_1",
      "source": "root",
      "target": "concept_1",
      "label": "includes"
    }
  ]
}

Study Material:
"""
${sourceText.slice(0, 30000)}
"""`;

  const content = await generateAiJson({ systemPrompt, userPrompt, temperature: 0.2 });
  const result = parseJsonFromResponse(content);

  if (!result || typeof result !== 'object') {
    throw new Error('AI_VALIDATION_ERROR: AI response was not a valid object.');
  }

  const rawNodes = Array.isArray(result.nodes) ? result.nodes : [];
  if (rawNodes.length < 2) {
    throw new Error('AI_VALIDATION_ERROR: Concept map must contain at least 2 nodes.');
  }

  const nodes = [];
  for (let index = 0; index < rawNodes.length; index++) {
    const node = rawNodes[index];
    const label = String(node?.label || node?.name || '').trim().slice(0, 80);
    if (!label) {
      throw new Error(`AI_VALIDATION_ERROR: Node at index ${index} is missing a required label.`);
    }

    const id = String(node.id || (index === 0 ? 'root' : `concept_${index}`)).trim();
    const level = typeof node.level === 'number' ? node.level : (id === 'root' || index === 0 ? 0 : 1);
    const details = Array.isArray(node.details)
      ? node.details.map(d => String(d).trim()).filter(Boolean)
      : typeof node.details === 'string' && node.details.trim()
      ? [node.details.trim()]
      : [];
    const keywords = Array.isArray(node.keywords)
      ? node.keywords.map(k => String(k).trim()).filter(Boolean)
      : [];
    const importance = ['high', 'medium', 'low'].includes(node.importance)
      ? node.importance
      : (level === 0 ? 'high' : 'medium');

    nodes.push({
      id,
      label,
      description: String(node.description || '').trim().slice(0, 300),
      level,
      details,
      keywords,
      importance
    });
  }

  // Ensure root node exists
  const hasRoot = nodes.some(n => n.id === 'root');
  if (!hasRoot && nodes[0]) {
    nodes[0].id = 'root';
    nodes[0].level = 0;
  }

  const validNodeIds = new Set(nodes.map(n => n.id));
  const rawEdges = Array.isArray(result.edges) ? result.edges : [];
  const edges = rawEdges
    .filter(edge => edge && validNodeIds.has(String(edge.source)) && validNodeIds.has(String(edge.target)))
    .map((edge, index) => ({
      id: String(edge.id || `e_${edge.source}_${edge.target}_${index}`),
      source: String(edge.source),
      target: String(edge.target),
      label: String(edge.label || 'relates to').trim().slice(0, 50)
    }));

  return {
    title: String(result.title || title || 'Generated Concept Map').trim(),
    description: String(result.description || `Concept map covering ${nodes[0]?.label || 'Study Material'}`).trim(),
    summary: String(result.description || '').trim(),
    nodes,
    edges
  };
}

/**
 * 3. GENERATE QUIZ
 * Returns valid structured quiz data with multiple choice questions.
 * Safe error handling: never returns fabricated questions or fake options.
 */
export async function generateQuizAi(sourceText, numQuestions = 5, difficulty = 'medium', topic = '') {
  if (!sourceText || sourceText.trim().length < 20) {
    throw new Error('INVALID_INPUT: Please provide study material or text to generate a quiz.');
  }

  const count = Math.min(Math.max(Number(numQuestions) || 5, 1), 10);
  const diff = ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium';

  const systemPrompt = 'You are an academic assessment designer. Generate multiple-choice questions grounded strictly in the provided study material. Output valid JSON only.';
  const userPrompt = `Generate exactly ${count} high-quality multiple-choice questions (MCQs) based strictly on the provided study material.
Difficulty level: ${diff}.

Guidelines:
1. Every question MUST test conceptual understanding of the provided study material.
2. Provide exactly 4 plausible options for each question.
3. "correctAnswer" must be an integer index from 0 to 3 pointing to the correct option.
4. "explanation" must clearly explain why the correct option is right based on the text.
5. "topicTag" must be a concise concept name from the material (e.g. "Thermodynamics", "Memory Management").

Format output strictly as a JSON object:
{
  "title": "Quiz on ${topic || 'Study Material'}",
  "difficulty": "${diff}",
  "topic": "${topic || 'General'}",
  "questions": [
    {
      "id": "q1",
      "question": "What is the primary mechanism of...?",
      "options": [
        "First option",
        "Second option",
        "Third option",
        "Fourth option"
      ],
      "correctAnswer": 0,
      "explanation": "Based on the text, the primary mechanism...",
      "topicTag": "Specific Concept"
    }
  ]
}

Study Material:
"""
${sourceText.slice(0, 30000)}
"""`;

  const content = await generateAiJson({ systemPrompt, userPrompt, temperature: 0.3 });
  const result = parseJsonFromResponse(content);

  if (!result || typeof result !== 'object') {
    throw new Error('AI_VALIDATION_ERROR: AI response was not a valid object.');
  }

  const rawQuestions = Array.isArray(result.questions) ? result.questions : [];
  if (rawQuestions.length === 0) {
    throw new Error('AI_VALIDATION_ERROR: AI returned no quiz questions.');
  }

  const questions = [];
  for (let idx = 0; idx < rawQuestions.length; idx++) {
    const q = rawQuestions[idx];
    const questionText = String(q?.question || '').trim();
    if (!questionText) {
      throw new Error(`AI_VALIDATION_ERROR: Question at index ${idx + 1} is missing question text.`);
    }

    const rawOptions = Array.isArray(q?.options)
      ? q.options.map(o => String(o).trim()).filter(Boolean)
      : [];

    if (rawOptions.length < 4) {
      throw new Error(`AI_VALIDATION_ERROR: Question "${questionText.slice(0, 40)}" must have 4 distinct non-empty options.`);
    }

    const options = rawOptions.slice(0, 4);

    let correctAnswer = Number(q.correctAnswer);
    if (isNaN(correctAnswer) || correctAnswer < 0 || correctAnswer >= options.length) {
      throw new Error(`AI_VALIDATION_ERROR: Question "${questionText.slice(0, 40)}" has invalid correctAnswer index (${q.correctAnswer}).`);
    }

    const explanation = String(q.explanation || '').trim();
    if (!explanation) {
      throw new Error(`AI_VALIDATION_ERROR: Question "${questionText.slice(0, 40)}" is missing an explanation.`);
    }

    questions.push({
      id: String(q.id || `q_${idx + 1}`),
      question: questionText,
      options,
      correctAnswer,
      explanation,
      topicTag: String(q.topicTag || topic || 'General Concept').trim().slice(0, 60)
    });
  }

  return {
    title: String(result.title || `Quiz on ${topic || 'Study Material'}`).trim(),
    difficulty: diff,
    topic: String(result.topic || topic || 'General').trim(),
    questions
  };
}

/**
 * 4. GENERATE TARGETED PRACTICE QUESTIONS
 * Safe error handling: never returns fabricated practice questions.
 */
export async function generateTargetedPracticeAi(weakTopics, numQuestions = 5, difficulty = 'medium') {
  const topicsList = Array.isArray(weakTopics) && weakTopics.length > 0 ? weakTopics.join(', ') : 'Core Concepts';
  const count = Math.min(Math.max(Number(numQuestions) || 5, 1), 10);
  const diff = ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium';

  const systemPrompt = 'You are an educational tutor designing targeted remediation practice. Output valid JSON only.';
  const userPrompt = `The student needs targeted practice on these specific weak topics: ${topicsList}.
Generate exactly ${count} multiple-choice questions focusing specifically on these topics to strengthen understanding.
Difficulty: ${diff}.

Format output strictly as JSON:
{
  "title": "Targeted Practice: ${topicsList.slice(0, 60)}",
  "difficulty": "${diff}",
  "topic": "${topicsList.slice(0, 60)}",
  "questions": [
    {
      "id": "q1",
      "question": "Question text...",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "Clear explanation of the concept...",
      "topicTag": "Weak Topic Name"
    }
  ]
}`;

  const content = await generateAiJson({ systemPrompt, userPrompt, temperature: 0.3 });
  const result = parseJsonFromResponse(content);

  if (!result || typeof result !== 'object') {
    throw new Error('AI_VALIDATION_ERROR: AI response was not a valid object.');
  }

  const rawQuestions = Array.isArray(result.questions) ? result.questions : [];
  if (rawQuestions.length === 0) {
    throw new Error('AI_VALIDATION_ERROR: Failed to generate practice questions.');
  }

  const questions = [];
  for (let idx = 0; idx < rawQuestions.length; idx++) {
    const q = rawQuestions[idx];
    const questionText = String(q?.question || '').trim();
    if (!questionText) {
      throw new Error(`AI_VALIDATION_ERROR: Practice question at index ${idx + 1} is missing question text.`);
    }

    const rawOptions = Array.isArray(q?.options)
      ? q.options.map(o => String(o).trim()).filter(Boolean)
      : [];

    if (rawOptions.length < 4) {
      throw new Error(`AI_VALIDATION_ERROR: Practice question "${questionText.slice(0, 40)}" must have 4 distinct non-empty options.`);
    }

    const options = rawOptions.slice(0, 4);

    let correctAnswer = Number(q.correctAnswer);
    if (isNaN(correctAnswer) || correctAnswer < 0 || correctAnswer >= options.length) {
      throw new Error(`AI_VALIDATION_ERROR: Practice question "${questionText.slice(0, 40)}" has invalid correctAnswer index (${q.correctAnswer}).`);
    }

    const explanation = String(q.explanation || '').trim();
    if (!explanation) {
      throw new Error(`AI_VALIDATION_ERROR: Practice question "${questionText.slice(0, 40)}" is missing an explanation.`);
    }

    questions.push({
      id: String(q.id || `q_${idx + 1}`),
      question: questionText,
      options,
      correctAnswer,
      explanation,
      topicTag: String(q.topicTag || (Array.isArray(weakTopics) ? weakTopics[0] : 'General')).trim().slice(0, 60)
    });
  }

  return {
    title: String(result.title || `Targeted Practice: ${topicsList.slice(0, 60)}`).trim(),
    difficulty: diff,
    topic: topicsList.slice(0, 60),
    questions
  };
}
