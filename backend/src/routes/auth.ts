import express, { Router } from 'express';
import {
  register,
  login,
  getProfile,
  getAllUsers,
  getSettings,
  checkUsernameAvailability,
  updateProfile,
  updatePrivacy,
  updateNotifications,
  updateAppearance,
  updateStorage,
  changePassword,
  updateEmail,
  logoutAllDevices,
  deleteAccount,
  blockUser,
  unblockUser,
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/username-available/:username', authenticateToken, checkUsernameAvailability);
router.get('/profile', authenticateToken, getProfile);
router.get('/users', authenticateToken, getAllUsers);
router.get('/settings', authenticateToken, getSettings);
router.put('/profile', authenticateToken, updateProfile);
router.put('/privacy', authenticateToken, updatePrivacy);
router.put('/notifications', authenticateToken, updateNotifications);
router.put('/appearance', authenticateToken, updateAppearance);
router.put('/storage', authenticateToken, updateStorage);
router.put('/security/password', authenticateToken, changePassword);
router.put('/security/email', authenticateToken, updateEmail);
router.post('/security/logout-all', authenticateToken, logoutAllDevices);
router.delete('/security/delete', authenticateToken, deleteAccount);
router.post('/block/:targetUserId', authenticateToken, blockUser);
router.delete('/block/:targetUserId', authenticateToken, unblockUser);

export default router;
