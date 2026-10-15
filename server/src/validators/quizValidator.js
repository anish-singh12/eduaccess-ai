import { z } from 'zod';

export const createQuizSchema = z.object({
  title: z
    .string({ required_error: 'Quiz title is required' })
    .trim()
    .min(1, 'Title cannot be empty')
    .max(120, 'Title cannot exceed 120 characters'),
  documentId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid document ID format')
    .nullable()
    .optional(),
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .default('medium'),
  topic: z
    .string()
    .trim()
    .max(100)
    .default('General Study Material'),
  questions: z
    .array(
      z.object({
        id: z.string().min(1).max(50),
        question: z.string().min(3).max(1000),
        options: z
          .array(z.string().min(1).max(300))
          .length(4, 'Each question must have exactly 4 options'),
        correctAnswer: z.number().int().min(0).max(3),
        explanation: z.string().max(1000).optional().default(''),
        topicTag: z.string().trim().min(1).max(60)
      })
    )
    .min(1, 'Quiz must have at least 1 question')
    .max(25, 'Quiz cannot exceed 25 questions')
});

export const submitQuizAttemptSchema = z.object({
  quizId: z
    .string({ required_error: 'Quiz ID is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid quiz ID format'),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        selectedOption: z.number().int().min(-1).max(3)
      })
    )
    .default([]),
  timeSpentSeconds: z
    .number()
    .int()
    .min(0)
    .max(86400) // max 24 hrs
    .optional()
    .default(0)
});
