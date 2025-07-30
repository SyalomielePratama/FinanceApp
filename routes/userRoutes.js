const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

router.post('/login', userController.login);
router.post('/token', userController.refreshToken);
router.post('/register', userController.registerUser);

router.post('/users', authenticateToken, authorizeRoles('admin'), userController.createUser);
router.delete('/users/:id', authenticateToken, authorizeRoles('admin'), userController.deleteUser);

// Route ubah password, harus login dulu (authenticateToken)
router.put('/users/password', authenticateToken, userController.updatePassword);


router.get('/users', authenticateToken, userController.getAllUsers);
router.get('/users/:user_id', authenticateToken, userController.getUserByUserId);
router.put('/users/me', authenticateToken, userController.updateOwnUser);
router.put('/users/:id', authenticateToken, authorizeRoles('admin'), userController.updateUser);

module.exports = router;
