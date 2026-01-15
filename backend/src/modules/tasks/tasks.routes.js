const express = require("express");
const router = express.Router();
const taskController = require("./task.controller");
const taskTemplateController = require("./taskTemplate.controller");
const authMiddleware = require("../../middleware/auth");

// All routes require authentication
router.use(authMiddleware.authenticate);

// =====================================================
// NEW TASK MANAGEMENT SYSTEM ROUTES
// =====================================================

// --- TEMPLATES ---
// Get all templates
router.get("/templates", taskTemplateController.getAllTemplates);

// Get template categories
router.get("/templates/categories", taskTemplateController.getCategories);

// Get single template
router.get("/templates/:id", taskTemplateController.getTemplateById);

// Create template (any authenticated user can create)
router.post("/templates", taskTemplateController.createTemplate);

// Update template
router.put("/templates/:id", taskTemplateController.updateTemplate);

// Delete template
router.delete("/templates/:id", taskTemplateController.deleteTemplate);

// --- ASSIGNMENTS ---
// Get all assignments (admin view)
router.get("/assignments", taskTemplateController.getAllAssignments);

// Get user's assigned tasks (My Tasks)
router.get("/my-assignments", taskTemplateController.getMyTasks);

// Create assignment (assign task to user)
router.post("/assignments", taskTemplateController.createAssignment);

// Create self task (user creates their own task)
router.post("/self-task", taskTemplateController.createSelfTask);

// Get single assignment
router.get("/assignments/:id", taskTemplateController.getAssignmentById);

// Update assignment
router.put("/assignments/:id", taskTemplateController.updateAssignment);

// Delete assignment
router.delete("/assignments/:id", taskTemplateController.deleteAssignment);

// --- COMPLETIONS ---
// Complete a task
router.post("/assignments/:id/complete", taskTemplateController.completeTask);

// Get completions for an assignment
router.get("/assignments/:id/completions", taskTemplateController.getCompletions);

// Get user's completion history
router.get("/my-completions", taskTemplateController.getMyCompletions);

// --- STATISTICS & UTILITIES ---
// Get statistics
router.get("/v2/stats", taskTemplateController.getStats);

// Get users for assignment
router.get("/assignable-users", taskTemplateController.getUsersForAssignment);

// Get min completion characters setting
router.get("/settings/min-chars", taskTemplateController.getMinCompletionChars);

// --- ADMIN PERFORMANCE REPORTS ---
// Get all completions (admin view)
router.get("/admin/completions", taskTemplateController.getAllCompletions);

// Get user performance report
router.get("/admin/performance", taskTemplateController.getUserPerformanceReport);

// Get performance summary by period
router.get("/admin/performance-summary", taskTemplateController.getPerformanceSummary);

// =====================================================
// LEGACY ROUTES (for backward compatibility)
// =====================================================

// Get user's own tasks (legacy)
router.get("/my-tasks", taskController.getMyTasks);

// Get dashboard stats (legacy)
router.get("/stats", taskController.getTaskStats);

// Get tasks by frequency (legacy)
router.get("/my-tasks/frequency/:frequency", taskController.getTasksByFrequency);

// Mark task as complete (legacy)
router.post("/:id/complete", taskController.markComplete);

// Get single task (legacy)
router.get("/:id", taskController.getTaskById);

// Get all tasks (legacy)
router.get("/", taskController.getAllTasks);

// Get users for assignment (legacy)
router.get("/users/assignable", taskController.getUsersForAssignment);

// Create task (legacy)
router.post("/", taskController.createTask);

// Update task (legacy)
router.put("/:id", taskController.updateTask);

// Delete task (legacy)
router.delete("/:id", taskController.deleteTask);

module.exports = router;
