const mongoose = require('mongoose');
const User = require('./models/user');
require('dotenv').config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin sudah ada:', existingAdmin.email);
      process.exit(0);
    }

    // Password PLAIN, nanti akan otomatis di-hash oleh pre-save hook
    const adminUser = new User({
      name: 'Administrator',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    });

    await adminUser.save();
    console.log('Admin berhasil dibuat:', adminUser.email);
    process.exit(0);
  } catch (error) {
    console.error('Gagal membuat admin:', error);
    process.exit(1);
  }
}

createAdmin();
