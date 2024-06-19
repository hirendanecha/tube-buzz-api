var express = require("express");
var router = express.Router();

const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const utilsRoutes = require("./utils.routes");
const postRoutes = require("./post.routes");
const adminRouter = require("./admin.routes");
const profileRouter = require("./profile.routes");
const dashboardRouter = require("./dashboard.routes");
const featuredChannels = require("./featured-channels.routes");

router.use("/login", authRoutes);
router.use("/admin", adminRouter);
router.use("/posts", postRoutes);
router.use("/customers", userRoutes);
router.use("/utils", utilsRoutes);
router.use("/profile", profileRouter);
router.use("/dashboard", dashboardRouter);
// Tube tube routes //
router.use("/channels", featuredChannels);

module.exports = router;
