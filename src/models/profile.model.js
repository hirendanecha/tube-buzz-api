"use strict";
var db = require("../../config/db.config");
require("../common/common")();
const environment = require("../environments/environment");
const { executeQuery } = require("../helpers/utils");

var Profile = function (profile) {
  this.UserName = profile.Username;
  this.FirstName = profile.FirstName;
  this.LastName = profile.LastName;
  this.Address = profile.Address;
  this.Country = profile.Country;
  this.City = profile.City;
  this.County = profile.County;
  this.State = profile.State;
  this.Zip = profile.Zip;
  this.UserID = profile.UserID;
  this.DateofBirth = profile.DateofBirth;
  this.Gender = profile.Gender;
  this.MobileNo = profile.MobileNo;
  this.AccountType = profile?.AccountType || "I";
  this.Business_NP_TypeID = profile.Business_NP_TypeID || 0;
  this.CoverPicName = profile.CoverPicName;
  this.ProfilePicName = profile.ProfilePicName;
  this.IsActivated = profile.IsActive;
  this.CreatedOn = new Date();
};

Profile.create = function (profileData, result) {
  db.query("INSERT INTO profile set ?", profileData, function (err, res) {
    if (err) {
      console.log("error", err);
      result(err, null);
    } else {
      console.log(res.insertId);
      result(null, res.insertId);
    }
  });
};

Profile.FindById = async function (profileId) {
  // db.query(
  //   `SELECT ID as Id,
  //           FirstName,
  //           LastName,
  //           UserID,
  //           MobileNo,
  //           Gender,
  //           DateofBirth,
  //           Address,
  //           City,
  //           State,
  //           Zip,
  //           Country,
  //           Business_NP_TypeID,
  //           CoverPicName,
  //           IsActivated,
  //           Username,
  //           ProfilePicName,
  //           EmailVerified,
  //           CreatedOn,
  //           AccountType,
  //           MediaApproved,
  //           County
  //   FROM profile WHERE ID=? `,
  //   profileId,
  //   function (err, res) {
  //     if (err) {
  //       console.log(err);
  //       result(err, null);
  //     } else {
  //       result(null, res);
  //     }
  //   }
  // );
  const query = `SELECT 
  u.Email,
  u.Username,
  u.IsActive,
  u.DateCreation,
  u.IsAdmin,
  u.FirstName,
  u.LastName,
  u.Address,
  u.Country,
  u.City,
  u.State,
  u.Zip,
  u.IsSuspended,
  u.AccountType,
  p.ID as profileId,
  p.UserID,
  p.CoverPicName,
  p.ProfilePicName,
  p.MobileNo,
  p.MediaApproved,
  p.ChannelType,
  p.DefaultUniqueLink,
  p.UniqueLink,
  p.AccountType,
  p.userStatus
FROM users as u left join profile as p on p.UserID = u.Id Where p.ID = ?;`;
  const values = profileId;
  let profile = await executeQuery(query, values);
  const query1 =
    "select c.channelId from channelAdmins as c left join profile as p on p.ID = c.profileId where c.profileId = p.ID and p.UserID = ?;";
  const value1 = [profile[0]?.UserID];
  const channelId = await executeQuery(query1, value1);
  if (channelId?.length) {
    profile[0]["channelId"] = channelId[0]?.channelId || null;
  }
  return profile[0];
};

Profile.update = function (profileId, profileData, result) {
  db.query(
    "UPDATE profile SET ? WHERE ID=?",
    [profileData, profileId],
    function (err, res) {
      if (err) {
        console.log("error", err);
        result(err, null);
      } else {
        console.log("update: ", res);
        result(null, res);
      }
    }
  );
};

Profile.getUsersByUsername = async function (searchText) {
  if (searchText) {
    const query = `select p.ID as Id, p.Username,p.ProfilePicName,p.UserID from profile as p left join users as u on u.Id = p.UserID WHERE u.IsAdmin ='N' AND u.IsSuspended ='N' AND u.IsActive = 'Y' AND p.Username LIKE ? AND p.AccountType in ('I','M') order by p.CreatedOn desc limit 50`;
    const values = [`${searchText}%`];
    const searchData = await executeQuery(query, values);
    return searchData;
  } else {
    return { error: "data not found" };
  }
};

Profile.getNotificationById = async function (id, limit, offset) {
  if (id) {
    const query = `select n.*,p.Username,p.FirstName,p.ProfilePicName from notifications as n left join profile as p on p.ID = n.notificationByProfileId where n.notificationToProfileId =? order by n.createDate desc limit ${limit} offset ${offset}`;
    const values = [id, id];
    const searchCount = await executeQuery(
      `SELECT count(id) as count FROM notifications as n WHERE n.notificationToProfileId = ${id}`
    );
    const notificationData = await executeQuery(query, values);
    // return notificationData;
    return {
      count: searchCount?.[0]?.count || 0,
      data: notificationData,
    };
  } else {
    return { error: "data not found" };
  }
};

Profile.getNotification = async function (id) {
  if (id) {
    const query = "select * from notifications where id = ?";
    const values = [id];
    const notificationData = await executeQuery(query, values);
    return notificationData;
  } else {
    return { error: "data not found" };
  }
};

Profile.editNotifications = function (id, isRead, result) {
  db.query(
    "update notifications set isRead=? WHERE id = ?",
    [isRead, id],
    function (err, res) {
      if (err) {
        console.log("error", err);
        result(err, null);
      } else {
        console.log("notification updated", res);
        result(null, res);
      }
    }
  );
};

Profile.deleteNotification = function (user_id, result) {
  db.query(
    "DELETE FROM notifications WHERE Id = ?",
    [user_id],
    function (err, res) {
      if (err) {
        console.log("error", err);
        result(err, null);
      } else {
        console.log("notification deleted", res);
        result(null, res);
      }
    }
  );
};

Profile.groupsAndPosts = async () => {
  const groupsResult = await executeQuery(
    'SELECT * FROM profile WHERE AccountType = "G" AND IsDeleted = "N" AND IsActivated = "Y" ORDER BY FirstName'
  );

  const groupIds = groupsResult.map((group) => group.ID);

  const postsResult = await executeQuery(
    'SELECT * FROM posts WHERE isdeleted = "N" AND posttoprofileid IS NOT NULL AND posttype NOT IN ("CHAT", "TA") AND posttoprofileid IN (?) ORDER BY ID DESC',
    [groupIds]
  );

  const allGroupWithPosts = postsResult
    .map((post) => post.posttoprofileid)
    .filter((value, index, self) => self.indexOf(value) === index);
  const groupsWithPosts = groupsResult.filter((group) =>
    allGroupWithPosts.includes(group.ID)
  );

  const groupedPosts = groupsWithPosts.map((group) => {
    const groupPosts = postsResult
      .filter((post) => post.posttoprofileid === group.ID)
      .sort((a, b) => b.ID - a.ID)
      .slice(0, 6);

    const groupPostsInfo = groupPosts.map((post) => {
      let firstImage = "";
      if (post.metaimage) {
        firstImage = post.metaimage;
      } else if (post.imageUrl) {
        firstImage = post.imageUrl;
      }

      return {
        postID: post.ID || post.id,
        postType: post.posttype,
        sharedPostID: post.sharedpostid,
        postToSharedDesc: post.postdescription,
        shortDescription: post.shortdescription,
        postToProfileID: post.posttoprofileid,
        profileID: post.profileid,
        title: post.textpostdesc,
        image: firstImage,
      };
    });

    return {
      Id: group.ID,
      name: group.FirstName,
      groupUniqueLink: group.UniqueLink,
      posts: groupPostsInfo,
    };
  });

  return groupedPosts;
};

Profile.getGroups = async () => {
  const groupsResult = await executeQuery(
    'SELECT ID, UniqueLink, FirstName FROM profile WHERE AccountType = "G" AND IsDeleted = "N" AND IsActivated = "Y" ORDER BY FirstName'
  );

  return groupsResult;
};

Profile.getGroupBasicDetails = async (uniqueLink) => {
  const groupsResult = await executeQuery(
    'SELECT * FROM profile WHERE AccountType = "G" AND IsDeleted = "N" AND IsActivated = "Y" AND UniqueLink=? ORDER BY FirstName',
    [uniqueLink]
  );

  return groupsResult?.[0] || {};
};

Profile.getGroupPostById = async (id, limit, offset) => {
  let query = `SELECT * FROM posts WHERE isdeleted = "N" AND posttoprofileid IS NOT NULL AND posttype NOT IN ("CHAT", "TA") AND posttoprofileid=${id} ORDER BY ID DESC `;

  if (limit > 0 && offset >= 0) {
    query += `LIMIT ${limit} OFFSET ${offset}`;
  }
  const posts = await executeQuery(query);

  return posts || [];
};

Profile.getGroupFileResourcesById = async (id) => {
  const posts = await executeQuery(
    "SELECT p.ID AS PostID, p.PostDescription, p.PostCreationDate AS UploadedOn, ph.PhotoName as FileName FROM posts AS p LEFT JOIN photos as ph on p.ID = ph.PostID WHERE isdeleted = 'N' AND  p.posttype = 'F' AND (p.ProfileID = ? OR p.PostToProfileID = ?)",
    [id, id]
  );

  return posts || [];
};

module.exports = Profile;
