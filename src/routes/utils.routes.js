const express = require("express");
const router = express.Router();
const utilsController = require("../controllers/utils.controller");
const uploadFileMiddleware = require("../middleware/upload");
const authorize = require("../middleware/authorize");

router.post(
  "/image-upload",
  uploadFileMiddleware.single("file"),
  utilsController.uploadVideo
);

// router.use(authorize.authorization);

module.exports = router;
