import { z } from 'zod';

export const loginSchema = z.union([
    // Demo login: only demo:true required
    z.object({
        demo: z.literal(true),
        email: z.string().optional(),
        password: z.string().optional(),
    }),
    // Normal login: email + password required
    z.object({
        demo: z.boolean().optional(),
        email: z.string().email('Invalid email address'),
        password: z.string().min(1, 'Password is required'),
    }),
]);

export const registerSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    email: z.string().email('Invalid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const resetPasswordRequestSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export const resetPasswordVerifySchema = z.object({
    token: z.string().min(1, 'Token is required'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});
