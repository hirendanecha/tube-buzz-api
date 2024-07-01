"use strict";
var db = require("../../config/db.config");
require("../common/common")();
const { executeQuery, channelNotificationEmail } = require("../helpers/utils");

var featuredChannels = function (data) {
  this.profileid = data.profileid;
  this.feature = data.feature;
  this.firstname = data.firstname;
  this.unique_link = data.unique_link;
  this.profile_pic_name = data.profile_pic_name;
  this.description = data.description;
};

featuredChannels.getChannels = async function () {
  const query = "select * from featured_channels where feature = 'Y'";
  const channels = await executeQuery(query);
  if (channels) {
    return channels;
  }
};

featuredChannels.getAllChannels = async (
  limit,
  offset,
  search,
  startDate,
  endDate
) => {
  let whereCondition = "";
  if (search) {
    whereCondition += `${search ? `WHERE f.firstname LIKE '%${search}%'` : ""}`;
  }
  if (startDate && endDate) {
    whereCondition += `${
      search ? `AND` : "WHERE"
    } f.created >= '${startDate}' AND f.created <= '${endDate}'`;
  } else if (startDate) {
    whereCondition += `${search ? `AND` : "WHERE"} f.created >= '${startDate}'`;
  } else if (endDate) {
    whereCondition += `${search ? `AND` : "WHERE"} f.created <= '${endDate}'`;
  }
  const searchCount = await executeQuery(
    `SELECT count(id) as count FROM featured_channels as f`
  );
  const searchData = await executeQuery(
    `SELECT f.*,p.ID as profileId,p.ProfilePicName,p.Username,p.UserID,p.FirstName,p.LastName FROM featured_channels as f left join profile as p on p.ID = f.profileid ${whereCondition} order by f.created desc limit ? offset ?`,
    [limit, offset]
  );

  return {
    count: searchCount?.[0]?.count || 0,
    data: searchData,
  };
};

featuredChannels.searchAllData = async (search) => {
  const query = `select * from featured_channels where firstname like '%${search}%' or unique_link like '%${search}%'`;
  const channels = await executeQuery(query);
  const query1 = `select p.* ,pr.Username,pr.ProfilePicName,pr.FirstName,pr.LastName,fc.firstname as channelName from posts as p left join profile as pr on p.profileid = pr.ID left join featured_channels as fc on fc.id = p.channelId WHERE p.posttype = 'V' and p.isdeleted = "N" and (p.videoduration is not NULL or p.videoduration != 0 or p.videoduration != "0" ) and (p.postdescription like '%${search}%' or p.keywords like '%${search}%' or p.title like '%${search}%') order by p.id desc`;
  console.log("query1: ", query1);
  const value1 = [search, search];
  const posts = await executeQuery(query1);
  //console.log(channels, posts);
  return { channels, posts };
};

featuredChannels.getCategory = async () => {
  const query = "select * from category";
  console.log("q", query);
  const categories = await executeQuery(query);
  console.log(categories);
  if (categories) {
    return categories;
  }
};

featuredChannels.getChannelById = async function (name) {
  const query = "select * from featured_channels where unique_link = ?";
  const value = [name];
  const [channels] = await executeQuery(query, value);
  if (channels) {
    const query3 = `select count(Id) as subscribers from subscribe_channel where SubscribeChannelId = ?`;
    const query4 = `select count(id) as videoCount from posts where channelId = ?`;
    const [subscribers] = await executeQuery(query3, channels.id);
    const [posts] = await executeQuery(query4, channels.id);
    channels.subscribers = subscribers.subscribers;
    channels.videoCount = posts.videoCount;
    return channels;
  }
};

featuredChannels.findChannelById = async function (id) {
  const query1 =
    "select f.*,p.Username,u.Email,count(ca.profileId) as Admins from featured_channels as f left join profile as p on p.ID = f.profileId left join users as u on u.Id = p.UserID left join channelAdmins as ca on ca.channelId = f.id where f.id=?;";
  const query2 =
    "select ca.*,p.Username, p.ProfilePicName,p.FirstName,p.LastName,p.CoverPicName,u.Email,p.UserID from channelAdmins as ca left join profile as p on p.ID = ca.profileId left join users as u on u.Id = p.UserID  where ca.channelId = ?;";
  const values = [id];
  const query3 = `select count(Id) as subscribers from subscribe_channel where SubscribeChannelId = ?`;
  const channel = await executeQuery(query1, values);
  const members = await executeQuery(query2, values);
  const [subscribers] = await executeQuery(query3, values);
  channel.map((e) => {
    e.memberList = members;
    e.subscribers = subscribers.subscribers;
    return e;
  });
  return channel;
};

featuredChannels.getUsersByUsername = async function (searchText) {
  if (searchText) {
    // const query1 = "select profileId from channelAdmins";
    // const ids = await executeQuery(query1);
    // const profileIds = [];
    // ids.map((e) => profileIds.push(e.profileId));
    const query = `select p.ID as Id, p.Username,p.ProfilePicName from profile as p left join users as u on u.Id = p.UserID WHERE u.IsAdmin='N' AND u.IsSuspended='N' AND p.Username LIKE ? order by p.Username limit 500`;
    const values = [`${searchText}%`];
    const searchData = await executeQuery(query, values);
    console.log(searchData);

    return searchData;
  } else {
    return { error: "data not found" };
  }
};

featuredChannels.getChannelByUserId = async function (id) {
  const query =
    "select f.* from featured_channels as f left join profile as p on p.ID = f.profileid where f.profileid in(p.ID) and p.UserID = ? and feature = 'Y';";
  const value = [id];
  const channels = await executeQuery(query, value);
  console.log(channels);
  if (channels) {
    return channels;
  }
};

featuredChannels.CreateSubAdmin = async function (data, result) {
  const query1 = `select * from channelAdmins where profileId = ${data.profileId} and channelId = ${data.channelId}`;
  const sameChannel = await executeQuery(query1);
  if (!sameChannel.length > 0) {
    // console.log(data);
    // const query = `select u.Email,u.Username from users as u left join profile as p on u.Id = p.UserID where p.ID = ${data.profileId} `;
    // const user = await executeQuery(query);
    // console.log("user", user);
    // const userData = {
    //   Username: user[0].Username,
    //   Email: user[0].Email,
    // };
    // await channelNotificationEmail(userData);
    const query = "insert into channelAdmins set ?";
    const values = [data];
    const admin = await executeQuery(query, values);
    return admin;
  } else {
    return;
  }
};
featuredChannels.getPostDetails = async function (id,profileId) {
  const query =
    "select p.*,fc.firstname,fc.unique_link,fc.profile_pic_name,fc.created,fc.id as channelId, pl.ActionType as react from posts as p left join postlikedislike as pl on pl.ProfileID = ? left join featured_channels as fc on fc.id = p.channelId where p.id = ?";
  const values = [profileId, id];
  const channels = await executeQuery(query, values);
  console.log("channels", channels, query);
  if (channels) {
    return channels;
  }
};

featuredChannels.getPostByCategory = async function (category, limit, offset) {
  const query = `select p.*,fc.firstname,fc.unique_link,fc.profile_pic_name,fc.created,fc.id as channelId from posts as p left join featured_channels as fc on fc.id = p.channelId where ${
    category === "featuredVideos"
      ? `p.categoryName is NULL `
      : `p.categoryName = '${category}'`
  } limit ? offset ?`;
  const values = [limit, offset];
  const posts = await executeQuery(query, values);
  console.log(category, limit, offset, query);
  const searchCount = await executeQuery(
    `SELECT count(p.id) as count FROM posts as p WHERE p.categoryName = '${category}'`
  );
  console.log(posts);
  if (posts) {
    return {
      count: searchCount?.[0]?.count || 0,
      data: posts,
    };
  }
};

featuredChannels.approveChannels = async function (id, feature) {
  const query = "update featured_channels set feature = ? where id =?";
  const values = [feature, id];
  const channels = await executeQuery(query, values);
  if (channels) {
    return channels;
  }
};

featuredChannels.getChannelsByProfileId = async function (id) {
  const query = `select f.* from featured_channels as f LEFT JOIN channelAdmins AS ca ON ca.channelId = f.id left join profile as p on p.ID = ca.profileId where ca.profileId in(p.ID) and p.UserID = ?;`;
  const values = [id];
  const channels = await executeQuery(query, values);
  if (channels) {
    return channels;
  }
};

featuredChannels.createChannel = async function (reqBody) {
  const query1 = "select * from featured_channels where unique_link = ?";
  const value = [reqBody.unique_link];
  const oldchannels = await executeQuery(query1, value);
  console.log("oldchannels", oldchannels);
  if (!oldchannels.length) {
    const query = "insert into featured_channels set ?";
    const values = [reqBody];
    const channels = await executeQuery(query, values);
    if (channels) {
      return channels;
    }
  } else {
    return [];
  }
};
featuredChannels.editChannel = async function (data, id) {
  try {
    const query = `UPDATE featured_channels SET ? WHERE id = ?`;
    const values = [data, id];
    const channel = await executeQuery(query, values);
    if (channel) {
      return channel;
    }
  } catch (error) {
    console.error("Error updating channel:", error);
    return error;
  }
};

featuredChannels.getChannelVideos = async function (
  id,
  limit,
  offset,
  profileId
) {
  const whereCondition = `p.posttype = 'V' and p.streamname is not null and ${
    id ? `p.channelId = ${id}` : `p.profileid = ${profileId}`
  } `;
  const searchCount = await executeQuery(
    `SELECT count(id) as count FROM posts as p WHERE ${whereCondition}`
  );
  const query = `select p.*,fc.firstname,fc.unique_link,fc.profile_pic_name,fc.created from posts as p left join featured_channels as fc on fc.id = p.channelId where ${whereCondition} order by postcreationdate desc limit ? offset ? `;
  const values = [limit, offset];
  const posts = await executeQuery(query, values);
  if (posts) {
    return {
      count: searchCount?.[0]?.count || 0,
      data: posts,
    };
  }
};

featuredChannels.getVideos = async function (limit, offset, profileId) {
  // const whereCondition =
  //   "p.posttype = 'V' and p.streamname is not null and p.channelId is not null";
  // const searchCount = await executeQuery(
  //   `SELECT count(id) as count FROM posts as p WHERE ${whereCondition}`
  // );
  // const orderBy = `order by p.channelId in (SELECT SubscribeChannelId from subscribe_channel where ProfileId= ${profileId}) and p.postdescription desc`;
  // const query = `select p.*,fc.firstname,fc.unique_link,fc.profile_pic_name,fc.created from posts as p left join featured_channels as fc on fc.id = p.channelId left join category as c on c.categoryName = p.categoryName where ${whereCondition} ${
  //   profileId ? orderBy : "order by p.postdescription desc"
  // } limit ? offset ? `;
  // const values = [limit, offset];
  // const posts = await executeQuery(query, values);
  // if (posts) {
  //   const postList = posts.reduce((acc, post) => {
  //     const { categoryName } = post;
  //     const category =
  //       categoryName === null || categoryName.trim() === ""
  //         ? "featuredVideos"
  //         : categoryName.toLowerCase();

  //     if (!acc[category]) {
  //       acc[category] = [];
  //     }

  //     if (acc[category].length < 8) {
  //       acc[category].push(post);
  //     }

  //     return acc;
  //   }, {});
  //   return {
  //     count: searchCount?.[0]?.count || 0,
  //     data: postList,
  //   };
  // }

  const whereCondition =
    "p.posttype = 'V' and p.streamname is not null and p.channelId is not null";
  const searchCount = await executeQuery(
    `SELECT count(id) as count FROM posts as p WHERE ${whereCondition}`
  );

  const orderBy = `order by p.channelId in (SELECT SubscribeChannelId from subscribe_channel where ProfileId= ${profileId}) and p.postdescription desc`;

  const query = `select p.*,fc.firstname,fc.unique_link,fc.profile_pic_name,fc.created from posts as p left join featured_channels as fc on fc.id = p.channelId left join category as c on c.categoryName = p.categoryName where ${whereCondition} ${
    profileId ? orderBy : "order by p.postdescription desc"
  } limit ? offset ? `;
  const values = [limit, offset];
  const posts = await executeQuery(query, values);

  if (posts) {
    const postList = posts.reduce((acc, post) => {
      const { categoryName, created } = post;
      const category =
        categoryName === null || categoryName.trim() === ""
          ? "featuredVideos"
          : categoryName.toLowerCase();

      // Add the post to its category
      if (!acc[category]) {
        acc[category] = [];
      }
      if (acc[category].length < 8) {
        acc[category].push(post);
      }

      // Check if the post is recent and add to recentPosted category
      const recentPosted = "recentPosted";
      const isRecent =
        new Date(created) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Posts within the last 7 days
      if (isRecent) {
        if (!acc[recentPosted]) {
          acc[recentPosted] = [];
        }
        if (acc[recentPosted].length < 8) {
          acc[recentPosted].push(post);
        }
      }

      return acc;
    }, {});

    return {
      count: searchCount?.[0]?.count || 0,
      data: postList,
    };
  }
};

featuredChannels.deleteChannel = async function (id) {
  const query = "delete from featured_channels where id = ?";
  const value = [id];
  const channels = await executeQuery(query, value);
  if (channels) {
    return channels;
  }
};

featuredChannels.updateChannleFeature = function (feature, id, result) {
  db.query(
    "update featured_channels set feature = ? where id = ?",
    [id, feature],
    function (err, res) {
      if (err) {
        console.log(err);
        result(err, null);
      } else {
        console.log(res);
        result(null, res);
      }
    }
  );
};

featuredChannels.removeFormChannel = function (profileId, channelId, result) {
  db.query(
    "delete from channelAdmins where profileId=? and channelId=?",
    [profileId, channelId],
    function (err, res) {
      if (err) {
        result(err, null);
      } else {
        result(null, res);
      }
    }
  );
};

module.exports = featuredChannels;
