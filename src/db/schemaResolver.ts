import type { DatabaseConnection } from "./sqliteConnection.js";

type SqliteTable = {
  name: string;
};

type SqliteColumn = {
  name: string;
};

export type MovieSchema = {
  movies: {
    schema: "main";
    table: string;
    columns: {
      movieId: string;
      imdbId: string;
      title: string;
      description: string | null;
      releaseDate: string;
      budget: string;
      runtime: string | null;
      genres: string;
      originalLanguage: string | null;
      productionCompanies: string | null;
    };
  };
  ratings: {
    schema: "main" | "ratings";
    table: string;
    columns: {
      rating: string;
      movieRef: string | null;
      imdbRef: string | null;
    };
  };
};

export function resolveMovieSchema(db: DatabaseConnection): MovieSchema {
  const movieTable = findTable(db, "main", ["movies", "movie"]);
  const movieColumns = getColumns(db, "main", movieTable);

  const ratingSchema = hasTable(db, "ratings", ["ratings", "rating"])
    ? "ratings"
    : "main";
  const ratingTable = findTable(db, ratingSchema, ["ratings", "rating"]);
  const ratingColumns = getColumns(db, ratingSchema, ratingTable);

  const movieId = requiredColumn(movieColumns, [
    "movie_id",
    "movieId",
    "movieid",
    "id",
    "tmdb_id",
    "tmdbId"
  ]);

  return {
    movies: {
      schema: "main",
      table: movieTable,
      columns: {
        movieId,
        imdbId: requiredColumn(movieColumns, [
          "imdb_id",
          "imdbId",
          "imdbid"
        ]),
        title: requiredColumn(movieColumns, ["title", "original_title"]),
        description: optionalColumn(movieColumns, [
          "overview",
          "description",
          "plot",
          "summary"
        ]),
        releaseDate: requiredColumn(movieColumns, [
          "release_date",
          "releaseDate",
          "released",
          "release"
        ]),
        budget: requiredColumn(movieColumns, ["budget"]),
        runtime: optionalColumn(movieColumns, ["runtime", "duration"]),
        genres: requiredColumn(movieColumns, ["genres", "genre"]),
        originalLanguage: optionalColumn(movieColumns, [
          "original_language",
          "originalLanguage",
          "language"
        ]),
        productionCompanies: optionalColumn(movieColumns, [
          "production_companies",
          "productionCompanies",
          "companies"
        ])
      }
    },
    ratings: {
      schema: ratingSchema,
      table: ratingTable,
      columns: {
        rating: requiredColumn(ratingColumns, ["rating", "score"]),
        movieRef: optionalColumn(ratingColumns, [
          "movie_id",
          "movieId",
          "movieid",
          "tmdb_id",
          "tmdbId"
        ]),
        imdbRef: optionalColumn(ratingColumns, [
          "imdb_id",
          "imdbId",
          "imdbid"
        ])
      }
    }
  };
}

function findTable(
  db: DatabaseConnection,
  schema: string,
  candidates: string[]
): string {
  const tables = getTables(db, schema);
  const table = tables.find((candidate) =>
    candidates.some((name) => normalize(name) === normalize(candidate.name))
  );

  if (!table) {
    throw new Error(
      `Could not find table ${candidates.join(" or ")} in ${schema} database`
    );
  }

  return table.name;
}

function hasTable(
  db: DatabaseConnection,
  schema: string,
  candidates: string[]
): boolean {
  return getTables(db, schema).some((table) =>
    candidates.some((name) => normalize(name) === normalize(table.name))
  );
}

function getTables(db: DatabaseConnection, schema: string): SqliteTable[] {
  return db
    .prepare(
      `SELECT name FROM "${schema}".sqlite_master WHERE type = 'table' ORDER BY name`
    )
    .all() as SqliteTable[];
}

function getColumns(
  db: DatabaseConnection,
  schema: string,
  tableName: string
): SqliteColumn[] {
  return db
    .prepare(`PRAGMA "${schema}".table_info("${tableName.replaceAll('"', '""')}")`)
    .all() as SqliteColumn[];
}

function requiredColumn(columns: SqliteColumn[], candidates: string[]): string {
  const column = optionalColumn(columns, candidates);

  if (!column) {
    throw new Error(`Missing required column: ${candidates.join(" or ")}`);
  }

  return column;
}

function optionalColumn(
  columns: SqliteColumn[],
  candidates: string[]
): string | null {
  return (
    columns.find((column) =>
      candidates.some((candidate) => normalize(candidate) === normalize(column.name))
    )?.name ?? null
  );
}

function normalize(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}
