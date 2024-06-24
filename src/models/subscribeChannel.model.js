const { executeQuery } = require("../helpers/utils");
require("../common/common")();

class subscribeChannel {
  constructor(data) {
    this.ProfileId = data.ProfileId;
    this.SubscribeChannelId = data.SubscribeChannelId;
  }

  static async create(reqBody) {
    return await executeQuery("INSERT INTO subscribe_channel set ?", reqBody);
  }

  static async remove(id) {
    return await executeQuery("DELETE FROM subscribe_channel WHERE Id=?;", [
      id,
    ]);
  }
  static async removeByProfileIdAndSubscribeChannelId(profileId, SubscribeChannelId) {
    return await executeQuery(
      "DELETE FROM subscribe_channel WHERE ProfileId=? AND SubscribeChannelId=?;",
      [profileId, SubscribeChannelId]
    );
  }

  static async getByProfileId(profileId) {
    return (
      (await executeQuery(
        `SELECT sf_pr.Id, c.* from subscribe_channel as sf_pr left join featured_channels as c on sf_pr.SubscribeChannelId = c.id where sf_pr.ProfileId = ?`,
        [profileId]
      )) || []
    );
  }

  static async getSubscribeChannelIdByProfileId(profileId) {
    return (
      (await executeQuery(
        `SELECT SubscribeChannelId from subscribe_channel where profileId = ?`,
        [profileId]
      )) || []
    );
  }
}

module.exports = subscribeChannel;
