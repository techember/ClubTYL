const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('News', newsSchema);
