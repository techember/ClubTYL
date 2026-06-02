const express = require('express');
const router = express.Router();
const { addNews, getAllNews, getActiveNews, updateNews, deleteNews } = require('../controllers/newsController');

router.post('/', addNews);
router.get('/', getAllNews);
router.get('/active', getActiveNews);
router.put('/:id', updateNews);
router.delete('/:id', deleteNews);

module.exports = router;
