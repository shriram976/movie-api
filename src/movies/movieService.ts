import { AppError } from "../http/errors.js";
import { paginate, type PaginatedResult } from "../http/pagination.js";
import type { MovieRepository } from "./movieRepository.js";
import type { ListMoviesQuery, MovieDetails, MovieListItem } from "./movieTypes.js";

export class MovieService {
  constructor(private readonly repository: MovieRepository) {}

  listMovies(query: ListMoviesQuery): PaginatedResult<MovieListItem> {
    const page = this.repository.listMovies(query);
    return paginate(page.items, page.total, query.page, query.pageSize);
  }

  getMovieDetails(imdbId: string): MovieDetails {
    const movie = this.repository.findByImdbId(imdbId);

    if (!movie) {
      throw new AppError(404, "movie_not_found", `Movie not found: ${imdbId}`);
    }

    return movie;
  }
}
