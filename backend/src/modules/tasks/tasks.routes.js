const express = require("express");
const router = express.Router();
const taskController = require("./task.controller");
const authMiddleware = require("../../middleware/auth");

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    next();
  };
};

// Query validation middleware
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    next();
  };
};

// All routes require authentication
router.use(authMiddleware.authenticate);

// ========== PUBLIC ROUTES (For all authenticated users) ==========

// Get user's own tasks
router.get(
  "/my-tasks",

  taskController.getMyTasks
);

// Get dashboard stats
router.get("/stats", taskController.getTaskStats);

// Get tasks by frequency
router.get(
  "/my-tasks/frequency/:frequency",
  taskController.getTasksByFrequency
);

// Mark task as complete
router.post(
  "/:id/complete",

  taskController.markComplete
);

// Get single task (can view if assigned or admin)
router.get("/:id", taskController.getTaskById);



// Task management
router.get(
  "/",

  taskController.getAllTasks
);

router.get("/users/assignable", taskController.getUsersForAssignment);

router.post(
  "/",

  taskController.createTask
);

router.put(
  "/:id",
  taskController.updateTask
);

router.delete("/:id", taskController.deleteTask);

module.exports = router;
