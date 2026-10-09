import express from 'express';
import { getUsers, createUser, updateProfile, updateUser } from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true });
router.use(protect);

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .put(updateUser);

router.route('/profile')
  .put(updateProfile);

router.route('/:id/profile')
  .put(updateProfile);

export default router;
