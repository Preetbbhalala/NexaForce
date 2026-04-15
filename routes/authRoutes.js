'use strict';

const express        = require('express');
const router         = express.Router();
const protect        = require('../middleware/auth');
const { login, getMe, changePassword } = require('../controllers/authController');

router.post('/login',           login);
router.get( '/me',    protect,  getMe);
router.put( '/change-password', protect, changePassword);

module.exports = router;
