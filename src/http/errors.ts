import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(404, "not_found", `Route not found: ${req.method} ${req.path}`));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: "invalid_request",
        message: "Request validation failed",
        details: error.flatten()
      }
    });
  }

  const message =
    process.env.NODE_ENV === "production"
      ? "Unexpected server error"
      : error instanceof Error
        ? error.message
        : "Unexpected server error";

  return res.status(500).json({
    error: {
      code: "internal_server_error",
      message
    }
  });
};
