const express = require("express");
const router = express.Router();
const publicationController = require("../controllers/publication");

router.get("/publicationTest", publicationController.publicationTest);

module.exports = router;
