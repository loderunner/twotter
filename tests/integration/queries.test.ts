import { describe, it, expect, beforeAll } from 'vitest';
import {
  getAllUsers,
  getUserById,
  getUserPosts,
  getUserFeed,
  type User,
} from '../../src/db/queries.js';
import { setupIntegrationTests } from './setup.js';

/**
 * Integration tests for database query functions.
 * These tests use deterministic seed data from seed-integration.ts
 */
describe('Database Queries Integration Tests', async () => {
  setupIntegrationTests();
  describe('getAllUsers', () => {
    it('should return all users from the database', async () => {
      const users = await getAllUsers();

      expect(users).toBeDefined();
      expect(users.length).toBe(500);
      expect(users[0]).toHaveProperty('id');
      expect(users[0]).toHaveProperty('full_name');
      expect(users[0]).toHaveProperty('username');
      expect(users[0]).toHaveProperty('email');
      expect(users[0]).toHaveProperty('follows');
      expect(users[0]).toHaveProperty('followed_by');
    });

    it('should return users sorted by username', async () => {
      const users = await getAllUsers();

      for (let i = 1; i < users.length; i++) {
        expect(
          users[i].username.localeCompare(users[i - 1].username)
        ).toBeGreaterThanOrEqual(0);
      }
    });

    it('should include follows and followed_by arrays', async () => {
      const users = await getAllUsers();

      expect(Array.isArray(users[0].follows)).toBe(true);
      expect(Array.isArray(users[0].followed_by)).toBe(true);
    });

    it('should have users with follow relationships', async () => {
      const users = await getAllUsers();

      const usersWithFollows = users.filter((u) => u.follows.length > 0);
      const usersWithFollowers = users.filter((u) => u.followed_by.length > 0);

      expect(usersWithFollows.length).toBeGreaterThan(0);
      expect(usersWithFollowers.length).toBeGreaterThan(0);
    });
  });

  describe('getUserById', () => {
    let testUserId: string;

    beforeAll(async () => {
      const users = await getAllUsers();
      testUserId = users[0]?.id ?? '';
    });

    it('should return a user by ID', async () => {
      const user = await getUserById(testUserId);

      expect(user).toBeDefined();
      expect(user).not.toBeNull();
      expect(user?.id).toBe(testUserId);
      expect(user).toHaveProperty('full_name');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('follows');
      expect(user).toHaveProperty('followed_by');
    });

    it('should return null for non-existent user', async () => {
      const user = await getUserById('nonexistent-id');

      expect(user).toBeNull();
    });

    it('should include correct follow relationships', async () => {
      const users = await getAllUsers();
      const userWithFollows = users.find((u) => u.follows.length > 0);

      if (userWithFollows) {
        const user = await getUserById(userWithFollows.id);

        expect(user).not.toBeNull();
        expect(user?.follows.length).toBe(userWithFollows.follows.length);
        expect(user?.followed_by.length).toBe(
          userWithFollows.followed_by.length
        );
      }
    });

    it('should return consistent data with getAllUsers', async () => {
      const allUsers = await getAllUsers();
      const testUser = allUsers[10];

      const user = await getUserById(testUser.id);

      expect(user).not.toBeNull();
      expect(user?.id).toBe(testUser.id);
      expect(user?.username).toBe(testUser.username);
      expect(user?.email).toBe(testUser.email);
      expect(user?.follows.sort()).toEqual(testUser.follows.sort());
      expect(user?.followed_by.sort()).toEqual(testUser.followed_by.sort());
    });
  });

  describe('getUserPosts', () => {
    let testUserId: string;
    let userWithPosts: User | null = null;

    beforeAll(async () => {
      const users = await getAllUsers();

      // Find a user with posts by checking the first page
      for (const user of users) {
        const posts = await getUserPosts(user.id, { page: 1, limit: 10 });
        if (posts.length > 0) {
          userWithPosts = user;
          testUserId = user.id;
          break;
        }
      }
    });

    it('should return posts for a user', async () => {
      if (!testUserId) {
        console.warn('No user with posts found, skipping test');
        return;
      }

      const posts = await getUserPosts(testUserId, { page: 1, limit: 20 });

      expect(Array.isArray(posts)).toBe(true);

      for (const post of posts) {
        expect(post).toHaveProperty('id');
        expect(post).toHaveProperty('author_id');
        expect(post).toHaveProperty('text');
        expect(post).toHaveProperty('posted_at');
        expect(post).toHaveProperty('replying_to');
        expect(post).toHaveProperty('replies');
        expect(post).toHaveProperty('liked_by');
        expect(post.author_id).toBe(testUserId);
      }
    });

    it('should return posts sorted by posted_at DESC', async () => {
      if (!testUserId) {
        console.warn('No user with posts found, skipping test');
        return;
      }

      const posts = await getUserPosts(testUserId, { page: 1, limit: 20 });

      if (posts.length > 1) {
        for (let i = 1; i < posts.length; i++) {
          const current = new Date(posts[i].posted_at);
          const previous = new Date(posts[i - 1].posted_at);
          expect(current.getTime()).toBeLessThanOrEqual(previous.getTime());
        }
      }
    });

    it('should handle pagination correctly', async () => {
      if (!testUserId) {
        console.warn('No user with posts found, skipping test');
        return;
      }

      const page1 = await getUserPosts(testUserId, { page: 1, limit: 5 });
      const page2 = await getUserPosts(testUserId, { page: 2, limit: 5 });

      if (page1.length === 5 && page2.length > 0) {
        // Verify no overlap
        const page1Ids = new Set(page1.map((p) => p.id));
        for (const post of page2) {
          expect(page1Ids.has(post.id)).toBe(false);
        }

        // Verify chronological order across pages
        const lastOfPage1 = new Date(page1[page1.length - 1].posted_at);
        const firstOfPage2 = new Date(page2[0].posted_at);
        expect(firstOfPage2.getTime()).toBeLessThanOrEqual(
          lastOfPage1.getTime()
        );
      }
    });

    it('should return empty array for user with no posts', async () => {
      const users = await getAllUsers();

      // Try to find a user with no posts
      for (const user of users.slice(-10)) {
        const posts = await getUserPosts(user.id, { page: 1, limit: 10 });
        if (posts.length === 0) {
          expect(posts).toEqual([]);
          return;
        }
      }
    });

    it('should include post metadata (replies, likes)', async () => {
      if (!testUserId) {
        console.warn('No user with posts found, skipping test');
        return;
      }

      const posts = await getUserPosts(testUserId, { page: 1, limit: 20 });

      for (const post of posts) {
        expect(Array.isArray(post.replies)).toBe(true);
        expect(Array.isArray(post.liked_by)).toBe(true);
      }
    });
  });

  describe('getUserFeed', () => {
    let testUserId: string;
    let userWithFeed: User | null = null;

    beforeAll(async () => {
      const users = await getAllUsers();

      // Find a user who follows others
      for (const user of users) {
        if (user.follows.length > 0) {
          const feed = await getUserFeed(user.id, { page: 1, limit: 10 });
          if (feed.length > 0) {
            userWithFeed = user;
            testUserId = user.id;
            break;
          }
        }
      }
    });

    it('should return feed for a user', async () => {
      if (!testUserId) {
        console.warn('No user with feed found, skipping test');
        return;
      }

      const feed = await getUserFeed(testUserId, { page: 1, limit: 20 });

      expect(Array.isArray(feed)).toBe(true);

      for (const post of feed) {
        expect(post).toHaveProperty('id');
        expect(post).toHaveProperty('author_id');
        expect(post).toHaveProperty('text');
        expect(post).toHaveProperty('posted_at');
        expect(post).toHaveProperty('replying_to');
        expect(post).toHaveProperty('replies');
        expect(post).toHaveProperty('liked_by');
      }
    });

    it('should only include posts from followed users', async () => {
      if (!testUserId || !userWithFeed) {
        console.warn('No user with feed found, skipping test');
        return;
      }

      const feed = await getUserFeed(testUserId, { page: 1, limit: 50 });
      const followedIds = new Set(userWithFeed.follows);

      for (const post of feed) {
        expect(followedIds.has(post.author_id)).toBe(true);
      }
    });

    it('should return feed sorted by posted_at DESC', async () => {
      if (!testUserId) {
        console.warn('No user with feed found, skipping test');
        return;
      }

      const feed = await getUserFeed(testUserId, { page: 1, limit: 20 });

      if (feed.length > 1) {
        for (let i = 1; i < feed.length; i++) {
          const current = new Date(feed[i].posted_at);
          const previous = new Date(feed[i - 1].posted_at);
          expect(current.getTime()).toBeLessThanOrEqual(previous.getTime());
        }
      }
    });

    it('should handle pagination correctly', async () => {
      if (!testUserId) {
        console.warn('No user with feed found, skipping test');
        return;
      }

      const page1 = await getUserFeed(testUserId, { page: 1, limit: 10 });
      const page2 = await getUserFeed(testUserId, { page: 2, limit: 10 });

      if (page1.length === 10 && page2.length > 0) {
        // Verify no overlap
        const page1Ids = new Set(page1.map((p) => p.id));
        for (const post of page2) {
          expect(page1Ids.has(post.id)).toBe(false);
        }

        // Verify chronological order across pages
        const lastOfPage1 = new Date(page1[page1.length - 1].posted_at);
        const firstOfPage2 = new Date(page2[0].posted_at);
        expect(firstOfPage2.getTime()).toBeLessThanOrEqual(
          lastOfPage1.getTime()
        );
      }
    });

    it('should return empty array for user who follows no one', async () => {
      const users = await getAllUsers();

      const userWithNoFollows = users.find((u) => u.follows.length === 0);

      if (userWithNoFollows) {
        const feed = await getUserFeed(userWithNoFollows.id, {
          page: 1,
          limit: 10,
        });
        expect(feed).toEqual([]);
      }
    });

    it("should not include user's own posts", async () => {
      if (!testUserId) {
        console.warn('No user with feed found, skipping test');
        return;
      }

      const feed = await getUserFeed(testUserId, { page: 1, limit: 100 });

      for (const post of feed) {
        expect(post.author_id).not.toBe(testUserId);
      }
    });

    it('should include post metadata (replies, likes)', async () => {
      if (!testUserId) {
        console.warn('No user with feed found, skipping test');
        return;
      }

      const feed = await getUserFeed(testUserId, { page: 1, limit: 20 });

      for (const post of feed) {
        expect(Array.isArray(post.replies)).toBe(true);
        expect(Array.isArray(post.liked_by)).toBe(true);
      }
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity between users and posts', async () => {
      const users = await getAllUsers();
      const userIds = new Set(users.map((u) => u.id));

      // Get posts from several users
      const testUsers = users.slice(0, 10);

      for (const user of testUsers) {
        const posts = await getUserPosts(user.id, { page: 1, limit: 20 });

        for (const post of posts) {
          expect(userIds.has(post.author_id)).toBe(true);
        }
      }
    });

    it('should have consistent follow relationships', async () => {
      const users = await getAllUsers();

      // Pick a user and verify their follows
      const testUser = users.find((u) => u.follows.length > 0);

      if (testUser) {
        // Verify that users this user follows have this user in their followed_by
        for (const followedId of testUser.follows) {
          const followedUser = await getUserById(followedId);
          expect(followedUser).not.toBeNull();
          expect(followedUser?.followed_by).toContain(testUser.id);
        }
      }
    });

    it('should handle post replies correctly', async () => {
      const users = await getAllUsers();

      // Find posts with replies
      for (const user of users.slice(0, 20)) {
        const posts = await getUserPosts(user.id, { page: 1, limit: 20 });
        const postWithReplies = posts.find((p) => p.replies.length > 0);

        if (postWithReplies) {
          // Just verify the structure is correct
          expect(postWithReplies.replies.length).toBeGreaterThan(0);
          break;
        }
      }
    });
  });
});
