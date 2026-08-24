import { z } from "zod";

export const registerSchema = z
    .object({
        username: z
            .string()
            .trim()
            .min(3, "Username must be at least 3 characters")
            .max(30, "Username must not exceed 30 characters"),

        email: z
            .string()
            .trim()
            .email("Please enter a valid email address")
            .toLowerCase(),

        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .max(100, "Password must not exceed 100 characters")
    })
    .strict();