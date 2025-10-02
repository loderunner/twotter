import express from 'express';
import usersRouter from './routes/users.js';

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());

app.use('/users', usersRouter);

app.get('/', (req, res) => {
  res.json({
    message: 'Twotter API',
    endpoints: {
      users: '/users',
      user: '/users/:id',
      userPosts: '/users/:id/posts',
      userFeed: '/users/:id/feed',
    },
  });
});

app.listen(PORT, () => {
  console.log(`Twotter API listening on port ${PORT}`);
});
