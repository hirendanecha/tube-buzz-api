const multer = require("multer");
const fs = require("fs");
var path = require("path");
const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");
const { S3Client } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: "us-east-1",
  endpoint: new AWS.Endpoint("s3.wasabisys.com"),

  credentials: {
    accessKeyId: "XZ1L2U32Z7XMOW5S5ZBD",
    secretAccessKey: "2e3lYJoXmocA5W3mVSpaDQF4qrDbbUA3kuFOO2Pe",
  },
  logger: (d) => {
    console.log("S3 Logger : ", d);
  },
});

// const s3 = new AWS.S3({
//   accessKeyId: "XZ1L2U32Z7XMOW5S5ZBD",
//   secretAccessKey: "2e3lYJoXmocA5W3mVSpaDQF4qrDbbUA3kuFOO2Pe",
//   endpoint: new AWS.Endpoint("s3.wasabisys.com"), // Wasabi endpoint
//   region: "us-east-1",
// });

const mimeTypes = (mediaType) => {
  switch (mediaType) {
    case "image":
      return [
        "image/bmp",
        "image/gif",
        "image/ief",
        "image/jpeg",
        "image/pipeg",
        "image/tiff",
        "image/svg+xml",
        "image/png",
        "image/ico",
      ];
    case "audio":
      return [
        "audio/basic",
        "audio/mid",
        "audio/mpeg",
        "audio/mp3",
        "audio/x-mpegurl",
        "audio/x-pn-realaudio",
        "audio/x-wav",
        "audio/x-pn-realaudio",
        "audio/x-aiff",
      ];
    case "video":
      return [
        "video/mpeg",
        "video/mp4",
        "video/quicktime",
        "video/x-la-asf",
        "video/x-ms-asf",
        "video/x-msvideo",
        "video/x-sgi-movie",
      ];
    case "pdf":
      return ["application/pdf"];
    case "csv":
      return ["application/vnd.ms-excel", "text/csv"];
    case "text":
      return ["text/plain"];

    default:
      return [];
  }
};

const fileFilter = (mimeTypeArray) => {
  const allowedMimes = mimeTypeArray.map((m) => mimeTypes(m));
  return (req, file, cb) => {
    if ([].concat.apply([], allowedMimes).includes(file.mimetype)) {
      cb(null, true);
    } else {
      req.fileValidationError = "invalid mime type";
      cb(null, false, new Error("invalid mime type"));
    }
  };
};

const folderName = path.join(__dirname, "../uploads");
if (!fs.existsSync(folderName)) {
  fs.mkdirSync(folderName);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, folderName);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

// const upload = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: "freedom-social",
//     contentType: multerS3.AUTO_CONTENT_TYPE,
//     key: function (req, file, cb) {
//       console.log("upload file ===>", file);
//       cb(null, Date.now().toString() + "-" + file.originalname);
//     },
//   }),
//   limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10GB file size limit
// });


// Track progress
// upload.on('httpUploadProgress', function(progress) {
//   const percentProgress = Math.round((progress.loaded / progress.total) * 100);
//   console.log('Upload progress:', percentProgress + '%');
// });

const uploadFileMiddleware = multer({ storage: storage });
module.exports = uploadFileMiddleware;
//====================
