import { QuizAttempt } from '../models/QuizAttempt.js';
import { Document } from '../models/Document.js';
import { isDatabaseConnected } from '../config/db.js';

/**
 * Computes deep learning insights from a user's real quiz attempt history.
 * Never fabricates data; handles zero-attempt empty states gracefully.
 */
export async function calculateUserInsights(userId) {
  if (!isDatabaseConnected()) {
    return {
      hasData: false,
      summary: {
        totalAttempts: 0,
        totalQuestionsAnswered: 0,
        totalCorrect: 0,
        overallAccuracy: 0,
        averageScore: 0
      },
      topicBreakdown: [],
      strongTopics: [],
      weakTopics: [],
      developingTopics: [],
      recentHistory: [],
      recommendations: [],
      message: 'Database is not connected.'
    };
  }

  const attempts = await QuizAttempt.find({ userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  if (!attempts || attempts.length === 0) {
    return {
      hasData: false,
      summary: {
        totalAttempts: 0,
        totalQuestionsAnswered: 0,
        totalCorrect: 0,
        overallAccuracy: 0,
        averageScore: 0
      },
      topicBreakdown: [],
      strongTopics: [],
      weakTopics: [],
      developingTopics: [],
      recentHistory: [],
      recommendations: [],
      message: 'No quiz attempts recorded yet. Complete your first quiz to generate personalized learning insights.'
    };
  }

  // 1. Overall Metrics
  let totalQuestionsAnswered = 0;
  let totalCorrect = 0;
  let scoreSum = 0;

  // 2. Topic aggregation
  const topicMap = new Map(); // topicTag -> { total, correct, attempts: [] }

  attempts.forEach(attempt => {
    scoreSum += attempt.percentage || 0;

    (attempt.answers || []).forEach(ans => {
      totalQuestionsAnswered += 1;
      if (ans.isCorrect) totalCorrect += 1;

      const tag = (ans.topicTag || 'General').trim();
      if (!topicMap.has(tag)) {
        topicMap.set(tag, { total: 0, correct: 0 });
      }
      const current = topicMap.get(tag);
      current.total += 1;
      if (ans.isCorrect) current.correct += 1;
    });
  });

  const overallAccuracy = totalQuestionsAnswered > 0
    ? Math.round((totalCorrect / totalQuestionsAnswered) * 100)
    : 0;

  const averageScore = attempts.length > 0
    ? Math.round(scoreSum / attempts.length)
    : 0;

  // 3. Categorize topics by mastery level
  const topicBreakdown = [];
  const strongTopics = [];
  const developingTopics = [];
  const weakTopics = [];

  for (const [tag, stats] of topicMap.entries()) {
    const accuracy = Math.round((stats.correct / stats.total) * 100);
    const item = {
      topic: tag,
      total: stats.total,
      correct: stats.correct,
      incorrect: stats.total - stats.correct,
      accuracy
    };
    topicBreakdown.push(item);

    if (accuracy >= 75) {
      strongTopics.push(item);
    } else if (accuracy >= 50) {
      developingTopics.push(item);
    } else {
      weakTopics.push(item);
    }
  }

  // Sort topic breakdowns
  topicBreakdown.sort((a, b) => a.accuracy - b.accuracy); // Weakest first
  weakTopics.sort((a, b) => a.accuracy - b.accuracy);
  strongTopics.sort((a, b) => b.accuracy - a.accuracy);

  // 4. Chronological attempt trend (reversed so oldest -> newest for charts)
  const recentHistory = [...attempts]
    .reverse()
    .slice(-15)
    .map(att => ({
      id: att._id,
      title: att.quizTitle || 'Quiz',
      score: att.score,
      total: att.totalQuestions,
      percentage: att.percentage,
      date: new Date(att.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      timestamp: att.createdAt
    }));

  // 5. Intelligent Revision Recommendations linked to real saved notes
  const userDocuments = await Document.find({ userId })
    .select('_id title keyPoints definitions')
    .lean();

  const recommendations = [];

  for (const weak of weakTopics.slice(0, 4)) {
    // Find matching document based on topic keywords
    const matchingDoc = userDocuments.find(doc => {
      const docTitle = doc.title.toLowerCase();
      const topicLower = weak.topic.toLowerCase();
      return docTitle.includes(topicLower) || topicLower.includes(docTitle);
    });

    recommendations.push({
      topic: weak.topic,
      accuracy: weak.accuracy,
      questionsMissed: weak.incorrect,
      totalQuestions: weak.total,
      reason: `Accuracy is currently ${weak.accuracy}% across ${weak.total} question${weak.total > 1 ? 's' : ''} (${weak.incorrect} missed).`,
      suggestedAction: 'Review foundational definitions and retake targeted practice.',
      linkedDocumentId: matchingDoc ? matchingDoc._id : null,
      linkedDocumentTitle: matchingDoc ? matchingDoc.title : null
    });
  }

  return {
    hasData: true,
    summary: {
      totalAttempts: attempts.length,
      totalQuestionsAnswered,
      totalCorrect,
      overallAccuracy,
      averageScore
    },
    topicBreakdown,
    strongTopics,
    weakTopics,
    developingTopics,
    recentHistory,
    recommendations
  };
}
