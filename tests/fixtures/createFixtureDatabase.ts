import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";

export type FixtureDatabase = {
  dir: string;
  moviesDbPath: string;
  ratingsDbPath: string;
  cleanup: () => void;
};

export function createFixtureDatabase(): FixtureDatabase {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "movie-api-"));
  const moviesDbPath = path.join(dir, "movies.db");
  const ratingsDbPath = path.join(dir, "ratings.db");

  createMoviesDatabase(moviesDbPath);
  createRatingsDatabase(ratingsDbPath);

  return {
    dir,
    moviesDbPath,
    ratingsDbPath,
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true })
  };
}

function createMoviesDatabase(filePath: string): void {
  const db = new Database(filePath);

  db.exec(`
    CREATE TABLE movies (
      id INTEGER PRIMARY KEY,
      imdb_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      overview TEXT,
      release_date TEXT NOT NULL,
      budget INTEGER NOT NULL,
      runtime INTEGER,
      genres TEXT NOT NULL,
      original_language TEXT,
      production_companies TEXT
    );
  `);

  const insertMovie = db.prepare(`
    INSERT INTO movies (
      id,
      imdb_id,
      title,
      overview,
      release_date,
      budget,
      runtime,
      genres,
      original_language,
      production_companies
    ) VALUES (
      @id,
      @imdbId,
      @title,
      @overview,
      @releaseDate,
      @budget,
      @runtime,
      @genres,
      @originalLanguage,
      @productionCompanies
    )
  `);

  const insertMany = db.transaction(() => {
    for (let index = 1; index <= 55; index += 1) {
      const isAction = index % 2 === 0;
      insertMovie.run({
        id: index,
        imdbId: `tt${String(index).padStart(7, "0")}`,
        title: `Fixture Movie ${index}`,
        overview: `Fixture description ${index}`,
        releaseDate:
          index <= 3 ? `1999-01-0${index}` : `2000-02-${String(index % 28 + 1).padStart(2, "0")}`,
        budget: index * 1000000,
        runtime: 90 + index,
        genres: JSON.stringify([{ name: isAction ? "Action" : "Drama" }]),
        originalLanguage: "en",
        productionCompanies: JSON.stringify([{ name: `Studio ${index}` }])
      });
    }
  });

  insertMany();
  db.close();
}

function createRatingsDatabase(filePath: string): void {
  const db = new Database(filePath);

  db.exec(`
    CREATE TABLE ratings (
      user_id INTEGER NOT NULL,
      movie_id INTEGER NOT NULL,
      rating REAL NOT NULL
    );
  `);

  const insertRating = db.prepare(`
    INSERT INTO ratings (user_id, movie_id, rating)
    VALUES (@userId, @movieId, @rating)
  `);

  insertRating.run({ userId: 1, movieId: 1, rating: 4 });
  insertRating.run({ userId: 2, movieId: 1, rating: 5 });
  insertRating.run({ userId: 3, movieId: 2, rating: 3 });

  db.close();
}
