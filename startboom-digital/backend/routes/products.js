import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import { promisify } from 'util';
import Product from '../models/Product.js';
import AuditLog from '../models/AuditLog.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();
const unlinkFile = promisify(fs.unlink);

// Configure multer for CSV upload
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
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

// @route   GET /api/products
// @desc    Get all products for tenant
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      category,
      search,
      isActive,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const query = { tenant: req.user.tenant };

    // Filters
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const products = await Product.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('createdBy', 'firstName lastName email')
      .lean();

    const total = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Server error fetching products' });
  }
});

// @route   GET /api/products/categories
// @desc    Get all unique categories and subcategories
// @access  Private
router.get('/categories', auth, async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { tenant: req.user.tenant, isActive: true } },
      {
        $group: {
          _id: '$category',
          subcategories: { $addToSet: '$subcategories' }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          subcategories: {
            $reduce: {
              input: '$subcategories',
              initialValue: [],
              in: { $setUnion: ['$$value', '$$this'] }
            }
          }
        }
      },
      { $sort: { category: 1 } }
    ]);

    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Server error fetching categories' });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    }).populate('createdBy updatedBy', 'firstName lastName email');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Admin/Manager)
router.post('/', auth, async (req, res) => {
  try {
    const productData = {
      ...req.body,
      tenant: req.user.tenant,
      createdBy: req.user.id
    };

    const product = new Product(productData);
    await product.save();

    // Audit log
    await AuditLog.create({
      tenant: req.user.tenant,
      user: req.user.id,
      action: 'product.create',
      resource: 'Product',
      resourceId: product._id,
      details: { name: product.name, sku: product.sku }
    });

    res.status(201).json({ product });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Product SKU already exists' });
    }
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Server error creating product' });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Admin/Manager)
router.put('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Update fields
    Object.assign(product, req.body);
    product.updatedBy = req.user.id;
    await product.save();

    // Audit log
    await AuditLog.create({
      tenant: req.user.tenant,
      user: req.user.id,
      action: 'product.update',
      resource: 'Product',
      resourceId: product._id,
      details: { name: product.name }
    });

    res.json({ product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Server error updating product' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product (soft delete)
// @access  Private (Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    product.isActive = false;
    product.updatedBy = req.user.id;
    await product.save();

    // Audit log
    await AuditLog.create({
      tenant: req.user.tenant,
      user: req.user.id,
      action: 'product.delete',
      resource: 'Product',
      resourceId: product._id,
      details: { name: product.name }
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Server error deleting product' });
  }
});

// @route   POST /api/products/bulk-upload
// @desc    Bulk upload products via CSV
// @access  Private (Admin/Manager)
router.post('/bulk-upload', auth, upload.single('file'), async (req, res) => {
  let filePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    filePath = req.file.path;
    const results = [];
    const errors = [];

    // Parse CSV
    const parsePromise = new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => results.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    await parsePromise;

    // Validate and prepare products
    const productsToInsert = [];
    const skus = new Set();

    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      const lineNumber = i + 2; // +2 because row 1 is header, array is 0-indexed

      // Validate required fields
      if (!row.category || !row.name || !row.sku || !row.price) {
        errors.push({
          line: lineNumber,
          error: 'Missing required fields (category, name, sku, price)',
          data: row
        });
        continue;
      }

      // Check for duplicate SKUs in CSV
      if (skus.has(row.sku)) {
        errors.push({
          line: lineNumber,
          error: `Duplicate SKU in CSV: ${row.sku}`,
          data: row
        });
        continue;
      }
      skus.add(row.sku);

      // Parse subcategories (comma-separated)
      const subcategories = row.subcategory
        ? row.subcategory.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      // Build product object
      const product = {
        tenant: req.user.tenant,
        name: row.name.trim(),
        sku: row.sku.trim(),
        category: row.category.trim(),
        subcategories,
        price: parseFloat(row.price),
        description: row.description || '',
        unit: row.unit || 'piece',
        currency: row.currency || 'UGX',
        stockQuantity: parseInt(row.stock_quantity) || 0,
        lowStockThreshold: parseInt(row.low_stock_threshold) || 10,
        createdBy: req.user.id
      };

      // Validate price
      if (isNaN(product.price) || product.price < 0) {
        errors.push({
          line: lineNumber,
          error: 'Invalid price',
          data: row
        });
        continue;
      }

      productsToInsert.push(product);
    }

    // Check for existing SKUs in database
    if (productsToInsert.length > 0) {
      const existingProducts = await Product.find({
        tenant: req.user.tenant,
        sku: { $in: productsToInsert.map(p => p.sku) }
      }).select('sku');

      const existingSkus = new Set(existingProducts.map(p => p.sku));

      const finalProducts = productsToInsert.filter((product, index) => {
        if (existingSkus.has(product.sku)) {
          errors.push({
            line: index + 2,
            error: `SKU already exists in database: ${product.sku}`,
            data: product
          });
          return false;
        }
        return true;
      });

      // Insert products
      if (finalProducts.length > 0) {
        await Product.insertMany(finalProducts);

        // Audit log
        await AuditLog.create({
          tenant: req.user.tenant,
          user: req.user.id,
          action: 'product.bulk_upload',
          resource: 'Product',
          details: {
            total: results.length,
            imported: finalProducts.length,
            errors: errors.length
          }
        });
      }

      res.json({
        message: 'Bulk upload completed',
        imported: finalProducts.length,
        errors: errors.length,
        errorDetails: errors
      });
    } else {
      res.status(400).json({
        error: 'No valid products to import',
        errors: errors.length,
        errorDetails: errors
      });
    }
  } catch (error) {
    console.error('Error in bulk upload:', error);
    res.status(500).json({ error: 'Server error during bulk upload' });
  } finally {
    // Clean up uploaded file
    if (filePath) {
      try {
        await unlinkFile(filePath);
      } catch (err) {
        console.error('Error deleting temp file:', err);
      }
    }
  }
});

// @route   POST /api/products/:id/update-stock
// @desc    Update product stock
// @access  Private
router.post('/:id/update-stock', auth, async (req, res) => {
  try {
    const { quantity, operation = 'subtract' } = req.body;

    if (!quantity || quantity < 0) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    const product = await Product.findOne({
      _id: req.params.id,
      tenant: req.user.tenant
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.updateStock(quantity, operation);

    // Audit log
    await AuditLog.create({
      tenant: req.user.tenant,
      user: req.user.id,
      action: 'product.stock_update',
      resource: 'Product',
      resourceId: product._id,
      details: {
        name: product.name,
        operation,
        quantity,
        newStock: product.stockQuantity
      }
    });

    res.json({ product });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: 'Server error updating stock' });
  }
});

export default router;
