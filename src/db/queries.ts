import { pool } from './client.js';

/**
 * User data structure from database
 */
export type User = {
  id: string;
  full_name: string;
  username: string;
  email: string;
  follows: string[];
  followed_by: string[];
};

/**
 * Post data structure from database
 */
export type Post = {
  id: string;
  author_id: string;
  text: string;
  posted_at: string;
  replying_to: string | null;
  replies: string[];
  liked_by: string[];
};

/**
 * Pagination parameters
 */
export type PaginationParams = {
  page: number;
  limit: number;
};

/**
 * Get all users
 */
export async function getAllUsers(): Promise<User[]> {
  const { rows: users } = await pool.query<{
    id: string;
    full_name: string;
    username: string;
    email: string;
  }>('SELECT id, full_name, username, email FROM users ORDER BY username');

  const userIds = users.map((u) => u.id);

  if (userIds.length === 0) {
    return [];
  }

  const { rows: follows } = await pool.query<{
    follower_id: string;
    followed_id: string;
  }>(
    'SELECT follower_id, followed_id FROM follows WHERE follower_id = ANY($1) OR followed_id = ANY($1)',
    [userIds]
  );

  const followsMap = new Map<string, string[]>();
  const followedByMap = new Map<string, string[]>();

  for (const user of users) {
    followsMap.set(user.id, []);
    followedByMap.set(user.id, []);
  }

  for (const follow of follows) {
    const followerFollows = followsMap.get(follow.follower_id);
    if (followerFollows) {
      followerFollows.push(follow.followed_id);
    }

    const followedFollowedBy = followedByMap.get(follow.followed_id);
    if (followedFollowedBy) {
      followedFollowedBy.push(follow.follower_id);
    }
  }

  return users.map((user) => ({
    ...user,
    follows: followsMap.get(user.id) || [],
    followed_by: followedByMap.get(user.id) || [],
  }));
}

/**
 * Get a user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const { rows: users } = await pool.query<{
    id: string;
    full_name: string;
    username: string;
    email: string;
  }>('SELECT id, full_name, username, email FROM users WHERE id = $1', [id]);

  if (users.length === 0) {
    return null;
  }

  const user = users[0];

  const { rows: follows } = await pool.query<{ followed_id: string }>(
    'SELECT followed_id FROM follows WHERE follower_id = $1',
    [id]
  );

  const { rows: followedBy } = await pool.query<{ follower_id: string }>(
    'SELECT follower_id FROM follows WHERE followed_id = $1',
    [id]
  );

  return {
    ...user,
    follows: follows.map((f) => f.followed_id),
    followed_by: followedBy.map((f) => f.follower_id),
  };
}

/**
 * Get posts by a user with pagination
 */
export async function getUserPosts(
  userId: string,
  { page, limit }: PaginationParams
): Promise<Post[]> {
  const offset = (page - 1) * limit;

  const { rows: posts } = await pool.query<{
    id: string;
    author_id: string;
    text: string;
    posted_at: Date;
    replying_to: string | null;
  }>(
    `SELECT id, author_id, text, posted_at, replying_to 
     FROM posts 
     WHERE author_id = $1 
     ORDER BY posted_at DESC 
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return enrichPosts(posts);
}

/**
 * Get feed for a user (posts from users they follow) with pagination
 */
export async function getUserFeed(
  userId: string,
  { page, limit }: PaginationParams
): Promise<Post[]> {
  const offset = (page - 1) * limit;

  const { rows: posts } = await pool.query<{
    id: string;
    author_id: string;
    text: string;
    posted_at: Date;
    replying_to: string | null;
  }>(
    `SELECT p.id, p.author_id, p.text, p.posted_at, p.replying_to 
     FROM posts p
     INNER JOIN follows f ON p.author_id = f.followed_id
     WHERE f.follower_id = $1 
     ORDER BY p.posted_at DESC 
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return enrichPosts(posts);
}

/**
 * Enrich posts with replies and likes
 */
async function enrichPosts(
  posts: {
    id: string;
    author_id: string;
    text: string;
    posted_at: Date;
    replying_to: string | null;
  }[]
): Promise<Post[]> {
  if (posts.length === 0) {
    return [];
  }

  const postIds = posts.map((p) => p.id);

  const { rows: replies } = await pool.query<{
    replying_to: string;
    id: string;
  }>('SELECT replying_to, id FROM posts WHERE replying_to = ANY($1)', [
    postIds,
  ]);

  const { rows: likes } = await pool.query<{
    post_id: string;
    user_id: string;
  }>('SELECT post_id, user_id FROM likes WHERE post_id = ANY($1)', [postIds]);

  const repliesMap = new Map<string, string[]>();
  const likesMap = new Map<string, string[]>();

  for (const post of posts) {
    repliesMap.set(post.id, []);
    likesMap.set(post.id, []);
  }

  for (const reply of replies) {
    if (reply.replying_to) {
      const postReplies = repliesMap.get(reply.replying_to);
      if (postReplies) {
        postReplies.push(reply.id);
      }
    }
  }

  for (const like of likes) {
    const postLikes = likesMap.get(like.post_id);
    if (postLikes) {
      postLikes.push(like.user_id);
    }
  }

  return posts.map((post) => ({
    ...post,
    posted_at: post.posted_at.toISOString(),
    replies: repliesMap.get(post.id) || [],
    liked_by: likesMap.get(post.id) || [],
  }));
}
