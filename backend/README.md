# Spoonful Backend

Express + MongoDB API for the Spoonful recipe sharing app.

## Setup

```bash
cp .env.template .env
npm install
```

Ensure MongoDB is reachable at the `DATABASE_URL` in `.env` (default `mongodb://localhost:27017/recipes`).

## Run

```bash
npm run dev   # nodemon
npm start     # production
```

## Tests

```bash
npm test
```

## API

Every operation is a GraphQL document posted to `POST /graphql`.
Send `Authorization: Bearer <token>` for mutations that need a logged-in user.

Queries: `recipes`, `recipe`, `topRecipes`, `user`, `me`.

`recipes` arguments: `author`, `sortBy` (`CREATED_AT`, `UPDATED_AT`, `LIKE_COUNT`), `sortOrder` (`ASCENDING`, `DESCENDING`), `popularOnly`.

`topRecipes` ranks recipes with a MongoDB aggregation (`$group` on likes, `$sum` the count).

Mutations: `signup`, `login`, `createRecipe`, `updateRecipe`, `deleteRecipe`, `likeRecipe`, `unlikeRecipe`.
