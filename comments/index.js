const express = require('express');
const axios = require('axios');
const { randomBytes } = require('crypto');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const commentsByPostId = {};

app.get('/posts/:id/comments', (req, res) => {
  return res.send(commentsByPostId[req.params.id] || []);
});

app.post('/posts/:id/comments', async (req, res) => {
  const commentId = randomBytes(4).toString('hex');
  const postId = req.params.id;
  const { content } = req.body;

  const comments = commentsByPostId[postId] || [];
  
  comments.push({ 
    id: commentId, 
    content, 
    status: 'pending' 
  });

  commentsByPostId[postId] = comments;

  try {
    await axios.post('http://event-bus-srv:4005/events', {
      type: 'CommentCreated',
      data: {
        id: commentId,
        postId,
        content,
        status: 'pending',
      },
    });  
  } catch (error) {
    console.log(error);
  }

  return res.status(201).send(comments);
});

app.post('/events', async (req, res) => {
  const event = req.body;
  console.log('Event Received', event.type);

  const { type, data } = req.body;

  if (type === 'CommentModerated') {
    const { id, postId, status, content } = data;

    const comments = commentsByPostId[postId];
    const comment = comments.find(comment => comment.id === id);

    comment.status = status;

    try {
      await axios.post('http://event-bus-srv:4005/events', {
        type: 'CommentUpdated',
        data: {
          id,
          postId,
          content,
          status,
        },
      });  
    } catch (error) {
      console.log(error);
    }
  }

  return res.send({ status: 'OK' });
});

app.listen(4001, () => {
  console.log('Listening on 4001');
});
