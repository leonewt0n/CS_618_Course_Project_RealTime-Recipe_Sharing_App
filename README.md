# Spoonful — Real-Time Recipe Sharing App

CS 618 course project. Milestone 1 delivers auth plus recipe CRUD on the MERN stack.

## Features

- Sign up / log in with JWT, over GraphQL
- Create, view, edit, and delete your own recipes
- Each recipe has a title, ingredient list, and image URL
- Logged-in users can like and unlike recipes
- Every recipe shows its like count
- Sort the list by popularity, or show popular recipes only
- Top recipes are ranked with a MongoDB aggregation (`$group` + `$sum`)

## Requirements

- Node.js 20+
- MongoDB running on `localhost:27017` (Docker works well)

## Backend

```bash
cd backend
cp .env.template .env   # if needed
npm install
npm run dev
```

GraphQL: `http://localhost:3001/graphql`

## Frontend

```bash
# from repo root
npm install
npm run dev
```

App: `http://localhost:5173` (Vite default)

Ensure `.env` contains:

```
VITE_BACKEND_URL=http://localhost:3001
```

## Docker Compose

```bash
docker compose up
```

## Tests

```bash
cd backend
npm test
```
