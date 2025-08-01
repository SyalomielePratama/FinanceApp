const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const { validateRegister, validateLogin } = require('../middlewares/validators');
const { validationResult } = require('express-validator');

// Middleware handle error validasi
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Public routes
router.post('/login', validateLogin, handleValidation, userController.login);
router.post('/token', userController.refreshToken);
router.post('/register', validateRegister, handleValidation, userController.registerUser);
router.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Admin-only routes
router.post('/users', authenticateToken, authorizeRoles('admin'), userController.createUser);
router.delete('/users/:id', authenticateToken, authorizeRoles('admin'), userController.deleteUser);
router.put('/users/:id', authenticateToken, authorizeRoles('admin'), userController.updateUser);

// Authenticated users
router.get('/users', authenticateToken, userController.getAllUsers);
router.get('/users/:user_id', authenticateToken, userController.getUserByUserId);
router.put('/users/me', authenticateToken, userController.updateOwnUser);
router.put('/users/password', authenticateToken, userController.updatePassword);

module.exports = router;
