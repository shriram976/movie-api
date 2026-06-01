import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import type { AppConfig } from "./config/env.js";
import { openDatabase } from "./db/sqliteConnection.js";
import { resolveMovieSchema } from "./db/schemaResolver.js";
import { errorHandler, notFoundHandler } from "./http/errors.js";
import { MovieController } from "./movies/movieController.js";
import { MovieRepository } from "./movies/movieRepository.js";
import { MovieService } from "./movies/movieService.js";
import { createHealthRouter } from "./routes/healthRoutes.js";
import { createMovieRouter } from "./routes/movieRoutes.js";

export function createApp(config: AppConfig): express.Express {
  const db = openDatabase(config);
  let schema: ReturnType<typeof resolveMovieSchema>;

  try {
    schema = resolveMovieSchema(db);
  } catch (error) {
    db.close();
    throw error;
  }

  const repository = new MovieRepository(db, schema);
  const service = new MovieService(repository);
  const controller = new MovieController(service, config.pageSize);

  const app = express();
  app.locals.db = db;

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  if (config.environment !== "test") {
    app.use(morgan("combined"));
  }

  app.use(createHealthRouter());
  app.use("/api/v1", createMovieRouter(controller));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export function closeApp(app: express.Express): void {
  const db = app.locals.db as { close?: () => void } | undefined;
  db?.close?.();
}
