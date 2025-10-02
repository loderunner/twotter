import { nanoid } from 'nanoid';
import { pool } from './client.js';

/**
 * Seeds the database with fixture data for development
 */
async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('Wiping database...');

    // Delete in order due to foreign key constraints
    await client.query('DELETE FROM likes');
    await client.query('DELETE FROM follows');
    await client.query('DELETE FROM posts');
    await client.query('DELETE FROM users');

    console.log('Database wiped clean.');
    console.log('\nSeeding database...');

    // Create users
    const alice = nanoid();
    const bob = nanoid();
    const charlie = nanoid();
    const diana = nanoid();

    await client.query(
      `INSERT INTO users (id, full_name, username, email) VALUES
       ($1, 'Alice Anderson', 'alice', 'alice@example.com'),
       ($2, 'Bob Brown', 'bob', 'bob@example.com'),
       ($3, 'Charlie Chen', 'charlie', 'charlie@example.com'),
       ($4, 'Diana Davis', 'diana', 'diana@example.com')`,
      [alice, bob, charlie, diana]
    );

    console.log('Created users');

    // Create follow relationships
    // Alice follows Bob and Charlie
    // Bob follows Alice and Diana
    // Charlie follows Alice and Bob
    // Diana follows everyone
    await client.query(
      `INSERT INTO follows (follower_id, followed_id) VALUES
       ($1, $2), ($1, $3),
       ($2, $1), ($2, $4),
       ($3, $1), ($3, $2),
       ($4, $1), ($4, $2), ($4, $3)`,
      [alice, bob, charlie, diana]
    );

    console.log('Created follow relationships');

    // Create posts
    const post1 = nanoid();
    const post2 = nanoid();
    const post3 = nanoid();
    const post4 = nanoid();
    const post5 = nanoid();
    const post6 = nanoid();
    const post7 = nanoid();

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    await client.query(
      `INSERT INTO posts (id, author_id, text, posted_at) VALUES
       ($1, $2, 'Just joined Twotter! This is my first post.', $3),
       ($4, $5, 'Working on a new project today. Exciting stuff!', $6),
       ($7, $8, 'Does anyone else think TypeScript is amazing?', $9),
       ($10, $11, 'Had a great coffee this morning ☕', $12),
       ($13, $14, 'Debugging is like being a detective in a crime movie where you are also the murderer.', $15),
       ($16, $17, 'The best way to predict the future is to implement it.', $18),
       ($19, $20, 'Code never lies, comments sometimes do.', $21)`,
      [
        post1,
        alice,
        oneWeekAgo,
        post2,
        bob,
        threeDaysAgo,
        post3,
        alice,
        twoHoursAgo,
        post4,
        charlie,
        oneHourAgo,
        post5,
        diana,
        now,
        post6,
        bob,
        now,
        post7,
        alice,
        now,
      ]
    );

    console.log('Created posts');

    // Create a reply
    const reply1 = nanoid();
    await client.query(
      `INSERT INTO posts (id, author_id, text, posted_at, replying_to) VALUES
       ($1, $2, 'Welcome to Twotter, Alice!', $3, $4)`,
      [reply1, bob, new Date(oneWeekAgo.getTime() + 30 * 60 * 1000), post1]
    );

    console.log('Created replies');

    // Create likes
    await client.query(
      `INSERT INTO likes (post_id, user_id) VALUES
       ($1, $2), ($1, $3), ($1, $4),
       ($5, $6), ($5, $7),
       ($8, $9), ($8, $10), ($8, $11), ($8, $12),
       ($13, $14), ($13, $15),
       ($16, $17)`,
      [
        post1,
        bob,
        charlie,
        diana,
        post2,
        alice,
        diana,
        post3,
        bob,
        charlie,
        diana,
        alice,
        post4,
        alice,
        bob,
        post5,
        charlie,
      ]
    );

    console.log('Created likes');

    await client.query('COMMIT');

    console.log('\n✅ Seed data summary:');
    console.log('   - 4 users (alice, bob, charlie, diana)');
    console.log('   - 9 follow relationships');
    console.log('   - 7 posts + 1 reply');
    console.log('   - 12 likes');
    console.log('\nSeed completed successfully!');

    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

seed();
