import { z } from 'zod';

const conceptNodeSchema = z
  .object({
    id: z.string().min(1, 'Node ID cannot be empty').max(100),
    type: z.string().optional().default('concept'),
    position: z
      .object({
        x: z.number().default(0),
        y: z.number().default(0)
      })
      .optional()
      .default({ x: 0, y: 0 }),
    data: z.record(z.any()).optional().default({}),
    label: z.string().optional(),
    description: z.string().optional(),
    level: z.number().optional(),
    details: z.any().optional(),
    keywords: z.any().optional(),
    importance: z.string().optional()
  })
  .passthrough();

const conceptEdgeSchema = z
  .object({
    id: z.string().min(1, 'Edge ID cannot be empty').max(150),
    source: z.string().min(1, 'Edge source cannot be empty').max(100),
    target: z.string().min(1, 'Edge target cannot be empty').max(100),
    label: z.string().max(200).optional().default(''),
    animated: z.boolean().optional().default(false)
  })
  .passthrough();

export const createConceptMapSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title cannot be empty')
    .max(120, 'Title cannot exceed 120 characters'),
  topic: z
    .string()
    .trim()
    .max(120)
    .optional()
    .default('General'),
  documentId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid document ID format')
    .nullable()
    .optional(),
  summary: z
    .string()
    .max(2000)
    .optional()
    .default(''),
  description: z
    .string()
    .max(2000)
    .optional()
    .default(''),
  nodes: z
    .array(conceptNodeSchema)
    .min(1, 'Concept map must contain at least 1 node')
    .max(100, 'Concept map cannot exceed 100 nodes'),
  edges: z
    .array(conceptEdgeSchema)
    .max(200, 'Concept map cannot exceed 200 edges')
    .optional()
    .default([])
});

export const updateConceptMapSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be empty')
    .max(120)
    .optional(),
  topic: z
    .string()
    .trim()
    .max(120)
    .optional(),
  documentId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid document ID format')
    .nullable()
    .optional(),
  summary: z.string().max(2000).optional(),
  description: z.string().max(2000).optional(),
  nodes: z
    .array(conceptNodeSchema)
    .min(1, 'Concept map must contain at least 1 node')
    .max(100)
    .optional(),
  edges: z
    .array(conceptEdgeSchema)
    .max(200)
    .optional()
});
