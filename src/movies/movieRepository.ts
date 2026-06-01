import type { DatabaseConnection } from "../db/sqliteConnection.js";
import { columnRef, qualifiedTable } from "../db/sql.js";
import type { MovieSchema } from "../db/schemaResolver.js";
import { toMovieDetails, toMovieListItem, type MovieRow } from "./movieMapper.js";
import type { ListMoviesQuery, MovieDetails, MovieListItem } from "./movieTypes.js";

type CountRow = {
  total: number;
};

export type MoviePage = {
  items: MovieListItem[];
  total: number;
};

export class MovieRepository {
  constructor(
    private readonly db: DatabaseConnection,
    private readonly schema: MovieSchema
  ) {}

  listMovies(query: ListMoviesQuery): MoviePage {
    const where = this.buildWhereClause(query);
    const params = where.params;
    const orderBy = query.year
      ? `ORDER BY date(${this.movieColumn("releaseDate")}) ${query.sort ?? "asc"}, ${this.movieColumn("title")} ASC`
      : `ORDER BY ${this.movieColumn("movieId")} ASC`;

    const total = this.db
      .prepare(`${this.countSql()} ${where.sql}`)
      .get(params) as CountRow;

    const rows = this.db
      .prepare(
        `${this.listSql()} ${where.sql} ${orderBy} LIMIT @limit OFFSET @offset`
      )
      .all({
        ...params,
        limit: query.pageSize,
        offset: (query.page - 1) * query.pageSize
      }) as MovieRow[];

    return {
      items: rows.map(toMovieListItem),
      total: total.total
    };
  }

  findByImdbId(imdbId: string): MovieDetails | null {
    const row = this.db
      .prepare(
        `${this.detailSql()} WHERE ${this.movieColumn("imdbId")} = @imdbId LIMIT 1`
      )
      .get({ imdbId }) as MovieRow | undefined;

    return row ? toMovieDetails(row) : null;
  }

  private buildWhereClause(query: ListMoviesQuery): {
    sql: string;
    params: Record<string, unknown>;
  } {
    const conditions: string[] = [];
    const params: Record<string, unknown> = {};

    if (query.year) {
      conditions.push(`strftime('%Y', ${this.movieColumn("releaseDate")}) = @year`);
      params.year = String(query.year);
    }

    if (query.genre) {
      conditions.push(`LOWER(${this.movieColumn("genres")}) LIKE @genre`);
      params.genre = `%${query.genre.toLowerCase()}%`;
    }

    return {
      sql: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
      params
    };
  }

  private countSql(): string {
    return `SELECT COUNT(*) AS total FROM ${this.moviesTable()} AS "m"`;
  }

  private listSql(): string {
    return `
      SELECT
        ${this.movieColumn("imdbId")} AS imdb_id,
        ${this.movieColumn("title")} AS title,
        ${this.movieColumn("genres")} AS genres,
        ${this.movieColumn("releaseDate")} AS release_date,
        ${this.movieColumn("budget")} AS budget
      FROM ${this.moviesTable()} AS "m"
    `;
  }

  private detailSql(): string {
    return `
      SELECT
        ${this.movieColumn("imdbId")} AS imdb_id,
        ${this.movieColumn("title")} AS title,
        ${this.nullableMovieColumn("description")} AS description,
        ${this.movieColumn("releaseDate")} AS release_date,
        ${this.movieColumn("budget")} AS budget,
        ${this.nullableMovieColumn("runtime")} AS runtime,
        ${this.averageRatingSql()} AS average_rating,
        ${this.movieColumn("genres")} AS genres,
        ${this.nullableMovieColumn("originalLanguage")} AS original_language,
        ${this.nullableMovieColumn("productionCompanies")} AS production_companies
      FROM ${this.moviesTable()} AS "m"
    `;
  }

  private averageRatingSql(): string {
    const rating = this.ratingColumn("rating");
    const ratingsTable = this.ratingsTable();
    const movieRef = this.schema.ratings.columns.movieRef;
    const imdbRef = this.schema.ratings.columns.imdbRef;

    if (imdbRef) {
      return `(
        SELECT ROUND(AVG(CAST(${rating} AS REAL)), 2)
        FROM ${ratingsTable} AS "r"
        WHERE ${columnRef("r", imdbRef)} = ${this.movieColumn("imdbId")}
      )`;
    }

    if (movieRef) {
      return `(
        SELECT ROUND(AVG(CAST(${rating} AS REAL)), 2)
        FROM ${ratingsTable} AS "r"
        WHERE CAST(${columnRef("r", movieRef)} AS TEXT) = CAST(${this.movieColumn("movieId")} AS TEXT)
      )`;
    }

    return "NULL";
  }

  private movieColumn(column: keyof MovieSchema["movies"]["columns"]): string {
    const columnName = this.schema.movies.columns[column];

    if (!columnName) {
      throw new Error(`Movie column is not available: ${String(column)}`);
    }

    return columnRef("m", columnName);
  }

  private nullableMovieColumn(
    column: keyof MovieSchema["movies"]["columns"]
  ): string {
    const columnName = this.schema.movies.columns[column];
    return columnName ? columnRef("m", columnName) : "NULL";
  }

  private ratingColumn(column: keyof MovieSchema["ratings"]["columns"]): string {
    const columnName = this.schema.ratings.columns[column];

    if (!columnName) {
      throw new Error(`Rating column is not available: ${String(column)}`);
    }

    return columnRef("r", columnName);
  }

  private moviesTable(): string {
    return qualifiedTable(this.schema.movies.schema, this.schema.movies.table);
  }

  private ratingsTable(): string {
    return qualifiedTable(this.schema.ratings.schema, this.schema.ratings.table);
  }
}
