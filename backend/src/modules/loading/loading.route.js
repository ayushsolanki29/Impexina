const express = require('express');
const router = express.Router();
const multer = require('multer');
const loadingSheetController = require('./loading.controller');
const { authenticate, authorize } = require('../../middleware/auth');
const { 
  validateLoadingSheet, 
  validateLoadingSheetUpdate, 
  validateItems, 
  validateStatusUpdate,
  validateQuery 
} = require('./loading.validation');

// Configure multer for CSV uploads
const upload = multer({ 
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});


// Get all loading sheets
router.get('/', 

  loadingSheetController.getAllLoadingSheets
);

// Get loading sheet statistics
router.get('/statistics', 
  loadingSheetController.getStatistics
);

// Get loading sheet by ID
router.get('/:id', 
  loadingSheetController.getLoadingSheetById
);

// Create new loading sheet
router.post('/', 
  loadingSheetController.createLoadingSheet
);

// Update loading sheet
router.put('/:id',  
  loadingSheetController.updateLoadingSheet
);

// Update loading sheet status
router.patch('/:id/status', 
  loadingSheetController.updateLoadingSheetStatus
);

// Add items to loading sheet
router.post('/:id/items',  
  loadingSheetController.addItemsToLoadingSheet
);

// Upload CSV
router.post('/upload/csv', 
 
  upload.single('csvFile'),
  loadingSheetController.uploadCSV
);

// Delete loading sheet
router.delete('/:id', 
  loadingSheetController.deleteLoadingSheet
);

module.exports = router;