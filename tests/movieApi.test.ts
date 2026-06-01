import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import request from "supertest";
import { createApp, closeApp } from "../src/app.js";
import type { AppConfig } from "../src/config/env.js";
import { createFixtureDatabase, type FixtureDatabase } from "./fixtures/createFixtureDatabase.js";

describe("Movie API", () => {
  let fixture: FixtureDatabase;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    fixture = createFixtureDatabase();
    app = createApp(testConfig(fixture));
  });

  afterEach(() => {
    closeApp(app);
    fixture.cleanup();
  });

  it("lists all movies with 50 records per page", async () => {
    const response = await request(app).get("/api/v1/movies").expect(200);

    assert.equal(response.body.data.length, 50);
    assert.deepEqual(response.body.pagination, {
      page: 1,
      pageSize: 50,
      total: 55,
      totalPages: 2
    });
    assert.deepEqual(response.body.data[0], {
      imdbId: "tt0000001",
      title: "Fixture Movie 1",
      genres: ["Drama"],
      releaseDate: "1999-01-01",
      budget: "$1,000,000"
    });
  });

  it("supports changing the page", async () => {
    const response = await request(app).get("/api/v1/movies?page=2").expect(200);

    assert.equal(response.body.data.length, 5);
    assert.equal(response.body.pagination.page, 2);
  });

  it("returns movie details with an average rating from the rating database", async () => {
    const response = await request(app)
      .get("/api/v1/movies/tt0000001")
      .expect(200);

    assert.deepEqual(response.body.data, {
      imdbId: "tt0000001",
      title: "Fixture Movie 1",
      description: "Fixture description 1",
      releaseDate: "1999-01-01",
      budget: "$1,000,000",
      runtime: 91,
      averageRating: 4.5,
      genres: ["Drama"],
      originalLanguage: "en",
      productionCompanies: ["Studio 1"]
    });
  });

  it("lists movies by year in chronological order", async () => {
    const response = await request(app)
      .get("/api/v1/movies/year/1999")
      .expect(200);

    assert.deepEqual(response.body.data.map((movie: { imdbId: string }) => movie.imdbId), [
      "tt0000001",
      "tt0000002",
      "tt0000003"
    ]);
  });

  it("supports descending order for movies by year", async () => {
    const response = await request(app)
      .get("/api/v1/movies/year/1999?sort=desc")
      .expect(200);

    assert.deepEqual(response.body.data.map((movie: { imdbId: string }) => movie.imdbId), [
      "tt0000003",
      "tt0000002",
      "tt0000001"
    ]);
  });

  it("rejects unsupported sort values", async () => {
    const response = await request(app)
      .get("/api/v1/movies/year/1999?sort=random")
      .expect(400);

    assert.equal(response.body.error.code, "invalid_request");
  });

  it("rejects invalid page values", async () => {
    const response = await request(app).get("/api/v1/movies?page=0").expect(400);

    assert.equal(response.body.error.code, "invalid_request");
  });

  it("rejects malformed imdb ids", async () => {
    const response = await request(app)
      .get("/api/v1/movies/not-an-imdb-id")
      .expect(400);

    assert.equal(response.body.error.code, "invalid_request");
  });

  it("rejects malformed genre filters", async () => {
    const response = await request(app)
      .get("/api/v1/movies/genre/Action%25%25")
      .expect(400);

    assert.equal(response.body.error.code, "invalid_request");
  });

  it("lists movies by genre", async () => {
    const response = await request(app)
      .get("/api/v1/movies/genre/Action")
      .expect(200);

    assert.equal(response.body.data.length, 27);
    assert.equal(
      response.body.data.every((movie: { genres: string[] }) =>
        movie.genres.includes("Action")
      ),
      true
    );
  });

  it("returns 404 for an unknown imdb id", async () => {
    const response = await request(app)
      .get("/api/v1/movies/tt9999999")
      .expect(404);

    assert.equal(response.body.error.code, "movie_not_found");
  });
});

function testConfig(fixture: FixtureDatabase): AppConfig {
  return {
    environment: "test",
    port: 0,
    moviesDbPath: fixture.moviesDbPath,
    ratingsDbPath: fixture.ratingsDbPath,
    pageSize: 50
  };
}
