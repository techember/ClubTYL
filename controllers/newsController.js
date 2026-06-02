const News = require('../models/newsSchema');

// @desc    Add a new news item
// @route   POST /api/news
exports.addNews = async (req, res) => {
  try {
    const { text, isActive } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }
    const news = await News.create({ text, isActive });
    res.status(201).json({ success: true, Data: news });
  } catch (error) {
    console.error('Error adding news:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all news (for admin)
// @route   GET /api/news
exports.getAllNews = async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, Data: news });
  } catch (error) {
    console.error('Error getting news:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get active news (for frontend)
// @route   GET /api/news/active
exports.getActiveNews = async (req, res) => {
  try {
    const news = await News.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, Data: news });
  } catch (error) {
    console.error('Error getting active news:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update a news item
// @route   PUT /api/news/:id
exports.updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, isActive } = req.body;
    const news = await News.findByIdAndUpdate(
      id,
      { text, isActive },
      { new: true, runValidators: true }
    );
    if (!news) {
      return res.status(404).json({ success: false, message: 'News not found' });
    }
    res.status(200).json({ success: true, Data: news });
  } catch (error) {
    console.error('Error updating news:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete a news item
// @route   DELETE /api/news/:id
exports.deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findByIdAndDelete(id);
    if (!news) {
      return res.status(404).json({ success: false, message: 'News not found' });
    }
    res.status(200).json({ success: true, message: 'News deleted successfully' });
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
