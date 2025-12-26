/**
 * Types Index - Re-export all types from database.ts
 * 
 * Import from '@/types' for all database types:
 *   import { User, Template, Post } from '@/types';
 * 
 * Or import specific categories:
 *   import type { TemplateWithConfig, PostWithDetails } from '@/types';
 */

// Re-export everything from database types (derived from Supabase)
export * from './database';

// Re-export Database type for Supabase client
export type { Database, Json } from './supabase';
