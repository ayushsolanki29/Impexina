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
const AccountClientsRoutes = require("./accounts/clients/clients.routes");
const dinieshbhaiRoutes = require("./accounts/dineshbhai/dineshbhai.routes");
const davidSheet = require("./accounts/david/davidSheet.routes");
const paymentCollection = require("./accounts/paymentCollection/paymentCollection.routes");
const ShippingRoutes = require("./accounts/shipping/shipping.routes");
const ClientsRoutes = require("./clients/clients.routes");
const mumbaiLedger = require("./expenses/mumbai/mumbai-ledger.routes");
const ahmedabadPettyCashRoutes = require("./expenses/ahmedabad/ahmedabad-petty-cash.routes");

// Mount routes
router.use("/expenses/ahmedabad-petty-cash", ahmedabadPettyCashRoutes);
router.use("/loading", loadingRoutes);
router.use("/bifurcation", bifurcationRoutes);
router.use("/packing-list", packingListRoutes);
router.use("/commercial-invoice", commercialInvoiceRoutes);
router.use("/container-summaries", containerInSummary);
router.use("/warehouse", warehouseRoutes);
router.use("/accounts/clts", AccountClientsRoutes);
router.use("/accounts/dineshbhai", dinieshbhaiRoutes);
router.use("/accounts/david", davidSheet);
router.use("/accounts/collection", paymentCollection);
router.use("/accounts/shipping", ShippingRoutes);
router.use("/clients", ClientsRoutes);
router.use("/expenses/mumbai-ledger", mumbaiLedger); 
router.use("/expenses/ahmedabad-petty-cash", ahmedabadPettyCashRoutes); 

module.exports = router;
