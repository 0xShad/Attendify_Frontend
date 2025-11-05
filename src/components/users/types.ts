"use client";

import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  role: z.string(),
  status: z.string(),
  lastActive: z.string().optional(),
  avatar: z.string().optional(),
});

export type User = z.infer<typeof userSchema>;


