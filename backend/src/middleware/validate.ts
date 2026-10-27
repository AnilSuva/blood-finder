import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
export function validate(schema: ZodTypeAny, source: 'body' | 'query' | 'params' = 'body'): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) return next(result.error);
    (req as unknown as Record<string, unknown>)[source] = result.data;
    return next();
  };
}
