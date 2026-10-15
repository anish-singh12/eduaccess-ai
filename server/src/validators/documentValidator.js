import { z } from 'zod';

export const createDocumentSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title cannot be empty')
    .max(120, 'Title cannot exceed 120 characters'),
  sourceText: z
    .string({ required_error: 'Source study text is required' })
    .trim()
    .min(10, 'Source text must be at least 10 characters')
    .max(100000, 'Source text cannot exceed 100,000 characters'),
  simplifiedText: z
    .string()
    .max(100000)
    .optional()
    .default(''),
  keyPoints: z
    .array(z.string().trim().max(500))
    .max(50)
    .optional()
    .default([]),
  definitions: z
    .array(
      z.object({
        term: z.string().trim().max(120),
        definition: z.string().trim().max(1000)
      })
    )
    .max(50)
    .optional()
    .default([])
});

export const updateDocumentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be empty')
    .max(120, 'Title cannot exceed 120 characters')
    .optional(),
  sourceText: z
    .string()
    .trim()
    .min(10, 'Source text must be at least 10 characters')
    .max(100000)
    .optional(),
  simplifiedText: z
    .string()
    .max(100000)
    .optional(),
  keyPoints: z
    .array(z.string().trim().max(500))
    .max(50)
    .optional(),
  definitions: z
    .array(
      z.object({
        term: z.string().trim().max(120),
        definition: z.string().trim().max(1000)
      })
    )
    .max(50)
    .optional()
});
