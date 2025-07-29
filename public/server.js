require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || 'fallback_secret';

// 🔗 Connect MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/post_dashboard', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// 📦 Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.resolve(__dirname, 'public')));

// 🧠 Post Model
const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true }
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);

// 🔐 Dummy Admin (Use DB-based user system for real apps)
const ADMIN_USER = {
  username: 'jorge',
  passwordHash: bcrypt.hashSync('dashboard123', 10)
};

// 🔐 JWT Authentication Middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
}

// 🚪 Login Route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (
    username !== ADMIN_USER.username ||
    !await bcrypt.compare(password, ADMIN_USER.passwordHash)
  ) {
    return res.status(403).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ username }, SECRET, { expiresIn: '2h' });
  res.json({ token });
});

// 📮 Create Post
app.post('/api/posts', authenticate, async (req, res) => {
  try {
    const post = await new Post(req.body).save();
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: 'Post creation failed', details: err.message });
  }
});

// 📚 Get All Posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch posts', details: err.message });
  }
});

// ✏️ Update Post
app.put('/api/posts/:id', authenticate, async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Post update failed', details: err.message });
  }
});

// 🗑️ Delete Post
app.delete('/api/posts/:id', authenticate, async (req, res) => {
  try {
    const deleted = await Post.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Post not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Post deletion failed', details: err.message });
  }
});

// 🚀 Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
