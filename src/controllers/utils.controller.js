"use strict";

const formidable = require("formidable");
var fs = require("fs");
const path = require("path");
const utils = require("../helpers/utils");
const environment = require("../environments/environment");
const apiUrl = environment.API_URL + "utils";
const __upload_dir = environment.UPLOAD_DIR;
const s3 = require("../helpers/aws-s3.helper");

exports.uploadVideo = async function (req, res) {
  console.log(req.file);
  const url = await s3.uploadFileToWasabi(
    req.file,
    req.file?.originalname.replace(" ", "-")
  );
  console.log(url);
  if (url) {
    return res.json({
      error: false,
      url: url,
    });
  } else {
    return utils.send500(res, err);
  }
};
