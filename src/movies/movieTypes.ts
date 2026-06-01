export type SortOrder = "asc" | "desc";

export type MovieListItem = {
  imdbId: string;
  title: string;
  genres: string[];
  releaseDate: string | null;
  budget: string | null;
};

export type MovieDetails = MovieListItem & {
  description: string | null;
  runtime: number | null;
  averageRating: number | null;
  originalLanguage: string | null;
  productionCompanies: string[];
};

export type ListMoviesQuery = {
  page: number;
  pageSize: number;
  year?: number;
  genre?: string;
  sort?: SortOrder;
};
