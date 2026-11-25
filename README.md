# Spoonful

Spoonful is a CS 618 course project: a real-time recipe sharing app. Signed-in users publish recipes, like other people's dishes, and see new recipes appear as they are created.

The app is a React frontend and an Express GraphQL API, with MongoDB for persistence and Socket.IO for live updates.

## Features

**Accounts.** Sign up and log in with a username and password. Passwords are hashed with bcrypt. Login returns a JWT that expires in 24 hours. The client stores the token and sends it as `Authorization: Bearer <token>` on protected GraphQL calls.

**Recipes.** A recipe has a title, a non-empty ingredient list, an image URL, and an author. Logged-in users can create recipes. Only the author can edit or delete a recipe. Deleting a recipe also removes its likes.

**Likes.** A logged-in user can like or unlike a recipe. Each user can like a given recipe once (unique index on user and recipe). Every recipe shows its like count and whether the current viewer has liked it.

**Browse.** The home page lists recipes with:

- filter by author username, including a "My recipes" shortcut
- sort by created date, updated date, or like count, ascending or descending
- a "Popular only" filter for recipes with at least one like
- a top-recipes panel ranked by a MongoDB aggregation (`$group` on likes, `$sum` the count)

**Live updates.** Creating a recipe broadcasts `recipe:created` (id and title) to every connected client. The UI shows a toast with a link to the new recipe (up to four at a time, each visible for 12 seconds) and refreshes the recipe list and the top-recipes panel.

## Progress

Work is on `main`. Dates and subjects below match the git history.

| Date | What landed |
| --- | --- |
| 2026-11-07 | Initial app: React client, Express API, MongoDB models, JWT signup and login, and recipe create, read, update, and delete. README named the project Spoonful and recorded Milestone 1. Docker images pinned to Node 20; the backend image omits dev dependencies and Compose points the API at the MongoDB service. |
| 2026-11-14 | REST recipe routes replaced by a GraphQL API. Likes and unlikes added. The list gained sort, author filter, and a popular-only option. Top recipes ranked with a MongoDB aggregation. Frontend and docs updated to the new API. |
| 2026-11-24 | Socket.IO added. A successful `createRecipe` emits `recipe:created`. Connected clients show a toast and refresh the recipe queries. Backend tests cover the broadcast. |

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | React 18, Vite 5, React Router 6, TanStack Query |
| API | Express 4, GraphQL (`POST /graphql`) |
| Data | MongoDB, Mongoose |
| Auth | bcrypt password hashes, JWT (`sub` = user id, 24-hour expiry) |
| Realtime | Socket.IO on the same HTTP server as Express |
| Tests | Jest, `mongodb-memory-server` |
| Tooling | ESLint, Prettier, Husky, lint-staged, Commitlint |
| Run | Node.js 20, Docker Compose (MongoDB, API, nginx frontend) |

## Requirements

- Node.js 20 or newer
- MongoDB on `localhost:27017`, or Docker

## Backend

```bash
cd backend
cp .env.template .env
npm install
npm run dev
```

`backend/.env.template`:

```
PORT=3001
DATABASE_URL=mongodb://localhost:27017/recipes
JWT_SECRET=replace-with-random-secret
```

Set `JWT_SECRET` to a long random value before sharing the app.

- API root: `http://localhost:3001`
- GraphQL: `http://localhost:3001/graphql`
- Socket.IO attaches to the same server

Production start (after `npm install`): `npm start`.

## Frontend

From the repository root:

```bash
npm install
npm run dev
```

The Vite dev server is `http://localhost:5173`.

Create a root `.env` (gitignored):

```
VITE_BACKEND_URL=http://localhost:3001
```

The client posts GraphQL to `${origin}/graphql` and opens the Socket.IO connection on that same origin. A trailing `/graphql` or `/api/v1` on `VITE_BACKEND_URL` is stripped.

## Docker Compose

```bash
docker compose up --build
```

| Service | Host port |
| --- | --- |
| MongoDB | 27017 |
| API | 3001 |
| Frontend (nginx) | 3000 |

Compose sets `JWT_SECRET` to `replace-with-random-secret`. Change that before any shared or public run. The frontend image bakes `VITE_BACKEND_URL` in at build time (`http://localhost:3001/api/v1` in `compose.yaml`). The client normalizes that value to `http://localhost:3001`, so the browser on the host still reaches GraphQL and Socket.IO.

## API

Every operation is a GraphQL document posted to `POST /graphql`. Send `Authorization: Bearer <token>` for mutations that need a logged-in user. Queries still run without a token; `likedByMe` is false and `me` is null.

**Queries**

| Field | Notes |
| --- | --- |
| `recipes` | Optional `author` (username), `sortBy` (`CREATED_AT`, `UPDATED_AT`, `LIKE_COUNT`), `sortOrder` (`ASCENDING`, `DESCENDING`), `popularOnly` |
| `recipe(id)` | One recipe, or null |
| `topRecipes(limit)` | Most liked, default 5, capped at 20 |
| `user(id)` | Username |
| `me` | Current user from the JWT |

**Mutations**

| Field | Auth |
| --- | --- |
| `signup(username, password)` | Public. Returns the new user. |
| `login(username, password)` | Public. Returns `{ token }`. |
| `createRecipe(title, ingredients, imageUrl)` | Required. Broadcasts `recipe:created`. |
| `updateRecipe(id, ...)` | Required. Author only. |
| `deleteRecipe(id)` | Required. Author only. Returns `true`. |
| `likeRecipe(id)` / `unlikeRecipe(id)` | Required. |

A fuller field list is in [`backend/README.md`](backend/README.md).

## Tests

```bash
cd backend
npm test
```

`recipes.test.js` covers create, list, get, update, delete, likes, popularity, and the GraphQL handlers. `realtime.test.js` checks that a new recipe is broadcast to a connected Socket.IO client and that `createRecipe` emits after a successful save.

## Layout

```
src/                  React app (pages, recipe UI, GraphQL client, socket)
backend/src/          Express app, GraphQL schema, Mongoose models, services
backend/src/__tests__ Jest suites
compose.yaml          MongoDB, API, and frontend
Dockerfile            Frontend image: Node build, nginx serve
```
