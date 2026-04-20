import { z } from 'zod';
import { HttpError } from '../errors/httpError.js';

const emptyQuerySchema = z.object({}).strict();
const streamQuerySchema = z
  .object({
    sinceTick: z.coerce.number().int().min(0).optional()
  })
  .strict();

const parseQuery = <TOutput>(schema: z.ZodType<TOutput>, query: unknown): TOutput => {
  const result = schema.safeParse(query);
  if (!result.success) {
    throw new HttpError(400, 'Invalid query parameters', result.error.issues);
  }

  return result.data;
};

export const parseEmptyQuery = (query: unknown): Record<string, never> => {
  return parseQuery(emptyQuerySchema, query);
};

export const parseStreamQuery = (query: unknown): { sinceTick?: number } => {
  return parseQuery(streamQuerySchema, query);
};
