const express = require("express");
const router = express.Router();
const packingListController = require("./packing-list.controller");
const { authenticate } = require("../../middleware/auth");

router.use(authenticate);

// Packing List Routes
router.get("/", packingListController.getAll);
router.get("/container/:containerId", packingListController.getByContainerId);
router.post("/container/:containerId", packingListController.createOrUpdate);
router.get("/container/:containerId/import", packingListController.importLoadingItems);
router.get("/export/all", packingListController.exportAll);
router.get("/:id/export/excel", packingListController.exportExcel);
router.delete("/:id", packingListController.delete);

// Company Master (Templates) Routes
router.get("/templates", packingListController.getTemplates);
router.get("/templates/suggestions", packingListController.getTemplateSuggestions);
router.post("/templates", packingListController.upsertTemplate);
router.delete("/templates/:id", packingListController.deleteTemplate);

module.exports = router;