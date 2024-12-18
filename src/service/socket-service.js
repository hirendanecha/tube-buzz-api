const { executeQuery } = require("../helpers/utils");
const { notificationMail } = require("../helpers/utils");
const { getPagination, getCount, getPaginationData } = require("../helpers/fn");
const og = require("open-graph");
const moment = require("moment");

exports.getPost = async function (data) {
  return await getPost(data);
};
exports.createPost = function (data) {
  try {
    return createNewPost(data);
  } catch (error) {
    console.log("createpost", error);
    return Promise.reject(error);
  }
};

exports.likeFeedPost = async function (data) {
  return await likeFeedPost(data);
};

exports.disLikeFeedPost = async function (data) {
  return await disLikeFeedPost(data);
};

exports.createNotification = async function (data) {
  return await createNotification(data);
};

exports.createComments = async function (data) {
  return await createComments(data);
};

exports.likeFeedComment = async function (data) {
  return await likeFeedComment(data);
};

exports.disLikeFeedComment = async function (data) {
  return await disLikeFeedComment(data);
};
exports.deletePost = async function (data) {
  return await deletePost(data);
};

exports.getMeta = function (data) {
  return getMetaD(data);
};

exports.readNotification = function (data) {
  return readNotification(data);
};

exports.viewingHistory = function (data) {
  return viewingHistory(data);
};

exports.getWatchHistory = function (data) {
  return getWatchHistory(data);
};

exports.suspendUser = function (data) {
  return suspendUser(data);
};

const getPost = async function (params) {
  const { page, size, profileId } = params;
  const { limit, offset } = getPagination(page, size);

  const query = `SELECT p.*, pl.ActionType as react, pr.ProfilePicName, pr.Username, pr.FirstName 
  from 
  posts as p left join postlikedislike as pl on pl.ProfileID = ? and pl.PostID = p.id  left join profile as pr on p.profileid = pr.ID 
  where p.profileid not in (SELECT UnsubscribeProfileId FROM unsubscribe_profiles where ProfileId = ?) DESC, p.id DESC limit ? offset ?`;
  // AND p.isdeleted ='N' order by p.profileid in (SELECT SeeFirstProfileId from see_first_profile where ProfileId=?)
  const values = [profileId, profileId, profileId, limit, offset];
  const posts = await executeQuery(query, values);
  // if (posts.length > 0) {
  //   for (const key in posts) {
  //     if (Object.hasOwnProperty.call(posts, key)) {
  //       const post = posts[key];
  //       const query =
  //         "select c.*,pr.ProfilePicName, pr.Username, pr.FirstName from comments as c left join profile as pr on pr.ID = c.profileId where c.postId = ?";
  //       const value = [post.id];
  //       const comment = await executeQuery(query, value);
  //       post.commentList = comment;
  //     }
  //   }
  // }
  return posts;
};

const createNewPost = async function (data) {
  console.log(data);
  const postData = {
    profileid: data?.profileid,
    title: data?.meta?.title || data?.title || null,
    metadescription:
      data?.meta?.metadescription?.toString() ||
      data?.metadescription?.toString() ||
      null,
    metaimage: data?.meta?.metaimage || data?.metaimage || null,
    metalink: data?.meta?.metalink || data?.metalink || null,
    postdescription: data?.postdescription,
    imageUrl: data?.imageUrl || null,
    streamname: data?.streamname || null,
    thumbfilename: data?.thumbfilename || null,
    albumname: data?.albumname || null,
    videoduration: data?.videoduration || null,
    posttype: data?.posttype || "S",
    keywords: data?.keywords || null,
    pdfUrl: data?.pdfUrl || null,
    textpostdesc: data?.textpostdesc || null,
    parentPostId: data?.parentPostId || null,
    posttoprofileid: data?.posttoprofileid || null,
    categoryName: data?.categoryName || null,
  };
  postData.isdeleted = "N";

  console.log("postData", postData);
  const query = data?.id
    ? `update posts set ? where id= ?`
    : `INSERT INTO posts set ?`;
  const values = data?.id ? [postData, data?.id] : [postData];
  const post = await executeQuery(query, values);

  const notifications = [];
  if (post) {
    if (post?.insertId) {
      await UserRewardDetails.create({
        ProfileID: postData?.profileid,
        PostID: post?.insertId,
        ActionType: "P",
      });
    }

    if (data?.tags?.length > 0) {
      for (const key in data?.tags) {
        if (Object.hasOwnProperty.call(data?.tags, key)) {
          const tag = data?.tags[key];

          const notification = await createNotification({
            notificationToProfileId: tag?.id,
            postId: data?.id || post.insertId,
            notificationByProfileId: postData?.profileid,
            actionType: "T",
          });
          const findUser = `select u.Email,p.FirstName,p.LastName,p.Username from users as u left join profile as p on p.UserID = u.Id where p.ID = ?`;
          const values = [tag?.id];
          const userData = await executeQuery(findUser, values);
          const findSenderUser = `select p.ID,p.Username,p.FirstName,p.LastName from profile as p where p.ID = ?`;
          const values1 = [postData?.profileid];
          const senderData = await executeQuery(findSenderUser, values1);
          notifications.push(notification);
          if (tag?.id) {
            const userDetails = {
              email: userData[0].Email,
              profileId: senderData[0].ID,
              userName: userData[0].Username,
              senderUsername: senderData[0].Username,
              firstName: userData[0].FirstName,
              type: "post",
              postId: notification?.postId || postData?.id,
            };
            await notificationMail(userDetails);
          }
        }
      }
    }

    const query1 = `SELECT p.*, pr.ProfilePicName, pr.Username, pr.FirstName,groupPr.FirstName as groupName, groupPr.UniqueLink as groupLink from posts as p left join profile as pr on p.profileid = pr.ID left join profile as groupPr on p.posttoprofileid = groupPr.ID where p.isdeleted ='N' and p.id =? ;`;
    const values1 = [data?.id || post.insertId];
    const posts = await executeQuery(query1, values1);
    return { notifications, posts };
  }
};

// socket for admin //
const likeFeedPost = async function (params) {
  const { postId, profileId, likeCount, actionType } = params;
  if (postId) {
    const query = `update posts set likescount = ? where id =?`;
    const query1 = `INSERT INTO postlikedislike set ?`;
    const values = [likeCount, postId];
    const data = {
      PostID: postId,
      ProfileID: profileId,
      ActionType: actionType,
    };
    const values1 = [data];
    const post = await executeQuery(query, values);
    const likeData = await executeQuery(query1, values1);
    if (likeData) {
      await UserRewardDetails.create({
        ProfileID: profileId,
        PostID: postId,
        ActionType: "L",
      });
    }
    const query3 = `SELECT p.*, pr.ProfilePicName, pr.Username, pr.FirstName from posts as p left join profile as pr on p.profileid = pr.ID where p.id=?`;
    const values3 = [postId];
    const posts = await executeQuery(query3, values3);
    return { posts };
  }
};

const disLikeFeedPost = async function (params) {
  const { postId, profileId, likeCount } = params;
  if (postId) {
    const query = `update posts set likescount = ? where id =?`;
    const query1 = `delete from postlikedislike where PostID = ? AND ProfileID = ?`;
    const values = [likeCount, postId];
    const values1 = [postId, profileId];
    await executeQuery(query, values);
    await executeQuery(query1, values1);
    const query3 = `SELECT p.*, pr.ProfilePicName, pr.Username, pr.FirstName from posts as p left join profile as pr on p.profileid = pr.ID where p.id=?`;
    const values3 = [postId];
    const posts = await executeQuery(query3, values3);
    return { posts };
  }
};

const createNotification = async function (params) {
  const {
    notificationToProfileId,
    postId,
    notificationByProfileId,
    actionType,
    commentId,
    channelId,
  } = params;
  const query =
    "SELECT ID,ProfilePicName, Username, FirstName,LastName from profile where ID = ?";
  const values = [notificationByProfileId];
  const userData = await executeQuery(query, values);
  if (!userData[0]) {
    return;
  }
  let desc = "";
  if (channelId) {
    desc = `${
      userData[0]?.Username || userData[0]?.FirstName
    } has subscribed your channel`;
  } else if (commentId && actionType === "L") {
    desc = `${
      userData[0]?.Username || userData[0]?.FirstName
    } liked your Comment.`;
  } else if (commentId && actionType === "T") {
    desc = `You were tagged in ${
      userData[0]?.Username || userData[0]?.FirstName
    }'s comment.`;
  } else {
    desc =
      actionType === "R"
        ? `${
            userData[0]?.Username || userData[0]?.FirstName
          } replied to your comment`
        : actionType === "C"
        ? `${
            userData[0]?.Username || userData[0]?.FirstName
          } commented on your post`
        : actionType === "T"
        ? `You were tagged in ${
            userData[0]?.Username || userData[0]?.FirstName
          }'s post.`
        : `${userData[0]?.Username || userData[0]?.FirstName} liked your post.`;
  }
  console.log("desc===>", desc);

  const data = {
    notificationToProfileId: Number(notificationToProfileId),
    postId: postId,
    notificationByProfileId: Number(notificationByProfileId),
    actionType: actionType,
    notificationDesc: desc,
  };
  if (data.notificationByProfileId === data.notificationToProfileId) {
    return true;
  } else {
    const find =
      "select * from notifications where postId= ? and notificationByProfileId = ?";
    const value = [data.postId, data.notificationByProfileId];
    const oldData = await executeQuery(find, value);
    // if (oldData.length) {
    //   return oldData[0];
    // } else {
    // }
    const query1 = "insert into notifications set ?";
    const values1 = [data];
    const notificationData = await executeQuery(query1, values1);
    return { ...data, id: notificationData.insertId };
  }
};

const createComments = async function (params) {
  const data = {
    postId: params?.postId,
    profileId: params?.profileId,
    comment: params?.comment,
    parentCommentId: params?.parentCommentId,
    imageUrl: params?.imageUrl,
    title: params?.meta?.title || params?.title || null,
    metadescription:
      params?.meta?.metadescription?.toString() ||
      params?.metadescription?.toString() ||
      null,
    metaimage: params?.meta?.metaimage || params?.metaimage || null,
    metalink: params?.meta?.metalink || params?.metalink || null,
  };
  const query = params.id
    ? "update comments set ? where Id = ?"
    : "insert into comments set ?";
  const values = params.id ? [data, params.id] : [data];
  const commentData = await executeQuery(query, values);
  let notifications = [];
  let notification = {};
  if (data.parentCommentId) {
    const query1 = "select profileId from comments where postId= ?";
    const value = [data.postId];
    const comments = await executeQuery(query1, value);
    notification = await createNotification({
      notificationToProfileId: comments[0].profileId,
      postId: data.postId,
      notificationByProfileId: data?.profileId,
      actionType: "R",
      commentId: params?.id || commentData.insertId,
    });
  } else {
    const query1 = "select profileid from posts where id= ?";
    const value = [data.postId];
    const posts = await executeQuery(query1, value);
    notification = await createNotification({
      notificationToProfileId: posts[0].profileid,
      postId: data.postId,
      notificationByProfileId: data?.profileId,
      actionType: "C",
      commentId: params?.id || commentData.insertId,
    });
    if (params?.tags?.length > 0) {
      for (const key in params?.tags) {
        if (Object.hasOwnProperty.call(params?.tags, key)) {
          const tag = params?.tags[key];

          const notification = await createNotification({
            notificationToProfileId: tag?.id,
            postId: data.postId,
            notificationByProfileId: data?.profileId,
            actionType: "T",
            commentId: params?.id || commentData.insertId,
          });
          console.log("notification", notification);
          const findUser = `select u.Email,p.FirstName,p.LastName,p.Username from users as u left join profile as p on p.UserID = u.Id where p.postNotificationEmail = 'Y' and p.ID = ?`;
          const values = [tag?.id];
          const userData = await executeQuery(findUser, values);
          if (userData?.length) {
            const findSenderUser = `select p.ID,p.Username,p.FirstName,p.LastName from profile as p where p.ID = ?`;
            const values1 = [data?.profileId];
            const senderData = await executeQuery(findSenderUser, values1);
            notifications.push(notification);
            if (tag?.id) {
              const userDetails = {
                email: userData[0].Email,
                profileId: senderData[0].ID,
                userName: userData[0].Username,
                firstName: userData[0].FirstName,
                senderUsername: senderData[0].Username,
                type: "comment",
                postId: notification?.postId || postData?.id,
              };
              await notificationMail(userDetails);
            }
          }
        }
      }
    } else {
      notification = await createNotification({
        notificationToProfileId: posts[0].profileid,
        postId: data.postId,
        notificationByProfileId: data?.profileId,
        actionType: "C",
        commentId: params?.id || commentData.insertId,
      });
    }
  }
  notifications.push(notification);
  const query3 =
    "select c.*,pr.ProfilePicName, pr.Username, pr.FirstName from comments as c left join profile as pr on pr.ID = c.profileId where c.id = ?";
  const value3 = [params?.id || commentData.insertId];
  const comments = await executeQuery(query3, value3);

  return { notifications, comments };
};

const likeFeedComment = async function (params) {
  const { commentId, profileId, likeCount, actionType } = params;
  const query = `update comments set likeCount = ? where id =?`;
  const query1 = `INSERT INTO commentsLikesDislikes set ?`;
  const values = [likeCount, commentId];
  const data = {
    commentId: commentId,
    profileId: profileId,
    actionType: actionType,
  };
  const values1 = [data];
  const post = await executeQuery(query, values);
  const likeData = await executeQuery(query1, values1);
  const query3 =
    "select c.*,pr.ProfilePicName, pr.Username, pr.FirstName from comments as c left join profile as pr on pr.ID = c.profileId where c.id = ?";
  const value3 = [commentId];
  const comments = await executeQuery(query3, value3);
  return { comments };
};

const disLikeFeedComment = async function (params) {
  const { commentId, profileId, likeCount } = params;
  if (commentId) {
    const query = `update comments set likeCount = ? where id =?`;
    const query1 = `delete from commentsLikesDislikes where commentId = ? AND profileId = ?`;
    const values = [likeCount, commentId];
    const values1 = [commentId, profileId];
    const post = await executeQuery(query, values);
    const likeData = await executeQuery(query1, values1);
    const query3 =
      "select c.*,pr.ProfilePicName, pr.Username, pr.FirstName from comments as c left join profile as pr on pr.ID = c.profileId where c.id = ?";
    const value3 = [commentId];
    const comments = await executeQuery(query3, value3);
    return { comments };
  }
};

const deletePost = async function (params) {
  const { id } = params;
  console.log("delete-post-id", id);
  const query = "DELETE FROM posts WHERE id = ?";
  const query1 = "DELETE FROM comments WHERE postId = ?";
  const value = [id];
  const deletePost = await executeQuery(query, value);
  const deleteComments = await executeQuery(query1, value);
  return deletePost;
};

const readNotification = async function (id) {
  try {
    const query = `update notifications set isRead = 'Y' where notificationToProfileId = ${id} `;
    const notification = await executeQuery(query);
    return true;
  } catch (error) {
    return error;
  }
};

const ogPromise = (url) => {
  return new Promise((resolve, reject) => {
    og(url, async function (err, meta) {
      if (err) {
        reject(err);
      } else {
        const data = meta;
        resolve(data);
      }
    });
  });
};

const getMetaD = async function (params) {
  const { url } = params;
  if (url) {
    return await ogPromise(url);
  } else {
    return null;
  }
};

const viewingHistory = async function (data) {
  try {
    const { profileId, postId } = data;
    const query1 = `select * from viewingHistory where profileId = ? and postId = ?`;
    const values1 = [profileId, postId];
    const result1 = await executeQuery(query1, values1);
    if (result1.length) {
      console.log("result1", result1.length);
      const date = moment().format("YYYY-MM-DD HH:mm:ss");
      console.log(date);
      const query = `update viewingHistory set updatedDate = '${date}' where profileId = ? and postId = ?`;
      const values = [profileId, postId];
      const result = await executeQuery(query, values);
      return result1;
    } else {
      const query = `INSERT INTO viewingHistory set ?`;
      const values = [{ profileId, postId }];
      const result = await executeQuery(query, values);
      return result;
    }
  } catch (error) {
    return error;
  }
};

const getWatchHistory = async function (data) {
  try {
    console.log(data);
    const { profileId, page, size } = data;
    const { limit, offset } = getPagination(page, size);
    const queryCount = `select count(p.id) as count from viewingHistory as v left join posts as p on p.id = v.postId where v.profileId = ${profileId}`;
    const query = `select p.*, pr.ProfilePicName, pr.Username, pr.FirstName,fc.firstname,fc.unique_link,fc.profile_pic_name,fc.created from viewingHistory as v left join posts as p on p.id = v.postId left join profile as pr on p.profileid = pr.ID left join featured_channels as fc on fc.id = p.channelId where v.profileId = ? order by v.updatedDate desc limit ? offset ?`;
    const values = [profileId, limit, offset];
    const [videoCount] = await executeQuery(queryCount);
    const result = await executeQuery(query, values);
    if (result.length > 0) {
      return getPaginationData(
        { count: videoCount.count, docs: result },
        page,
        limit
      );
    } else {
      return [];
    }
  } catch (error) {
    return error;
  }
};

const suspendUser = async function (params) {
  try {
    const query = "UPDATE users SET IsSuspended = ? WHERE Id= ?";
    const values = [params.isSuspended, params.id];
    const user = await executeQuery(query, values);
    return user;
  } catch (error) {
    return error;
  }
};
