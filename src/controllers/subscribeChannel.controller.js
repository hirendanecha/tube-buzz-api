const utils = require("../helpers/utils");
const subscribeChannel = require("../models/subscribeChannel.model");
const socketService = require("../service/socket-service");
exports.create = async (req, res) => {
  try {
    if (Object.keys(req.body).length === 0) {
      res.status(400).send({ error: true, message: "Error in application" });
    } else {
      const reqBody = new subscribeChannel(req.body);
      const data = await subscribeChannel.create(reqBody);
      const notificationData = {
        notificationByProfileId: reqBody.ProfileId,
        notificationToProfileId: req.body.channelUserProfileId,
        actionType: "S",
        channelId: reqBody.SubscribeChannelId,
      };

      const notification = await socketService.createNotification(
        notificationData
      );
      if (data) {
        return res.json({
          error: false,
          message: "Channel subscribe successfully",
          data: data,
        });
      }
    }
  } catch (error) {
    return utils.send500(res, error);
  }
};

exports.remove = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await subscribeChannel.remove(id);

    if (data) {
      return res.json({
        error: false,
        message: "Channel unsubscribe successfully",
        data: data,
      });
    }
  } catch (error) {
    return utils.send500(res, error);
  }
};
exports.removeByProfileIdAndSeeFirstId = async (req, res) => {
  try {
    const profileId = req.params.profileId;
    const SubscribeChannelId = req.params.subscribeChannelId;
    const data = await subscribeChannel.removeByProfileIdAndSubscribeChannelId(
      profileId,
      SubscribeChannelId
    );

    if (data) {
      return res.json({
        error: false,
        message: "channel unsubscribe successfully",
        data: data,
      });
    }
  } catch (error) {
    return utils.send500(res, error);
  }
};

exports.getByProfileId = async (req, res) => {
  const profileId = req.params.profileId;
  const data = await subscribeChannel.getByProfileId(profileId);
  return res.send(data);
};
exports.getSubscribeChannelIdByProfileId = async (req, res) => {
  const profileId = req.params.profileId;
  const data = await subscribeChannel.getSubscribeChannelIdByProfileId(
    profileId
  );
  return res.send(data);
};
