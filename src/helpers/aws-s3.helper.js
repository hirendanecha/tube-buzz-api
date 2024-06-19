const AWS = require("aws-sdk");
const fs = require("fs");
require("aws-sdk/lib/maintenance_mode_message").suppress = true;
const s3 = new AWS.S3({
  accessKeyId: "XZ1L2U32Z7XMOW5S5ZBD",
  secretAccessKey: "2e3lYJoXmocA5W3mVSpaDQF4qrDbbUA3kuFOO2Pe",
  endpoint: new AWS.Endpoint("s3.wasabisys.com"), // Wasabi endpoint
  region: "us-east-1",
});
exports.uploadFileToWasabi = async (file, key) => {
  return new Promise((resolve, reject) => {
    try {
      const fileStream = fs.createReadStream(file.path);
      const fileSize = file.size;

      const params = {
        Bucket: "tube-buzz",
        Key: key,
        Body: fileStream,
        ContentLength: fileSize,
      };

      const uploadRequest = s3.upload(params);

      uploadRequest.on("httpUploadProgress", function (progress) {
        const uploadedPercentage = Math.round(
          (progress.loaded / progress.total) * 100
        );
        console.log(`Uploading... ${uploadedPercentage}%`);
      });
      uploadRequest.send((err, data) => {
        if (err) {
          console.error("Error uploading file:", err);
          return res.status(500).send("Error uploading file");
        }

        // File uploaded successfully
        console.log("File uploaded successfully:", data.Location);
        fs.unlinkSync(file.path);
        resolve(data.Location);
      });
    } catch (error) {
      reject(error);
    }
  });
};
