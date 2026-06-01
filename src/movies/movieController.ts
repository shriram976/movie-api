import type { Request, Response } from "express";
import { z } from "zod";
import type { MovieService } from "./movieService.js";
import type { SortOrder } from "./movieTypes.js";

const pageSchema = z.coerce.number().int().min(1).max(10_000).default(1);
const yearSchema = z.coerce.number().int().min(1878).max(3000);
const imdbIdSchema = z
  .string()
  .trim()
  .regex(/^tt\d{7,10}$/i)
  .transform((value) => value.toLowerCase());
const genreSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9 &.,'/:+-]*$/);

const sortSchema = z
  .preprocess(
    (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
    z.enum(["asc", "ascending", "desc", "descending"]).optional().default("asc")
  )
  .transform((value): SortOrder => {
    if (value === "desc" || value === "descending") {
      return "desc";
    }

    return "asc";
  });

export class MovieController {
  constructor(
    private readonly service: MovieService,
    private readonly pageSize: number
  ) {}

  listMovies(req: Request, res: Response): void {
    const page = pageSchema.parse(req.query.page);
    res.json(this.service.listMovies({ page, pageSize: this.pageSize }));
  }

  getMovieDetails(req: Request, res: Response): void {
    const imdbId = imdbIdSchema.parse(req.params.imdbId);
    res.json({ data: this.service.getMovieDetails(imdbId) });
  }

  listMoviesByYear(req: Request, res: Response): void {
    const page = pageSchema.parse(req.query.page);
    const year = yearSchema.parse(req.params.year);
    const sort = sortSchema.parse(req.query.sort ?? req.query.order);

    res.json(
      this.service.listMovies({
        page,
        pageSize: this.pageSize,
        year,
        sort
      })
    );
  }

  listMoviesByGenre(req: Request, res: Response): void {
    const page = pageSchema.parse(req.query.page);
    const genre = genreSchema.parse(req.params.genre);

    res.json(
      this.service.listMovies({
        page,
        pageSize: this.pageSize,
        genre
      })
    );
  }
}
