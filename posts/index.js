const express = require('express');
const axios = require('axios');
const { randomBytes } = require('crypto');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const posts = {};

app.get('/posts', (req, res) => {
  return res.send(posts);
});

app.post('/posts', async (req, res) => {
  const id = randomBytes(4).toString('hex');
  const { title } = req.body;

  posts[id] = {
    id,
    title
  };

  await axios.post('http://event-bus-srv:4005/events', {
    type: 'PostCreated',
    data: {
      id,
      title,
    },
  });

  return res.status(201).send(posts[id]);
});

app.post('/events', (req, res) => {
  const event = req.body;
  console.log('Event Received', event.type);
  return res.send({ status: 'OK' });
});

app.listen(4000, () => {
  console.log('v55');
  console.log('Listening on 4000');
});
