const express = require("express");
const router = express.Router();
const loadingSheetController = require("./loading-sheets.controller");
const { authenticate } = require("../../middleware/auth");
const multer = require("multer");
const path = require("path");

// All routes require authentication
router.use(authenticate);

// Photo upload configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Routes
router.get("/activities", loadingSheetController.getActivities);
router.get("/suggestions/shipping-marks", loadingSheetController.getShippingMarkSuggestions);
router.post("/upload-photo", upload.single("photo"), loadingSheetController.uploadPhoto);

router.get("/export/all", loadingSheetController.exportAllContainers);
router.get("/:id/export/excel", loadingSheetController.exportExcel);
router.get("/:id/export/pdf", loadingSheetController.exportPDF);
router.get("/:id/whatsapp", loadingSheetController.getWhatsAppSummary);
router.patch("/:id/status", loadingSheetController.updateStatus);

router.post("/container/:containerId", loadingSheetController.createOrUpdate);
router.get("/container/:containerId", loadingSheetController.getByContainer);
router.get("/:id", loadingSheetController.getById);
router.delete("/:id", loadingSheetController.delete);

module.exports = router;
