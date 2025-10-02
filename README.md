# Twotter

A toy Twitter-like backend built with Express.js and PostgreSQL.

## Setup

### Prerequisites

- Node.js 20+
- Docker and Docker Compose

### Installation

1. Install dependencies:

```bash
pnpm install
```

2. Start PostgreSQL:

```bash
docker compose up -d
```

3. Run database migrations:

```bash
pnpm run db:migrate
```

4. Seed the database with fixture data:

```bash
pnpm run db:seed
```

5. Start the development server:

```bash
pnpm run dev
```

The API will be available at `http://localhost:3000`.

## API Endpoints

### `GET /users`

Returns all users in the system.

**Response:**

```json
[
  {
    "id": "<nanoid>",
    "full_name": "John Doe",
    "username": "johndoe419",
    "email": "john.doe@example.com",
    "follows": ["<nanoid1>", "<nanoid2>"],
    "followed_by": ["<nanoid3>", "<nanoid4>"]
  }
]
```

### `GET /users/:id`

Returns a specific user profile.

**Response:**

```json
{
  "id": "<nanoid>",
  "full_name": "John Doe",
  "username": "johndoe419",
  "email": "john.doe@example.com",
  "follows": ["<nanoid1>", "<nanoid2>"],
  "followed_by": ["<nanoid3>", "<nanoid4>"]
}
```

### `GET /users/:id/posts`

Returns all posts by a user, paginated and sorted chronologically (most recent first).

**Query Parameters:**

- `page` (default: 1) - Page number
- `limit` (default: 20, max: 100) - Number of posts per page

**Response:**

```json
[
  {
    "id": "<nanoid>",
    "author_id": "<nanoid>",
    "text": "Hello Twotter",
    "posted_at": "2025-10-02T13:05:35.166Z",
    "replying_to": "<nanoid1>",
    "replies": ["<nanoid2>", "<nanoid3>"],
    "liked_by": ["<nanoid4>", "<nanoid5>"]
  }
]
```

### `GET /users/:id/feed`

Returns posts from users that this user follows, paginated and sorted chronologically (most recent first).

**Query Parameters:**

- `page` (default: 1) - Page number
- `limit` (default: 20, max: 100) - Number of posts per page

**Response:**

```json
[
  {
    "id": "<nanoid>",
    "author_id": "<nanoid>",
    "text": "Hello Twotter",
    "posted_at": "2025-10-02T13:05:35.166Z",
    "replying_to": "<nanoid1>",
    "replies": ["<nanoid2>", "<nanoid3>"],
    "liked_by": ["<nanoid4>", "<nanoid5>"]
  }
]
```

## Database Schema

### Users

- `id` - Primary key (nanoid)
- `full_name` - User's full name
- `username` - Unique username
- `email` - Unique email address
- `created_at` - Timestamp

### Posts

- `id` - Primary key (nanoid)
- `author_id` - Foreign key to users
- `text` - Post content
- `posted_at` - Timestamp
- `replying_to` - Foreign key to posts (nullable)

### Follows

- `follower_id` - Foreign key to users
- `followed_id` - Foreign key to users
- Primary key: (follower_id, followed_id)

### Likes

- `post_id` - Foreign key to posts
- `user_id` - Foreign key to users
- Primary key: (post_id, user_id)

## Seed Data

For development with a small dataset:

```bash
pnpm run db:seed
```

For integration testing with a large dataset (wipes database first):

```bash
pnpm run db:seed:integration
```

The integration seed generates deterministic data using a seeded random number generator:

- 500 users with realistic names
- 5000 posts spread over the last 30 days
- 1000 replies to existing posts
- ~40,000 follow relationships (avg 80 follows per user)
- ~75,000 likes (avg 15 likes per post)

**Note:** The integration seed produces identical data every time for reliable testing.

## Testing

Run integration tests:

```bash
pnpm run test:integration
```

Run tests in watch mode:

```bash
pnpm run test:integration:watch
```

The integration tests automatically seed the database with deterministic data before running.

## Development

Build for production:

```bash
pnpm run build
```

Start production server:

```bash
pnpm start
```
