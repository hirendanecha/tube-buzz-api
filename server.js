const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();
var indexRouter = require("./src/routes");
const app = express();
(fs = require("fs")), (helmet = require("helmet"));

var originsWhitelist = ["*"];
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(helmet()); // Add Helmet as a middleware

app.use(morgan("tiny"));

app.use(
  bodyParser.urlencoded({ extended: true, limit: 1024 * 1024 * 1024 * 10 })
);
app.use(
  bodyParser.json({
    limit: 1024 * 1024 * 1024 * 10,
  })
);

app.use(cookieParser());

// app.options("*", cors(corsOptions));

// All routes for the APIs //

app.use("/uploads", express.static(__dirname + "/uploads"));

app.get("/", (req, res) => {
  res.writeHead(200);
  res.send("LFM API Server");
});

try {
  // Initiate the API //
  app.use("/api/v1/", indexRouter);
} catch (e) {
  console.log(e);
}

const port = process.env.PORT || 8080;

module.exports = app;
