const express = require("express");
const router = express.Router();

const postController = require("../controllers/post.controller");
const utilsController = require("../controllers/utils.controller");
const uploadFileMiddleware = require("../middleware/upload");
const authorize = require("../middleware/authorize");

router.post("/", postController.findAll);
router.get("/get/:id", postController.getPostByPostId);
router.post("/comments/", postController.getPostComments);
router.post("/get-all-posts", postController.getAllPosts);
router.post("/get-my-post", postController.getPostByProfileId);
router.post("/get-meta", postController.getMeta);
router.use(authorize.authorization);
router.get("/get-pdfs/:id", postController.getPdfsFile);
router.post("/create-post", postController.createPost);
router.post(
  "/upload",
  uploadFileMiddleware.single("file"),
  postController.uploadVideo
);
router.post("/update-views/:id", postController.updateViewCount);
router.delete("/hide-post/:id", postController.hidePost);
router.delete("/:id", postController.deletePost);
router.delete("/comments/:id", postController.deletePostComment);
router.delete("/delete-all/:id", postController.deleteAllData);

module.exports = router;
