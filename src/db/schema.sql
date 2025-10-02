-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  replying_to TEXT REFERENCES posts(id) ON DELETE SET NULL
);

-- Follows table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS follows (
  follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followed_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, followed_id),
  CHECK (follower_id != followed_id)
);

-- Likes table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS likes (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_posted_at ON posts(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_replying_to ON posts(replying_to);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed_id ON follows(followed_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

