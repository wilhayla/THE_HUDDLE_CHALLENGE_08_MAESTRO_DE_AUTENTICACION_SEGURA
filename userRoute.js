const express = require('express');
const router = express.Router();
const getProfile = require('../controllers/userController');
const protect = require('../middleware/authMiddleware'); // El middleware que verifica la Cookie o JWT

// La ruta requiere que el usuario esté autenticado para proceder
router.get('/me', protect, getProfile);

module.exports = router;
