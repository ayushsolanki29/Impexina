const express = require("express");
const loadingController = require("./loading.controller");
const loadingValidation = require("./loading.validation");
const { authenticate } = require("../../middleware/auth");
const { validateRequest } = require("../../middleware/validateRequest");
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const loadingService = require("./loading.service");

const router = express.Router();

// ===============================
// AUTH (ALL ROUTES PROTECTED)
// ===============================
router.use(authenticate);

// ===============================
// CREATE / LIST
// ===============================
router.post(
  "/",
  validateRequest(loadingValidation.createOrUpdate),
  loadingController.createOrUpdate
);

router.get(
  "/",
  validateRequest(loadingValidation.paginationQuery, "query"),
  loadingController.getAll
);

// ===============================
// SUGGESTIONS (MUST BE FIRST)
// ===============================
router.get(
  "/suggestions/containers",
  validateRequest(loadingValidation.searchQuery, "query"),
  loadingController.getContainers
);

router.get(
  "/suggestions/shipping-marks",
  validateRequest(loadingValidation.searchQuery, "query"),
  loadingController.getShippingMarks
);

// ===============================
// CONTAINERS OVERVIEW (BEFORE :id)
// ===============================
router.get(
  "/containers",
  validateRequest(loadingValidation.containersQuery, "query"),
  loadingController.getAllContainers
);

router.get(
  "/containers/export/csv",
  validateRequest(loadingValidation.containersQuery, "query"),
  loadingController.exportContainers
);

router.get("/containers/:containerCode", loadingController.getContainerDetails);

router.patch(
  "/containers/:containerCode/status",
  validateRequest(loadingValidation.updateContainerStatus),
  loadingController.updateContainerStatus
);
// Container details routes
router.get(
  "/containers/:containerCode/details",
  loadingController.getContainerDetails
);

router.post(
  "/containers/:containerCode/export/excel",
  loadingController.exportContainerExcel
);

router.post(
  "/containers/:containerCode/export/pdf",
  loadingController.exportContainerPDF
);

router.patch(
  "/containers/:containerCode/status",
  validateRequest(loadingValidation.updateContainerStatus),
  loadingController.updateContainerStatus
);

router.get(
  "/containers/:containerCode/search",
  loadingController.searchContainerItems
);

router.get(
  "/containers/:containerCode/clients/:clientName/summary",
  loadingController.getClientSummary
);
// Add these routes after other container routes
router.post(
  "/containers/:containerCode/export/image",
  loadingController.exportContainerImage
);

router.get(
  "/containers/:containerCode/clients/:clientName/preview",
  loadingController.getClientPreview
);
// ===============================
// PHOTO UPLOAD
// ===============================
router.post(
  "/upload-photo",
  authenticate,
  (req, res, next) => {
    const storage = multer.memoryStorage();

    const upload = multer({
      storage,
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(
          path.extname(file.originalname).toLowerCase()
        );
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) cb(null, true);
        else cb(new Error("Only image files are allowed"));
      },
    }).single("photo");

    upload(req, res, function (err) {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const { containerCode } = req.query;
      if (!containerCode) {
        return res.status(400).json({
          success: false,
          message: "Container code is required",
        });
      }

      const photoPath = await loadingService.uploadPhoto(
        req.file,
        containerCode
      );

      res.status(200).json({
        success: true,
        message: "Photo uploaded successfully",
        data: { photo: photoPath },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to upload photo",
      });
    }
  }
);

// ===============================
// SINGLE LOADING SHEET (LAST)
// ===============================
router.get("/:id", loadingController.getById);

router.patch(
  "/:id/status",
  validateRequest(loadingValidation.updateStatus),
  loadingController.updateStatus
);

router.get("/:id/activities", loadingController.getActivities);

router.delete("/:id", loadingController.delete);

module.exports = router;
