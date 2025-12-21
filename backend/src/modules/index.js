const express = require("express");
const router = express.Router();

/* ===============================
   BASE / HOME
================================ */
router.use("/", require("./server-home/home.route"));

/* ===============================
   AUTH MODULE
================================ */
router.use("/auth", require("./auth/auth.routes"));

/* ===============================
   ( Modules)
================================ */
const loadingRoutes = require("./loading/loading.routes");

router.use("/loading", loadingRoutes);

module.exports = router;
