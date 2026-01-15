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
const packingListRoutes = require("./packing-list/packing-list.routes");
const commercialInvoiceRoutes = require("./commercial-invoice/commercial-invoice.routes");
const containerInSummary = require("./containerSummary/containerSummary.routes");
const AccountClientsRoutes = require("./accounts/clients/clients.routes");
const dinieshbhaiRoutes = require("./accounts/dineshbhai/dineshbhai.routes");
const davidSheet = require("./accounts/david/davidSheet.routes");
const paymentCollection = require("./accounts/paymentCollection/paymentCollection.routes");
const ShippingRoutes = require("./accounts/shipping/shipping.routes");
const ClientsRoutes = require("./clients/clients.routes");
const mumbaiLedger = require("./expenses/mumbai/mumbai-ledger.routes");
const ahmedabadPettyCashRoutes = require("./expenses/ahmedabad/ahmedabad-petty-cash.routes");
const usersRoutes = require("./users/users.routes");
const taskRoutes = require("./tasks/tasks.routes");
const clientOrderTracker = require("./client-order-tracker/order-tracker.routes");
const dashboardRoutes = require('./dashboard/dashboard.routes');
const profileRoutes = require('./profile/profile.routes');
const backupRoutes = require('./backup/backup.routes');
const containersRoutes = require('./containers/containers.routes');
const loadingSheetsRoutes = require('./loading-sheets/loading-sheets.routes');

// Add this to your routes

// Mount routes
router.use("/expenses/ahmedabad-petty-cash", ahmedabadPettyCashRoutes);
router.use("/packing-list", packingListRoutes);
router.use("/commercial-invoice", commercialInvoiceRoutes);
router.use("/container-summaries", containerInSummary);
router.use("/accounts/clts", AccountClientsRoutes);
router.use("/accounts/dineshbhai", dinieshbhaiRoutes);
router.use("/accounts/david", davidSheet);
router.use("/accounts/collection", paymentCollection);
router.use("/accounts/shipping", ShippingRoutes);
router.use("/accounts/tukaram", require("./accounts/tukaram/tukaram.routes"));
router.use("/clients", ClientsRoutes);
router.use("/expenses/mumbai-ledger", mumbaiLedger);
router.use("/expenses/ahmedabad-petty-cash", ahmedabadPettyCashRoutes);
router.use("/users", usersRoutes);
router.use("/tasks", taskRoutes);
router.use("/client-order-tracker", clientOrderTracker);
router.use("/dashboard", dashboardRoutes);
router.use("/profile", profileRoutes);
router.use("/backups", backupRoutes);
router.use("/containers", containersRoutes);
router.use("/loading-sheets", loadingSheetsRoutes);
router.use("/bifurcation", require("./bifurcation/bifurcation.routes"));
router.use("/invoice", require("./invoice/invoice.routes"));
router.use("/warehouse", require("./warehouse/warehouse.routes"));
router.use("/settings", require("./settings/settings.routes"));

// Generic Upload Route
const upload = require("../middleware/upload");
const fs = require('fs');
const path = require('path');

router.post("/upload", require("../middleware/auth").authenticate, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const fileName = `${Date.now()}_${req.file.originalname.replace(/\s+/g, "_")}`;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, req.file.buffer);

    res.json({
      success: true,
      url: `/uploads/${fileName}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
