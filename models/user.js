const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Counter = require('./counter');

const userSchema = new mongoose.Schema({
  user_id: {
    type: Number,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Nama wajib diisi']
  },
  email: {
    type: String,
    required: [true, 'Email wajib diisi'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password wajib diisi'],
    minlength: [6, 'Password minimal 6 karakter']
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  }
});

// Auto increment user_id
userSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'user_id' },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );
      this.user_id = counter.sequence_value;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Hash password before save if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', userSchema);
