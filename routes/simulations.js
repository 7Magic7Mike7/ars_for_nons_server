
const path = require('path');
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    //res.sendFile('views/debug.html', {root: __dirname })
    const filePath = path.join(__dirname, "..", "views", "simulations.html");
    res.sendFile(filePath);
});


module.exports = router;
