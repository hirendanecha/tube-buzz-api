const featuredChannels = require("../models/featuredChannels.model");
const utils = require("../helpers/utils");
const { getPagination, getPaginationData } = require("../helpers/fn");
const ejsEmail = require("../helpers/email");

exports.getChannels = async function (req, res) {
  const data = await featuredChannels.getChannels();
  if (data) {
    res.send({ data });
  } else {
    utils.send404(res, (err = { message: "data not found" }));
  }
};

exports.getAllChannels = async (req, res) => {
  const { page, size, search, startDate, endDate } = req.body;
  const { limit, offset } = getPagination(page, size);
  const searchCountData = await featuredChannels.getAllChannels(
    limit,
    offset,
    search,
    startDate,
    endDate
  );
  return res.send(
    getPaginationData(
      { count: searchCountData.count, docs: searchCountData.data },
      page,
      limit
    )
  );
};

exports.searchAllData = async (req, res) => {
  const { search } = req.body;
  const searchData = await featuredChannels.searchAllData(search);
  return res.send(searchData);
};

exports.getCategories = async (req, res) => {
  console.log("In");
  const categoryList = await featuredChannels.getCategory();
  if (categoryList) {
    return res.send(categoryList);
  }
};

exports.findChannelById = async function (req, res) {
  if (req.params.id) {
    const channels = await featuredChannels.findChannelById(req.params.id);
    if (channels) {
      res.send(channels);
    } else {
      res.status(400).send({
        error: true,
        message: "Channel not found",
      });
    }
  }
};

exports.getUsersByUsername = async function (req, res) {
  const { searchText } = req.query;
  const data = await featuredChannels.getUsersByUsername(searchText);
  return res.send({
    error: false,
    data: data,
  });
};

exports.getChannelById = async function (req, res) {
  try {
    const name = req.params.name;
    const profileId = req.query.profileId;
    const [data] = await featuredChannels.getChannelById(name);
    console.log("data", data);
    if (data) {
      if (profileId) {
        const isSubscribed = await findSubscribers(profileId, data.id);
        console.log(isSubscribed);
        data.isSubscribed = isSubscribed;
      }
      res.send({ data });
    } else {
      utils.send404(res, (err = { message: "data not found" }));
    }
  } catch (error) {
    return utils.send500(res, error);
  }
};

const findSubscribers = async (profileId, channelId) => {
  const query = `select count(Id) as subscribers from subscribe_channel where ProfileId = ${profileId} and SubscribeChannelId = ${channelId}`;
  const [subscribers] = await utils.executeQuery(query);
  const isSubscribed = subscribers.subscribers > 0 ? true : false;
  return isSubscribed;
};
exports.getChannelByUserId = async function (req, res) {
  const id = req.params.id;
  console.log(id);
  const data = await featuredChannels.getChannelByUserId(id);
  if (data) {
    res.send(data);
  } else {
    utils.send404(res, (err = { message: "data not found" }));
  }
};

exports.CreateSubAdmin = async function (req, res) {
  try {
    const data = { ...req.body };
    const adminData = await featuredChannels.CreateSubAdmin(data);
    if (adminData) {
      return res.json({
        error: false,
        data: adminData,
      });
    } else {
      return res.json({
        error: false,
        message: "Already assigned",
      });
    }
  } catch (error) {
    return utils.send500(res, error);
  }
};

exports.getPostDetails = async function (req, res) {
  const { id } = req.params;
  const { profileId } = req.query;

  console.log(id);
  console.log(profileId);
  const data = await featuredChannels.getPostDetails(id, profileId);
  console.log("isSubscribed===>", data);
  if (data) {
    if (profileId) {
      const isSubscribed = await findSubscribers(profileId, data[0]?.channelId);
      data[0]["isSubscribed"] = isSubscribed || false;
    }
    res.send(data);
  } else {
    utils.send404(res, (err = { message: "data not found" }));
  }
};

exports.getPostByCategory = async function (req, res) {
  const { category } = req.params;
  const { page, size } = req.query;
  const { limit, offset } = getPagination(page, size);
  console.log(category);
  const posts = await featuredChannels.getPostByCategory(
    category,
    limit,
    offset
  );
  if (posts.data) {
    res.send(
      getPaginationData({ count: posts.count, docs: posts.data }, page, limit)
    );
  } else {
    utils.send404(res, (err = { message: "data not found" }));
  }
};

exports.channelsApprove = async function (req, res) {
  const { id, feature } = req.query;
  console.log(id, feature);
  const channel = await featuredChannels.approveChannels(id, feature);
  console.log(channel);
  if (feature === "Y") {
    res.send({
      error: false,
      message: "Channel activate successfully",
    });
  } else {
    res.send({
      error: false,
      message: "Channel de-activate successfully",
    });
  }
};

exports.getChannelsByProfileId = async function (req, res) {
  const { id } = req.params;
  console.log(id);
  const channels = await featuredChannels.getChannelsByProfileId(id);
  console.log(channels);
  if (channels) {
    res.send({
      error: false,
      data: channels,
    });
  } else {
    res.status(404).send({
      error: true,
      message: "channel not found",
    });
  }
};

exports.createChannel = async function (req, res) {
  const data = new featuredChannels({ ...req.body });
  data.feature = data.feature === true ? "Y" : "N";
  if (data) {
    const newChannel = await featuredChannels.createChannel(data);
    console.log(newChannel);
    if (newChannel.insertId) {
      const channelAdmin = {
        profileId: data.profileid,
        channelId: newChannel.insertId,
        isAdmin: "Y",
      };
      await featuredChannels.CreateSubAdmin(channelAdmin);
      res.send({
        error: false,
        data: newChannel.insertId,
      });
    } else {
      utils.send404(res, (err = { message: "channel already exists!" }));
    }
  } else {
    utils.send404(res, (err = { message: "data not found" }));
  }
};

exports.editChannel = async function (req, res) {
  try {
    const userName = req.body.Username;
    const data = new featuredChannels({ ...req.body });
    const { id } = req.params;
    if (data && id) {
      if (userName) {
        const query = `UPDATE profile SET Username = '${userName}' where ID = ${data.profileid}`;
        const query1 = `UPDATE users SET Username = '${userName}' where Id IN (select UserID from profile where ID = ${data.profileid})`;
        console.log(query1);
        const profile = await utils.executeQuery(query);
        const user = await utils.executeQuery(query1);
        console.log(profile, user);
      }
      const channel = await featuredChannels.editChannel(data, id, userName);
      if (channel) {
        res
          .status(200)
          .send({ error: false, message: "edit channel successfully!" });
      } else {
        res
          .status(500)
          .send({ error: true, message: "some thing went wrong!" });
      }
    }
  } catch (error) {
    res.send(error);
  }
};

exports.getChannelVideos = async function (req, res) {
  const { id, page, size, profileId } = req?.body;
  const { limit, offset } = getPagination(page, size);
  const posts = await featuredChannels.getChannelVideos(
    id,
    limit,
    offset,
    profileId
  );
  if (posts.data) {
    res.send(
      getPaginationData({ count: posts.count, docs: posts.data }, page, limit)
    );
  } else {
    utils.send500(res, (err = { message: "data not found" }));
  }
};

exports.getVideos = async function (req, res) {
  const { page, size, profileId } = req?.body;
  const { limit, offset } = getPagination(page, size);
  const posts = await featuredChannels.getVideos(limit, offset, profileId);
  if (posts.data) {
    res.send(
      getPaginationData({ count: posts.count, docs: posts.data }, page, limit)
    );
  } else {
    utils.send500(res, (err = { message: "data not found" }));
  }
};
exports.deleteChannel = async function (req, res) {
  const id = req.params.id;
  const data = await featuredChannels.deleteChannel(id);
  if (data) {
    res.send({ message: "channel deleted successfully" });
  }
};

exports.updateChannleFeature = function (req, res) {
  console.log(req.params.id, req.query.feature);
  const id = req.params.id;
  const feature = req.query.feature;
  featuredChannels.updateChannleFeature(
    id,
    feature,
    async function (err, result) {
      if (err) {
        return utils.send500(err, null);
      } else {
        if (feature === "Y") {
          res.json({
            error: false,
            message: "Channel add in feature successfully",
          });
        } else {
          res.json({
            error: false,
            message: "Channel removed from feature successfully",
          });
        }
      }
    }
  );
};

exports.removeFormChannel = function (req, res) {
  const { profileId, channelId } = req.query;
  featuredChannels.removeFormChannel(
    profileId,
    channelId,
    function (err, result) {
      if (err) return utils.send500(res, err);
      res.json({
        error: false,
        message: "removed successfully",
      });
    }
  );
};

exports.createChannelApplication = async function (req, res) {
  const data = { ...req.body };
  if (data) {
    const application = await featuredChannels.createChannelApplication(data);
    if (application) {
      await channelApplicationMail(data);
      res.send({
        error: false,
        data: application,
        message: "Thank you! well get with you shortly",
      });
    }
  } else {
    res.status(400).send({
      error: true,
      message: "data not found",
    });
  }
};

const channelApplicationMail = async (applicationData) => {
  const data = applicationData;
  const name = data?.username;
  const userEmail = data?.email;
  const channelName = data?.channelName;
  const channelUrl =
    data?.bitChuteUrl || data?.youtubeUrl || data?.rumbleUrl || data?.otherUrl;
  let msg = "You have a new Channel Application.";
  const Emails = ["freedombuzz@proton.me", "support@freedom.buzz"];
  for (const email of Emails) {
    const mailObj = {
      email: email,
      subject: "New Channel Application has been registered",
      root: "../email-templates/channel-application.ejs",
      templateData: {
        name: name,
        email: userEmail,
        url: channelUrl,
        channelName: channelName,
        msg: msg,
      },
      // url: redirectUrl,
    };
    await ejsEmail.sendMail(mailObj);
  }
};
