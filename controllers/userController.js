const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { generateAccessToken, generateRefreshToken } = require('../utils/token');

// In-memory refresh token store (gunakan DB/Redis di production)
let refreshTokens = [];

exports.getAllUsers = async (req, res) => {
  try {
    const requester = req.user;

    if (requester.role === 'admin') {
      const users = await User.find();
      return res.json(users);
    }

    const user = await User.findOne({ user_id: requester.user_id });
    return res.json([user]); // tetap array untuk konsistensi response
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

exports.getUserByUserId = async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.user_id);
    const requester = req.user;

    if (requester.role !== 'admin' && requester.user_id !== targetUserId) {
      return res.status(403).json({ error: 'Akses ditolak ke data user lain' });
    }

    const user = await User.findOne({ user_id: targetUserId });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Semua field wajib diisi' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }

    // const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password,
      role,
    });

    await newUser.save();
    res.status(201).json({ message: 'User berhasil dibuat', user: newUser });
  } catch (err) {
    res.status(500).json({ error: 'Gagal membuat user' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const requester = req.user;
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    if (requester.role !== 'admin' && requester.user_id !== targetUser.user_id) {
      return res.status(403).json({ error: 'Tidak diizinkan mengubah user lain' });
    }

    if (requester.role !== 'admin') {
      delete req.body.role;
    }

    // if (req.body.password) {
    //   req.body.password = await bcrypt.hash(req.body.password, 10);
    // }

    Object.assign(targetUser, req.body);
    await targetUser.save();

    res.json({ message: 'User berhasil diperbarui', user: targetUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal update user' });
  }
};

exports.updateOwnUser = async (req, res) => {
  try {
    const requester = req.user;
    const user = await User.findOne({ user_id: requester.user_id });

    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

    if (req.body.role) {
      delete req.body.role;
    }

    // if (req.body.password) {
    //   req.body.password = await bcrypt.hash(req.body.password, 10);
    // }

    Object.assign(user, req.body);
    await user.save();

    res.json({ message: 'Profil berhasil diperbarui', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memperbarui profil' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ error: 'User tidak ditemukan' });

    res.json({ message: 'User berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus user' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Email tidak ditemukan' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Password salah' });

    const payload = {
      user_id: user.user_id,
      email: user.email,
      role: user.role
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    refreshTokens.push(refreshToken);

    res.json({ accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ error: 'Login gagal' });
  }
};

exports.refreshToken = (req, res) => {
  const { token } = req.body;

  if (!token) return res.status(401).json({ error: 'Refresh token tidak ditemukan' });

  if (!refreshTokens.includes(token)) {
    return res.status(403).json({ error: 'Refresh token tidak valid' });
  }

  jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Refresh token kadaluarsa atau rusak' });

    const accessToken = generateAccessToken({
      user_id: user.user_id,
      email: user.email,
      role: user.role
    });

    res.json({ accessToken });
  });
};

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nama, email, dan password wajib diisi' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }

    // const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password, //hashedPassword,
      role: 'user'
    });

    await user.save();
    res.status(201).json({ message: 'Registrasi berhasil', user_id: user.user_id });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mendaftar user' });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const requester = req.user; // Di-set dari authenticateToken middleware
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old password dan new password wajib diisi' });
    }

    const user = await User.findOne({ user_id: requester.user_id });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Password lama salah' });

    user.password = newPassword; // ❗ Ini akan di-hash otomatis oleh Mongoose
    await user.save();

    res.json({ message: 'Password berhasil diperbarui' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memperbarui password' });
  }
};