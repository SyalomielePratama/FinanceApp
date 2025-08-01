require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const securityMiddleware = require('./config/security');

const app = express();
app.use(express.json());

// Gunakan middleware keamanan
securityMiddleware(app);

// Koneksi MongoDB tanpa opsi deprecated
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Routes
app.use('/', userRoutes);

// Handle error CSRF
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'CSRF token tidak valid' });
  }
  next(err);
});

app.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
});
