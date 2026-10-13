const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const auth = require('../middleware/authMiddleware');
const optionalAuth = require('../middleware/optionalAuthMiddleware');

router.post('/library', auth, activityController.addToLibrary);
router.get('/library', auth, activityController.getUserLibrary);
router.post('/review', auth, activityController.addReview);
router.get('/content', activityController.getContentActivities); 
router.get('/recent', optionalAuth, activityController.getRecentActivities); 
router.get('/feed', auth, activityController.getFeed); 
router.get('/my', auth, activityController.getMyActivities); 

module.exports = router;

module.exports = router;
