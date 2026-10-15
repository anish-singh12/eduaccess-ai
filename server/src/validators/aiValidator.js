import { z } from 'zod';

export const simplifyTextSchema = z.object({
  text: z
    .string({ required_error: 'Study text is required' })
    .trim()
    .min(15, 'Study text must be at least 15 characters')
    .max(50000, 'Study text cannot exceed 50,000 characters for AI processing'),
  targetAudience: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .optional()
    .default('beginner')
});

export const generateConceptMapSchema = z.object({
  text: z
    .string({ required_error: 'Study text is required' })
    .trim()
    .min(15, 'Study text must be at least 15 characters')
    .max(50000, 'Study text cannot exceed 50,000 characters'),
  title: z
    .string()
    .trim()
    .max(120)
    .optional()
});

export const generateQuizSchema = z.object({
  text: z
    .string({ required_error: 'Study text is required' })
    .trim()
    .min(20, 'Study text must be at least 20 characters')
    .max(50000, 'Study text cannot exceed 50,000 characters'),
  numQuestions: z
    .number()
    .int()
    .min(3)
    .max(15)
    .default(5),
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .default('medium'),
  topic: z
    .string()
    .trim()
    .max(100)
    .optional()
});

export const generatePracticeSchema = z.object({
  weakTopics: z
    .array(z.string().trim().min(1).max(60))
    .min(1, 'At least one weak topic must be specified')
    .max(5),
  numQuestions: z
    .number()
    .int()
    .min(3)
    .max(10)
    .default(5),
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .default('medium')
});
