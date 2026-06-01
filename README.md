# Movie API

Express API backed by the movie and rating SQLite databases.

## Local Setup

```bash
cd movie-api
npm install
cp .env.example .env
```

By default the app reads:

```text
./db/movies.db
./db/ratings.db
```

Use environment variables when the database files live somewhere else:

```bash
MOVIES_DB_PATH=/absolute/path/to/movies.db
RATINGS_DB_PATH=/absolute/path/to/ratings.db
```

## Run

```bash
npm run dev
```

The API is available at `http://localhost:3000/api/v1`.

For a compiled run:

```bash
npm run build
npm start
```

## Endpoints

```text
GET /health
GET /api/v1/movies?page=1
GET /api/v1/movies/:imdbId
GET /api/v1/movies/year/:year?page=1&sort=asc
GET /api/v1/movies/year/:year?page=1&sort=desc
GET /api/v1/movies/genre/:genre?page=1
```

List endpoints return 50 records per page. `page` is one-based.

## Checks

```bash
npm test
npm run typecheck
npm run build
```

The test suite creates SQLite fixtures and exercises the API through HTTP requests.
