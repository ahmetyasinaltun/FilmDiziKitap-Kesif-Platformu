const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');

router.get('/search', contentController.searchContent);
router.get('/top-rated', contentController.getTopRated);
router.get('/popular', contentController.getPopular);
router.get('/:type/:id', contentController.getContentDetails);

module.exports = router;
