let logger = console;
const socket = {};
const socketService = require("../service/socket-service");
const environment = require("../environments/environment");
const Profile = require("../models/profile.model");
const jwt = require("jsonwebtoken");

socket.config = (server) => {
  const io = require("socket.io")(server, {
    transports: ["websocket", "polling"],
    cors: {
      origin: "*",
    },
  });
  socket.io = io;
  let onlineUsers = [];

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.Authorization.split(" ")[1];
      if (!token) {
        const err = new Error("Unauthorized Access");
        return next(err);
      }
      let decoded = jwt.decode(token);
      jwt.verify(token, environment.JWT_SECRET_KEY, async (err, user) => {
        if (err) {
          const err = new Error("Invalid or Expired Token");
          return next(err);
        }
        socket.user = decoded.user;
        if (decoded.user.username !== "admin") {
          const profile = await Profile.FindById(decoded.user.id);
          if (profile?.IsSuspended === "Y") {
            const err = new Error("user has been suspended");
            return next(err);
          }
        }
        // Function to join existing rooms
        if (socket.user.id) {
          socket.join(`${socket.user?.id}`);
        }
        next();
      });
    } catch (error) {
      const err = new Error("Invalid or Expired Token");
      return next(err);
    }
  });

  io.sockets.on("connection", (socket) => {
    let address = socket.request.connection.remoteAddress;

    logger.info(`New Connection`, {
      address,
      id: socket.id,
    });
    socket.on("leave", (params) => {
      logger.info("leaved", {
        ...params,
        address,
        id: socket.id,
        method: "leave",
      });
      socket.leave(params.room);
    });

    socket.on("join", async (params) => {
      socket.join(params.room, {
        ...params,
      });
      logger.info("join", {
        ...params,
        address,
        id: socket.id,
        method: "join",
      });
    });

    socket.on("disconnect", () => {
      logger.info("disconnected", {
        id: socket.id,
        method: "disconnect",
      });
      onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
      // send all online users to all users
      io.emit("get-users", onlineUsers);
    });

    socket.on("rooms", (params, cb) => {
      logger.info("Rooms", {
        id: socket.id,
        method: "rooms",
        type: typeof cb,
        params: params,
      });

      if (typeof cb === "function")
        cb({
          rooms: ["DSDsds"],
        });
    });

    // socket for post //
    socket.on("get-new-post", async (params) => {
      logger.info("New post found", {
        method: "New post found",
        params: params,
      });
      const data = await socketService.getPost(params);
      if (data) {
        socket.emit("new-post", data);
      }
    });

    socket.on("create-new-post", async (params, cb) => {
      logger.info("Create new post", {
        method: "Create new post",
        params: params,
      });
      try {
        const data = await socketService.createPost(params);
        if (data?.posts) {
          io.emit("new-post-added", data?.posts);
          console.log({ notifications: data?.notifications });
          if (data?.notifications) {
            for (const key in data?.notifications) {
              const notification = data?.notifications[key];
              console.log({ notification });
              io.to(`${notification.notificationToProfileId}`).emit(
                "notification",
                notification
              );
            }
          }

          // const socketData = await socketService.getPost(params);
          // if (typeof cb === "function") cb(socketData);
          // socket.broadcast.emit("new-post", socketData);
        }
      } catch (error) {}
    });

    socket.on("likeOrDislike", async (params) => {
      logger.info("like", {
        method: "Like on post",
        params: params,
      });
      if (params.actionType) {
        if (params.postId) {
          const data = await socketService.likeFeedPost(params);
          io.emit("likeOrDislike", data.posts);
          const notification = await socketService.createNotification({
            notificationToProfileId: params.toProfileId,
            postId: params.postId,
            notificationByProfileId: params.profileId,
            actionType: params.actionType,
          });
          // notification - emit - to user
          io.to(`${notification.notificationToProfileId}`).emit(
            "notification",
            notification
          );
        }
      } else {
        if (params.postId) {
          const data = await socketService.disLikeFeedPost(params);
          // socket.broadcast.emit("new-post", data);
          io.emit("likeOrDislike", data.posts);
        }
      }
    });

    socket.on("send-notification", (params) => {
      logger.info("likeOrDislikeNotify", {
        method: "User like on post",
        params: params,
      });
    });

    socket.on("comments-on-post", async (params) => {
      const data = await socketService.createComments(params);
      if (data.comments) {
        io.emit("comments-on-post", data?.comments);
      }
      if (data?.notifications) {
        for (const key in data?.notifications) {
          if (Object.hasOwnProperty.call(data?.notifications, key)) {
            const notification = data?.notifications[key];
            io.to(`${notification.notificationToProfileId}`).emit(
              "notification",
              notification
            );
          }
        }
      }
      logger.info("comments on post", {
        method: "User comment on post",
        params: params,
      });
    });

    socket.on("likeOrDislikeComments", async (params) => {
      logger.info("like", {
        method: "Like on post",
        params: params,
      });
      if (params.actionType) {
        const data = await socketService.likeFeedComment(params);
        socket.broadcast.emit("likeOrDislikeComments", data.comments);
        const notification = await socketService.createNotification({
          notificationToProfileId: params.toProfileId,
          postId: params.postId,
          commentId: params.commentId,
          notificationByProfileId: params.profileId,
          actionType: params.actionType,
        });
        // notification - emit - to user
        io.to(`${notification.notificationToProfileId}`).emit(
          "notification",
          notification
        );
      } else {
        const data = await socketService.disLikeFeedComment(params);
        socket.broadcast.emit("likeOrDislikeComments", data.comments);
      }
    });

    socket.on("deletePost", async (params) => {
      logger.info("like", {
        method: "delete post",
        params: params,
      });
      if (params.id) {
        const data = await socketService.deletePost(params);
        io.emit("deleted-post", { id: params.id });
      }
    });

    socket.on("isReadNotification", async (params) => {
      logger.info("like", {
        method: "read notification",
        params: params,
      });
      try {
        if (params.profileId) {
          await socketService.readNotification(params.profileId);
          params["isRead"] = "Y";
          io.to(`${params.profileId}`).emit("isReadNotification_ack", params);
        }
      } catch (error) {
        return error;
      }
    });

    socket.on("get-meta", async (params) => {
      logger.info("meta", {
        method: "get Meta",
        params: params,
      });
      if (params.url) {
        const data = await socketService.getMeta(params);
        if (data) {
          socket.emit("get-meta", data);
          // return data;
        }
      }
    });

    socket.on("add-watch-history", async (params) => {
      logger.info("meta", {
        method: "get Meta",
        params: params,
      });
      if (params) {
        const data = await socketService.viewingHistory(params);
        if (data) {
          // socket.emit("add-watch-history", data);
          return data;
        }
      }
    });
    socket.on("watch-history", async (params, cb) => {
      logger.info("meta", {
        method: "watch history",
        params: params,
      });
      if (params) {
        const data = await socketService.getWatchHistory(params);
        console.log(data);
        if (data) {
          return cb(data);
        }
      }
    });
  });
};

module.exports = socket;
