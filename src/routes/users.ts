import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  getUserPosts,
  getUserFeed,
} from '../db/queries.js';

const router: Router = Router();

/**
 * GET /users
 * Returns all users in the system
 */
router.get('/', async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /users/:id
 * Returns a specific user profile
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /users/:id/posts
 * Returns all posts by a user, paginated and sorted chronologically
 */
router.get('/:id/posts', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({ error: 'Invalid pagination parameters' });
    }

    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const posts = await getUserPosts(id, { page, limit });
    res.json(posts);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /users/:id/feed
 * Returns posts from users that this user follows, paginated and sorted chronologically
 */
router.get('/:id/feed', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({ error: 'Invalid pagination parameters' });
    }

    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const posts = await getUserFeed(id, { page, limit });
    res.json(posts);
  } catch (error) {
    console.error('Error fetching user feed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
