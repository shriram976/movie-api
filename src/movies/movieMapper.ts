import { formatUsd } from "../utils/money.js";
import { parseNameList } from "../utils/jsonish.js";
import type { MovieDetails, MovieListItem } from "./movieTypes.js";

export type MovieRow = {
  imdb_id: string;
  title: string;
  genres: unknown;
  release_date: string | null;
  budget: unknown;
  description?: string | null;
  runtime?: unknown;
  average_rating?: unknown;
  original_language?: string | null;
  production_companies?: unknown;
};

export function toMovieListItem(row: MovieRow): MovieListItem {
  return {
    imdbId: row.imdb_id,
    title: row.title,
    genres: parseNameList(row.genres),
    releaseDate: row.release_date,
    budget: formatUsd(row.budget)
  };
}

export function toMovieDetails(row: MovieRow): MovieDetails {
  return {
    ...toMovieListItem(row),
    description: row.description ?? null,
    runtime: toNullableNumber(row.runtime),
    averageRating: toNullableNumber(row.average_rating),
    originalLanguage: row.original_language ?? null,
    productionCompanies: parseNameList(row.production_companies)
  };
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : null;
}
