import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name cannot exceed 60 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address')
    .max(100, 'Email cannot exceed 100 characters'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter (A–Z)')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter (a–z)')
    .regex(/[0-9]/, 'Password must contain at least one number (0–9)')
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required')
});

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name cannot exceed 60 characters')
    .optional(),
  themePreference: z
    .enum(['light', 'dark', 'system'])
    .optional(),
  accessibilityPreferences: z
    .object({
      fontSize: z.enum(['normal', 'medium', 'large', 'x-large']).optional(),
      lineSpacing: z.enum(['normal', 'relaxed', 'loose']).optional(),
      contentWidth: z.enum(['normal', 'comfortable', 'narrow']).optional(),
      dyslexiaFont: z.boolean().optional(),
      highContrast: z.boolean().optional()
    })
    .optional()
});

export const deleteAccountSchema = z.object({
  password: z
    .string({ required_error: 'Password is required to confirm account deletion' })
    .min(1, 'Password is required')
});
