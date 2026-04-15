'use strict';

const express          = require('express');
const router           = express.Router();
const protect          = require('../middleware/auth');
const { getNews }      = require('../controllers/newsController');

router.get('/', protect, getNews);

module.exports = router;
