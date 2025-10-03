import { pool } from './client.js';

/**
 * Seeded random number generator for deterministic results
 */
class SeededRandom {
  public seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Returns a random number between 0 and 1
   */
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  /**
   * Returns a random integer between min and max (inclusive)
   */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

// Seed value 42 ensures deterministic results across runs
const rng = new SeededRandom(42);

let idCounter = 0;

/**
 * Generates a deterministic ID that looks like a nanoid
 */
function generateId(): string {
  idCounter++;
  const alphabet =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const paddedCounter = String(idCounter).padStart(10, '0');
  let id = '';

  // Generate a 21-character ID deterministically from the counter
  for (let i = 0; i < 21; i++) {
    const index =
      (parseInt(paddedCounter[i % 10], 10) * (i + 1) + idCounter) %
      alphabet.length;
    id += alphabet[index];
  }

  return id;
}

/**
 * Generates a random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return rng.int(min, max);
}

/**
 * Picks a random element from an array
 */
function randomElement<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

/**
 * Picks n random unique elements from an array
 */
function randomElements<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr];
  // Fisher-Yates shuffle with seeded random
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(n, arr.length));
}

/**
 * Sample post texts
 */
const POST_TEXTS = [
  'Just shipped a new feature!',
  'Working late tonight on this bug fix.',
  'Coffee is life ☕',
  'Anyone else debugging at 2am?',
  'This code review is taking forever...',
  'Just learned something new about TypeScript!',
  'Refactoring feels so good when it works.',
  'Why do Mondays exist?',
  'Deployed to production. Fingers crossed 🤞',
  'Reading documentation is underrated.',
  'Tests are passing! Time to celebrate.',
  'Found a clever solution to that edge case.',
  'The backend is down. Again.',
  'Pair programming session was productive today.',
  'Just attended an amazing tech talk.',
  'Performance optimization complete: 40% faster!',
  'Why is this API so slow?',
  'Documentation > Code comments',
  'Excited about this new library I found.',
  'Mental health day. See you tomorrow.',
  'Finally fixed that CSS bug.',
  "The problem was DNS. It's always DNS.",
  'Just merged my PR. Feels good!',
  'Reviewing code and learning a lot.',
  'This abstraction is getting out of hand.',
  'Sometimes the simple solution is the best.',
  'Database queries are running fast now.',
  'Added proper error handling. Much better.',
  'Automated testing saves so much time.',
  'Refactored the entire module.',
  "Why didn't I write tests for this?",
  'Git conflicts resolved. Finally.',
  'The architecture is coming together nicely.',
  'Just discovered a memory leak.',
  'Fixed it! The bug was in my assumptions.',
  'Code is poetry, they said. They lied.',
  'Optimized the database indices.',
  'This feature took longer than expected.',
  'Celebrating small wins today.',
  'Time to tackle that technical debt.',
];

/**
 * Sample first names
 */
const FIRST_NAMES = [
  'Alice',
  'Bob',
  'Charlie',
  'Diana',
  'Eve',
  'Frank',
  'Grace',
  'Henry',
  'Ivy',
  'Jack',
  'Kate',
  'Leo',
  'Maya',
  'Noah',
  'Olivia',
  'Paul',
  'Quinn',
  'Rachel',
  'Sam',
  'Tara',
  'Uma',
  'Victor',
  'Wendy',
  'Xavier',
  'Yara',
  'Zoe',
  'Alex',
  'Blake',
  'Casey',
  'Drew',
  'Elliot',
  'Finley',
  'Gray',
  'Harper',
  'Jordan',
  'Kai',
  'Logan',
  'Morgan',
  'Nico',
  'Parker',
  'River',
  'Sage',
  'Taylor',
  'Avery',
  'Cameron',
  'Dakota',
  'Emerson',
  'Hayden',
  'Jules',
  'Kennedy',
];

/**
 * Sample last names
 */
const LAST_NAMES = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Gonzalez',
  'Wilson',
  'Anderson',
  'Thomas',
  'Taylor',
  'Moore',
  'Jackson',
  'Martin',
  'Lee',
  'Thompson',
  'White',
  'Harris',
  'Sanchez',
  'Clark',
  'Ramirez',
  'Lewis',
  'Robinson',
  'Walker',
  'Young',
  'Allen',
  'King',
  'Wright',
  'Scott',
  'Torres',
  'Nguyen',
  'Hill',
  'Flores',
  'Green',
  'Adams',
  'Nelson',
  'Baker',
  'Hall',
  'Rivera',
  'Campbell',
  'Mitchell',
  'Carter',
  'Roberts',
  'Gomez',
];

/**
 * Seeds the database with large dataset for integration testing.
 * Uses a seeded random number generator to ensure deterministic results.
 * Running this multiple times will produce identical data every time.
 */
async function seedIntegration() {
  // Reset RNG and ID counter for deterministic results
  idCounter = 0;
  rng.seed = 42;

  const client = await pool.connect();

  try {
    console.log('Wiping database...');

    // Delete in order due to foreign key constraints
    await client.query('DELETE FROM likes');
    await client.query('DELETE FROM follows');
    await client.query('DELETE FROM posts');
    await client.query('DELETE FROM users');

    console.log('Database wiped clean.');

    // Configuration
    const NUM_USERS = 500;
    const NUM_POSTS = 5000;
    const NUM_REPLIES = 1000;
    const AVG_FOLLOWS_PER_USER = 80;
    const AVG_LIKES_PER_POST = 15;

    console.log(`\nGenerating ${NUM_USERS} users...`);

    // Generate users
    const userIds: string[] = [];
    const usernames = new Set<string>();

    for (let i = 0; i < NUM_USERS; i++) {
      const userId = generateId();
      userIds.push(userId);

      const firstName = randomElement(FIRST_NAMES);
      const lastName = randomElement(LAST_NAMES);
      const fullName = `${firstName} ${lastName}`;

      // Generate username (deterministic based on iteration)
      const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${
        i + 1
      }`;
      usernames.add(username);

      const email = `${username}@example.com`;

      await client.query(
        'INSERT INTO users (id, full_name, username, email) VALUES ($1, $2, $3, $4)',
        [userId, fullName, username, email]
      );

      if ((i + 1) % 25 === 0) {
        console.log(`  Created ${i + 1}/${NUM_USERS} users`);
      }
    }

    console.log(`✓ Created ${NUM_USERS} users`);

    console.log(`\nGenerating follow relationships...`);

    // Generate follow relationships
    let followCount = 0;
    const followPairs = new Set<string>();

    for (const followerId of userIds) {
      const numFollows = randomInt(
        Math.max(1, AVG_FOLLOWS_PER_USER - 5),
        AVG_FOLLOWS_PER_USER + 5
      );

      const candidateFollows = userIds.filter((id) => id !== followerId);
      const toFollow = randomElements(candidateFollows, numFollows);

      for (const followedId of toFollow) {
        const pairKey = `${followerId}:${followedId}`;
        if (!followPairs.has(pairKey)) {
          followPairs.add(pairKey);
          await client.query(
            'INSERT INTO follows (follower_id, followed_id) VALUES ($1, $2)',
            [followerId, followedId]
          );
          followCount++;
        }
      }
    }

    console.log(`✓ Created ${followCount} follow relationships`);

    console.log(`\nGenerating ${NUM_POSTS} posts...`);

    // Generate posts
    const postIds: string[] = [];
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    for (let i = 0; i < NUM_POSTS; i++) {
      const postId = generateId();
      postIds.push(postId);

      const authorId = randomElement(userIds);
      const text = randomElement(POST_TEXTS);
      const postedAt = new Date(randomInt(thirtyDaysAgo, now));

      await client.query(
        'INSERT INTO posts (id, author_id, text, posted_at) VALUES ($1, $2, $3, $4)',
        [postId, authorId, text, postedAt]
      );

      if ((i + 1) % 100 === 0) {
        console.log(`  Created ${i + 1}/${NUM_POSTS} posts`);
      }
    }

    console.log(`✓ Created ${NUM_POSTS} posts`);

    console.log(`\nGenerating ${NUM_REPLIES} replies...`);

    // Generate replies
    for (let i = 0; i < NUM_REPLIES; i++) {
      const replyId = generateId();
      const authorId = randomElement(userIds);
      const replyingTo = randomElement(postIds);
      const text = randomElement(POST_TEXTS);

      // Get the original post's timestamp
      const { rows } = await client.query(
        'SELECT posted_at FROM posts WHERE id = $1',
        [replyingTo]
      );

      if (rows.length > 0) {
        const originalPostTime = new Date(rows[0].posted_at).getTime();
        const replyTime = new Date(randomInt(originalPostTime, now));

        await client.query(
          'INSERT INTO posts (id, author_id, text, posted_at, replying_to) VALUES ($1, $2, $3, $4, $5)',
          [replyId, authorId, text, replyTime, replyingTo]
        );
      }

      if ((i + 1) % 50 === 0) {
        console.log(`  Created ${i + 1}/${NUM_REPLIES} replies`);
      }
    }

    console.log(`✓ Created ${NUM_REPLIES} replies`);

    console.log(`\nGenerating likes...`);

    // Generate likes
    let likeCount = 0;
    const likePairs = new Set<string>();
    const allPostIds = [...postIds]; // Include original posts for likes

    for (const postId of allPostIds) {
      const numLikes = randomInt(
        Math.max(0, AVG_LIKES_PER_POST - 5),
        AVG_LIKES_PER_POST + 10
      );

      const likers = randomElements(userIds, numLikes);

      for (const userId of likers) {
        const pairKey = `${postId}:${userId}`;
        if (!likePairs.has(pairKey)) {
          likePairs.add(pairKey);
          await client.query(
            'INSERT INTO likes (post_id, user_id) VALUES ($1, $2)',
            [postId, userId]
          );
          likeCount++;
        }
      }
    }

    console.log(`✓ Created ${likeCount} likes`);

    console.log('\n✅ Integration seed data summary:');
    console.log(`   - ${NUM_USERS} users`);
    console.log(`   - ${followCount} follow relationships`);
    console.log(`   - ${NUM_POSTS} posts`);
    console.log(`   - ${NUM_REPLIES} replies`);
    console.log(`   - ${likeCount} likes`);
    console.log(
      `   - Total posts (including replies): ${NUM_POSTS + NUM_REPLIES}`
    );
    console.log('\nIntegration seed completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Integration seed failed:', error);
    process.exit(1);
  } finally {
    await client.release();
  }
}

seedIntegration();
