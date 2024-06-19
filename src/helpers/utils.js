const environment = require("../environments/environment");
const email = require("./email");
const jwt = require("jsonwebtoken");
const __upload_dir = environment.UPLOAD_DIR;
var fs = require("fs");
const db = require("../../config/db.config");

exports.send404 = function (res, err) {
  res.status(404).send({ error: true, message: err });
};

exports.send500 = function (res, err) {
  res.status(500).send({ error: true, message: err });
};

exports.isWithinRange = function (text, min, max) {
  // check if text is between min and max length
};

exports.getactualfilename = (fname, folder, id) => {
  var fileName = fname;
  const dir = __upload_dir + "/" + folder + "/" + id;
  console.log(dir);
  let files = fs.readdirSync(dir);
  if (files && files.length > 0) {
    files.forEach((file) => {
      console.log("file >> ", file);
      if (fileName.indexOf(file.split(".")[0]) !== -1) {
        fileName = file;
      }
    });
  }

  return [dir, fileName];
};

exports.registrationMail = async (userData, userId) => {
  let jwtSecretKey = environment.JWT_SECRET_KEY;
  let name = userData?.Username || userData.FirstName + " " + userData.LastName;

  const token = jwt.sign(
    {
      userId: userId,
      email: userData.Email,
    },
    jwtSecretKey,
    { expiresIn: "730 days" }
  );

  let registerUrl = `${environment.API_URL}customers/user/verification/${token}`;

  const mailObj = {
    email: userData.Email,
    subject: "Account Activation link",
    root: "../email-templates/registration.ejs",
    templateData: { name: name, url: registerUrl },
  };

  await email.sendMail(mailObj);
  return;
};

exports.forgotPasswordMail = async (user) => {
  console.log(user);
  if (user) {
    let name = user?.Username || user?.FirstName + " " + user?.LastName;
    const token = jwt.sign(
      {
        userId: user?.Id,
      },
      environment.JWT_SECRET_KEY,
      { expiresIn: "1d" }
    );

    let forgotPasswordUrl = `${environment.FRONTEND_URL}reset-password/user?accesstoken=${token}`;
    const mailObj = {
      email: user?.Email,
      subject: "Forgot password",
      root: "../email-templates/forgot-password.ejs",
      templateData: { name: name, url: forgotPasswordUrl },
    };

    const emailData = await email.sendMail(mailObj);
    return emailData;
  } else {
    return { error: "User not found with this email" };
  }
};

exports.notificationMail = async (userData) => {
  let name = userData?.userName || userData.firstName;
  let msg =
    userData?.msg ||
    `You were tagged in ${userData.senderUsername}'s ${userData.type}.`;
  let redirectUrl = userData.postId
    ? `${environment.FRONTEND_URL}post/${userData.postId}`
    : `${environment.FRONTEND_URL}`;

  const mailObj = {
    email: userData.email,
    subject: "Tube notification",
    root: "../email-templates/notification.ejs",
    templateData: { name: name, msg: msg, url: redirectUrl },
  };

  await email.sendMail(mailObj);
  return;
};

exports.notificationMailOnInvite = async (userData) => {
  let name = userData?.userName || userData.firstName;
  let msg = userData.msg;
  let redirectUrl = `${environment.FRONTEND_URL}profile-chats`;

  const mailObj = {
    email: userData.email,
    subject: "Tube notification",
    root: "../email-templates/notification.ejs",
    templateData: { name: name, msg: msg, url: redirectUrl },
  };

  await email.sendMail(mailObj);
  return;
};

exports.channelNotificationEmail = async (userData) => {
  let name = userData?.Username;
  let msg = `You have been assign in TubeBuzz channel by the TubeBuzz Admin.
             To access your channel, log into your TubeBuzz account,click on the
             TubeBuzz icon at the top of the page,then click on My Channel.`;
  let redirectUrl = `${environment.FRONTEND_URL}`;

  const mailObj = {
    email: userData.Email,
    subject: "Tube notification",
    root: "../email-templates/notification.ejs",
    templateData: { name: name, msg: msg, url: redirectUrl },
  };

  await email.sendMail(mailObj);
  return;
};


exports.channelCreationMail = async (adminMail, userName) => {
  let redirectUrl = "https://admin.tube.buzz/community";
  let msg = `${userName} has create community on Tube.buzz.`;
  const mailObj = {
    email: adminMail,
    subject: "New community registered",
    root: "../email-templates/notification.ejs",
    templateData: { name: "Admin", msg: msg, url: redirectUrl },
  };

  await email.sendMail(mailObj);
  return;
};

exports.executeQuery = async (query, values = []) => {
  return new Promise((resolve, reject) => {
    db.query(query, values, function (err, result) {
      if (err) {
        return reject(err);
      }
      return resolve(result);
    });
  });
};
