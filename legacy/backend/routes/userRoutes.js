const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, upload.single('avatar'), userController.updateProfile);
router.get('/:id', auth, userController.getUserById);
router.get('/:id/followers', auth, userController.getFollowers);
router.get('/:id/following', auth, userController.getFollowing);
router.post('/:id/follow', auth, userController.followUser);
router.delete('/:id/follow', auth, userController.unfollowUser);
router.post('/:id/lists', auth, userController.createList);
router.get('/:id/lists', auth, userController.getUserLists);
router.post('/lists/:listId/content', auth, userController.addContentToList);
router.delete('/lists/:listId/content/:contentId', auth, userController.removeContentFromList);

module.exports = router;
