// routes/stock.js
import express from 'express';
import Stock from '../models/Stock.js';
import { body, validationResult } from 'express-validator';
import { tenantAuth } from '../middleware/tenantAuth.js';

const router = express.Router();

// Apply tenant-aware middleware to all routes
router.use(tenantAuth);

// Get all stock items
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, lowStock } = req.query;

    let query = { ...req.tenantQuery };

    if (search) {
      query.itemName = { $regex: search, $options: 'i' };
    }

    if (category) {
      query.category = category;
    }

    if (lowStock === 'true') {
      // This will be handled in the aggregation pipeline
    }

    const skip = (page - 1) * limit;

    let aggregationPipeline = [
      { $match: query },
      {
        $addFields: {
          isLowStock: { $lte: ['$currentStock', '$minimumStock'] },
          stockStatus: {
            $cond: {
              if: { $eq: ['$currentStock', 0] },
              then: 'out_of_stock',
              else: {
                $cond: {
                  if: { $lte: ['$currentStock', '$minimumStock'] },
                  then: 'low_stock',
                  else: {
                    $cond: {
                      if: { $and: ['$maximumStock', { $gte: ['$currentStock', '$maximumStock'] }] },
                      then: 'over_stock',
                      else: 'normal'
                    }
                  }
                }
              }
            }
          }
        }
      }
    ];

    if (lowStock === 'true') {
      aggregationPipeline.push({ $match: { isLowStock: true } });
    }

    aggregationPipeline.push(
      { $sort: { itemName: 1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    );

    const items = await Stock.aggregate(aggregationPipeline);
    const total = await Stock.countDocuments(query);

    res.json({
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching stock:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get low stock alerts
router.get('/alerts', async (req, res) => {
  try {
    const lowStockItems = await Stock.find({
      currentStock: { $lte: '$minimumStock' },
      isActive: true
    }).sort({ currentStock: 1 });

    const alerts = lowStockItems.map(item => ({
      id: item._id,
      itemName: item.itemName,
      currentStock: item.currentStock,
      minimumStock: item.minimumStock,
      status: item.currentStock === 0 ? 'out_of_stock' : 'low_stock'
    }));

    res.json({ alerts });
  } catch (error) {
    console.error('Error fetching stock alerts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create stock item
router.post('/', [
  body('itemName').trim().isLength({ min: 1 }).withMessage('Item name is required'),
  body('unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
  body('currentStock').optional().isInt({ min: 0 }).withMessage('Current stock must be non-negative'),
  body('minimumStock').optional().isInt({ min: 0 }).withMessage('Minimum stock must be non-negative')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation errors', errors: errors.array() });
    }

    const { itemName, description, category, unitPrice, currentStock = 0, minimumStock = 10, maximumStock, supplier } = req.body;

    // Check if item already exists
    const existingItem = await Stock.findOne({ itemName });
    if (existingItem) {
      return res.status(400).json({ message: 'Item with this name already exists' });
    }

    const item = new Stock({
      itemName, description, category, unitPrice,
      currentStock, minimumStock, maximumStock, supplier,
      tenant: req.user.tenantId
    });

    await item.save();

    res.status(201).json({
      message: 'Stock item created successfully',
      item
    });
  } catch (error) {
    console.error('Error creating stock item:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update stock item
router.put('/:id', [
  body('itemName').optional().trim().isLength({ min: 1 }).withMessage('Item name cannot be empty'),
  body('unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
  body('currentStock').optional().isInt({ min: 0 }).withMessage('Current stock must be non-negative'),
  body('minimumStock').optional().isInt({ min: 0 }).withMessage('Minimum stock must be non-negative')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation errors', errors: errors.array() });
    }

    const { itemName, description, category, unitPrice, minimumStock, maximumStock, supplier } = req.body;

    const update = {};
    if (itemName) update.itemName = itemName;
    if (description !== undefined) update.description = description;
    if (category !== undefined) update.category = category;
    if (unitPrice !== undefined) update.unitPrice = unitPrice;
    if (minimumStock !== undefined) update.minimumStock = minimumStock;
    if (maximumStock !== undefined) update.maximumStock = maximumStock;
    if (supplier !== undefined) update.supplier = supplier;

    const item = await Stock.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantQuery },
      update,
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Stock item not found' });
    }

    res.json({
      message: 'Stock item updated successfully',
      item
    });
  } catch (error) {
    console.error('Error updating stock item:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Item name already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update stock quantity (add/subtract)
router.patch('/:id/stock', [
  body('quantity').isInt().withMessage('Quantity must be an integer'),
  body('operation').isIn(['add', 'subtract']).withMessage('Operation must be add or subtract')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation errors', errors: errors.array() });
    }

    const { quantity, operation } = req.body;

    const item = await Stock.findOne({ _id: req.params.id, ...req.tenantQuery });

    if (!item) {
      return res.status(404).json({ message: 'Stock item not found' });
    }

    await item.updateStock(Math.abs(quantity), operation);

    res.json({
      message: 'Stock updated successfully',
      item
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    if (error.message === 'Insufficient stock') {
      return res.status(400).json({ message: 'Insufficient stock available' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete stock item
router.delete('/:id', async (req, res) => {
  try {
    const item = await Stock.findOneAndDelete({ _id: req.params.id, ...req.tenantQuery });

    if (!item) {
      return res.status(404).json({ message: 'Stock item not found' });
    }

    res.json({ message: 'Stock item deleted successfully' });
  } catch (error) {
    console.error('Error deleting stock item:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get stock statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Stock.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$currentStock', '$unitPrice'] } },
          lowStockItems: {
            $sum: {
              $cond: [{ $lte: ['$currentStock', '$minimumStock'] }, 1, 0]
            }
          },
          outOfStockItems: {
            $sum: {
              $cond: [{ $eq: ['$currentStock', 0] }, 1, 0]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalItems: 0,
      totalValue: 0,
      lowStockItems: 0,
      outOfStockItems: 0
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching stock stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export { router as stockRoutes };










