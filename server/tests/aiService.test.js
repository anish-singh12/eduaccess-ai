import { describe, it, expect, vi } from 'vitest';
import { resolveGeminiModel } from '../src/services/aiService.js';
import { env } from '../src/config/env.js';

describe('AI Service Model Configuration & Resolution', () => {
  it('should resolve deprecated gemini-2.5-flash-lite to gemini-3.5-flash-lite', () => {
    expect(resolveGeminiModel('gemini-2.5-flash-lite')).toBe('gemini-3.5-flash-lite');
    expect(resolveGeminiModel('models/gemini-2.5-flash-lite')).toBe('gemini-3.5-flash-lite');
  });

  it('should resolve deprecated gemini-1.5-flash and gemini-2.5-flash to gemini-3.5-flash-lite', () => {
    expect(resolveGeminiModel('gemini-1.5-flash')).toBe('gemini-3.5-flash-lite');
    expect(resolveGeminiModel('gemini-2.0-flash')).toBe('gemini-3.5-flash-lite');
    expect(resolveGeminiModel('gemini-2.5-flash')).toBe('gemini-3.5-flash-lite');
    expect(resolveGeminiModel('')).toBe('gemini-3.5-flash-lite');
    expect(resolveGeminiModel(null)).toBe('gemini-3.5-flash-lite');
  });

  it('should preserve valid modern models like gemini-3.5-flash-lite', () => {
    expect(resolveGeminiModel('gemini-3.5-flash-lite')).toBe('gemini-3.5-flash-lite');
    expect(resolveGeminiModel('models/gemini-3.5-flash-lite')).toBe('gemini-3.5-flash-lite');
    expect(resolveGeminiModel('gemini-3.8-flash')).toBe('gemini-3.8-flash');
  });

  it('should have gemini-3.5-flash-lite configured in active env', () => {
    expect(env.AI_MODEL).toBe('gemini-3.5-flash-lite');
  });
});

describe('AI Validation and Anti-Fabrication Safeguards', () => {
  it('should throw an error if input text is too short for notes simplification', async () => {
    const { simplifyNotes } = await import('../src/services/aiService.js');
    await expect(simplifyNotes('Too short')).rejects.toThrow('INVALID_INPUT');
  });

  it('should throw an error if input text is too short for concept map generation', async () => {
    const { generateConceptMapAi } = await import('../src/services/aiService.js');
    await expect(generateConceptMapAi('Too short')).rejects.toThrow('INVALID_INPUT');
  });

  it('should throw an error if input text is too short for quiz generation', async () => {
    const { generateQuizAi } = await import('../src/services/aiService.js');
    await expect(generateQuizAi('Too short')).rejects.toThrow('INVALID_INPUT');
  });
});
