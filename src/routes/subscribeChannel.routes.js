const express = require("express");
const router = express.Router();

const seeFirstUserController = require("../controllers/subscribeChannel.controller");
const authorize = require("../middleware/authorize");

router.use(authorize.authorization);
router.post("/create", seeFirstUserController.create);
router.delete("/remove/:id", seeFirstUserController.remove);
router.delete(
  "/remove/:profileId/:subscribeChannelId",
  seeFirstUserController.removeByProfileIdAndSeeFirstId
);
router.get("/getByProfileId/:profileId", seeFirstUserController.getByProfileId);
router.get(
  "/getSubscribedChannel/:profileId",
  seeFirstUserController.getSubscribeChannelByProfileId
);
router.get(
  "/getSeeFirstIdByProfileId/:profileId",
  seeFirstUserController.getSubscribeChannelIdByProfileId
);

module.exports = router;
