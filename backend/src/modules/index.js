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
const bifurcationRoutes = require("./bifurcation/bifurcation.routes");
const packingListRoutes = require("./packing-list/packing-list.routes");
const commercialInvoiceRoutes = require("./commercial-invoice/commercial-invoice.routes");
const containerInSummary = require("./containerSummary/containerSummary.routes");
const warehouseRoutes = require("./warehouse/warehouse.routes");
const clientsRoutes = require("./accounts/clients/clients.routes");
const dinieshbhaiRoutes = require("./accounts/dineshbhai/dineshbhai.routes");
const forexRoutes = require("./accounts/forex/forex.routes");

router.use("/loading", loadingRoutes);
router.use("/bifurcation", bifurcationRoutes);
router.use("/packing-list", packingListRoutes);
router.use("/commercial-invoice", commercialInvoiceRoutes);
router.use("/container-summaries", containerInSummary);
router.use("/warehouse", warehouseRoutes);
router.use("/accounts/clts", clientsRoutes);
router.use("/accounts/dineshbhai", dinieshbhaiRoutes);
router.use("/accounts/forex", forexRoutes);
module.exports = router;
// Add this with your other route imports

// Add this with your other app.use() statements
