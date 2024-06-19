"use strict";
var db = require("../../config/db.config");
require("../common/common")();
const { getPagination, getPaginationData } = require("../helpers/fn");
const { executeQuery } = require("../helpers/utils");

var dashboard = function () {};

dashboard.getCount = async function () {
  const query = "select count(ID) as userCount from profile";
  const query1 = "select count(id) as postCount from posts";
  const query2 = `select count(Id) as channelCount from featured_channels `;
  const [user] = await executeQuery(query);
  const [post] = await executeQuery(query1);
  const [channel] = await executeQuery(query2);
  const data = {
    userCount: user.userCount,
    postCount: post.postCount,
    channel: channel.channelCount,
  };
  return data;
};
module.exports = dashboard;
