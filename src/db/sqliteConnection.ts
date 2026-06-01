import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import type { AppConfig } from "../config/env.js";

export type DatabaseConnection = Database.Database;

export function openDatabase(config: AppConfig): DatabaseConnection {
  assertReadableFile(config.moviesDbPath, "MOVIES_DB_PATH");
  assertReadableFile(config.ratingsDbPath, "RATINGS_DB_PATH");

  const db = new Database(config.moviesDbPath, {
    fileMustExist: true,
    readonly: true
  });

  db.pragma("foreign_keys = ON");

  if (!samePath(config.moviesDbPath, config.ratingsDbPath)) {
    db.prepare("ATTACH DATABASE ? AS ratings").run(config.ratingsDbPath);
  }

  return db;
}

function assertReadableFile(filePath: string, envName: string): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `${envName} does not point to a readable SQLite database: ${filePath}`
    );
  }
}

function samePath(left: string, right: string): boolean {
  return path.resolve(left) === path.resolve(right);
}
