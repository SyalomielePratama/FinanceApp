const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: String, // misal: 'user_id'
  sequence_value: Number
});

module.exports = mongoose.model('Counter', counterSchema);
