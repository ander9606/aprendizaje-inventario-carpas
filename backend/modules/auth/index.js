const router = require('express').Router();

router.use('/auth', require('./routes/auth'));

module.exports = router;
