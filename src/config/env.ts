import path from "node:path";
import { config as loadDotEnv } from "dotenv";
import { z } from "zod";

loadDotEnv();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  MOVIES_DB_PATH: z.string().min(1).default("./db/movies.db"),
  RATINGS_DB_PATH: z.string().min(1).default("./db/ratings.db")
});

export type AppConfig = {
  environment: "development" | "test" | "production";
  port: number;
  moviesDbPath: string;
  ratingsDbPath: string;
  pageSize: number;
};

export function loadConfig(
  overrides: Partial<Pick<AppConfig, "moviesDbPath" | "ratingsDbPath">> = {}
): AppConfig {
  const parsed = envSchema.parse(process.env);

  return {
    environment: parsed.NODE_ENV,
    port: parsed.PORT,
    moviesDbPath: overrides.moviesDbPath ?? path.resolve(parsed.MOVIES_DB_PATH),
    ratingsDbPath:
      overrides.ratingsDbPath ?? path.resolve(parsed.RATINGS_DB_PATH),
    pageSize: 50
  };
}
