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

## API (Milestone 1)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/user/signup` | no | Create account |
| POST | `/api/v1/user/login` | no | Get JWT |
| GET | `/api/v1/users/:id` | no | Username lookup |
| GET | `/api/v1/recipes` | no | List recipes (`author`, `sortBy`, `sortOrder`) |
| GET | `/api/v1/recipes/:id` | no | Get one recipe |
| POST | `/api/v1/recipes` | JWT | Create recipe |
| PATCH | `/api/v1/recipes/:id` | JWT | Update own recipe |
| DELETE | `/api/v1/recipes/:id` | JWT | Delete own recipe |

Recipe body: `{ title, ingredients: string[], imageUrl }`
