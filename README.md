# Spoonful — Real-Time Recipe Sharing App

CS 618 course project. Milestone 1 delivers auth plus recipe CRUD on the MERN stack.

## Features (Milestone 1)

- Sign up / log in with JWT
- Create, view, edit, and delete your own recipes
- Each recipe has a title, ingredient list, and image URL

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

API: `http://localhost:3001`

## Frontend

```bash
# from repo root
npm install
npm run dev
```

App: `http://localhost:5173` (Vite default)

Ensure `.env` contains:

```
VITE_BACKEND_URL=http://localhost:3001/api/v1
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
