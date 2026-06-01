import { Router } from "express";
import { asyncHandler } from "../http/asyncHandler.js";
import type { MovieController } from "../movies/movieController.js";

export function createMovieRouter(controller: MovieController): Router {
  const router = Router();

  router.get(
    "/movies",
    asyncHandler(async (req, res) => controller.listMovies(req, res))
  );
  router.get(
    "/movies/year/:year",
    asyncHandler(async (req, res) => controller.listMoviesByYear(req, res))
  );
  router.get(
    "/movies/genre/:genre",
    asyncHandler(async (req, res) => controller.listMoviesByGenre(req, res))
  );
  router.get(
    "/movies/:imdbId",
    asyncHandler(async (req, res) => controller.getMovieDetails(req, res))
  );

  return router;
}
