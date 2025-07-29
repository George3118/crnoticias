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

// 🔗 MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/post_dashboard', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// 📦 Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// 🔐 Dummy Admin (replace with DB auth if needed)
const ADMIN_USER = {
  username: 'jorge',
  passwordHash: bcrypt.hashSync('dashboard123', 10)
};

// 🧠 Models
const postSchema = new mongoose.Schema({
  title: String,
  content: String
});
const Post = mongoose.model('Post', postSchema);

// 🔐 JWT Middleware
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ error: 'Invalid token' });
  }
}

// 🚪 Login
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

// 📮 Create
app.post('/api/posts', authenticate, async (req, res) => {
  try {
    const post = await new Post(req.body).save();
    res.json(post);
  } catch {
    res.status(500).json({ error: 'Post creation failed' });
  }
});

// 📚 Read
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch {
    res.status(500).json({ error: 'Could not fetch posts' });
  }
});

// ✏️ Update
app.put('/api/posts/:id', authenticate, async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(post);
  } catch {
    res.status(500).json({ error: 'Post update failed' });
  }
});

// 🗑️ Delete
app.delete('/api/posts/:id', authenticate, async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Post deletion failed' });
  }
});

// 🚀 Start
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
