const express = require("express");
const router = express.Router();
const followController = require("../controllers/follow");

router.get("/followTest", followController.followTest);

module.exports = router;
