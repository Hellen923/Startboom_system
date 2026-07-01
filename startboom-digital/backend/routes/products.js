import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import { promisify } from 'util';
import Product from '../models/Product.js';
import AuditLog from '../models/AuditLog.js';
import { tenantAuth, requireRole } from '../middleware/tenantAuth.js';

const router = express.Router();
const unlinkFile = promisify(fs.unlink);

// Apply tenant-aware auth to ALL routes
router.use(tenantAuth);

const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// GET /api/products — all roles can read the catalogue
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, category, search, isActive, sortBy = 'name', sortOrder = 'asc' } = req.query;
    const query = { ...req.tenantQuery };
    if (category) query.category = category;
    // Agents see only active products; admins can filter by isActive
    if (req.user.role === 'agent') {
      query.isActive = true;
    } else if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
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
      .limit(Number(limit))
      .skip((page - 1) * Number(limit))
      .lean();
    const total = await Product.countDocuments(query);
    res.json({ products, totalPages: Math.ceil(total / Number(limit)), currentPage: parseInt(page), total });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Server error fetching products' });
  }
});

// GET /api/products/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { ...req.tenantQuery, isActive: true } },
      { $group: { _id: '$category', subcategories: { $addToSet: '$subcategories' } } },
      {
        $project: {
          _id: 0,
          category: '$_id',
          subcategories: {
            $reduce: { input: '$subcategories', initialValue: [], in: { $setUnion: ['$$value', '$$this'] } }
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

// POST /api/products/bulk-upload — admin/manager only
// NOTE: must be defined BEFORE /:id to avoid route collision
router.post('/bulk-upload', requireRole(['admin', 'manager']), upload.single('file'), async (req, res) => {
  let filePath = null;
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    filePath = req.file.path;
    const results = [];
    const errors = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => results.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    const productsToInsert = [];
    const skus = new Set();

    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      const lineNumber = i + 2;
      if (!row.category || !row.name || !row.sku || !row.price) {
        errors.push({ line: lineNumber, error: 'Missing required fields (category, name, sku, price)', data: row });
        continue;
      }
      if (skus.has(row.sku)) {
        errors.push({ line: lineNumber, error: `Duplicate SKU in CSV: ${row.sku}`, data: row });
        continue;
      }
      skus.add(row.sku);

      const price = parseFloat(row.price);
      if (isNaN(price) || price < 0) {
        errors.push({ line: lineNumber, error: 'Invalid price', data: row });
        continue;
      }

      const subcategories = row.subcategory
        ? row.subcategory.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      productsToInsert.push({
        tenant: req.tenantId,
        name: row.name.trim(),
        sku: row.sku.trim(),
        category: row.category.trim(),
        subcategories,
        price,
        description: row.description || '',
        unit: row.unit || 'piece',
        currency: row.currency || 'UGX',
        stockQuantity: parseInt(row.stock_quantity) || 0,
        lowStockThreshold: parseInt(row.low_stock_threshold) || 10,
        createdBy: req.user.userId
      });
    }

    if (productsToInsert.length === 0) {
      return res.status(400).json({ error: 'No valid products to import', errors: errors.length, errorDetails: errors });
    }

    const existingProducts = await Product.find({
      ...req.tenantQuery,
      sku: { $in: productsToInsert.map(p => p.sku) }
    }).select('sku');
    const existingSkus = new Set(existingProducts.map(p => p.sku));

    const finalProducts = productsToInsert.filter((product, index) => {
      if (existingSkus.has(product.sku)) {
        errors.push({ line: index + 2, error: `SKU already exists: ${product.sku}`, data: product });
        return false;
      }
      return true;
    });

    if (finalProducts.length > 0) {
      await Product.insertMany(finalProducts);
      await AuditLog.create({
        tenant: req.tenantId,
        user: req.user.userId,
        action: 'product.bulk_upload',
        resource: 'Product',
        details: { total: results.length, imported: finalProducts.length, errors: errors.length }
      });
    }

    res.json({ message: 'Bulk upload completed', imported: finalProducts.length, errors: errors.length, errorDetails: errors });
  } catch (error) {
    console.error('Error in bulk upload:', error);
    res.status(500).json({ error: 'Server error during bulk upload' });
  } finally {
    if (filePath) {
      try { await unlinkFile(filePath); } catch (e) { /* ignore */ }
    }
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, ...req.tenantQuery }).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/products — admin/manager only
router.post('/', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const product = new Product({ ...req.body, tenant: req.tenantId, createdBy: req.user.userId });
    await product.save();
    await AuditLog.create({
      tenant: req.tenantId, user: req.user.userId, action: 'product.create',
      resource: 'Product', resourceId: product._id, details: { name: product.name, sku: product.sku }
    });
    res.status(201).json({ product });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ error: 'Product SKU already exists' });
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Server error creating product' });
  }
});

// PUT /api/products/:id — admin/manager only
router.put('/:id', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, ...req.tenantQuery });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    Object.assign(product, req.body);
    product.updatedBy = req.user.userId;
    await product.save();
    await AuditLog.create({
      tenant: req.tenantId, user: req.user.userId, action: 'product.update',
      resource: 'Product', resourceId: product._id, details: { name: product.name }
    });
    res.json({ product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Server error updating product' });
  }
});

// DELETE /api/products/:id — soft delete, admin/manager only
router.delete('/:id', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, ...req.tenantQuery });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    product.isActive = false;
    product.updatedBy = req.user.userId;
    await product.save();
    await AuditLog.create({
      tenant: req.tenantId, user: req.user.userId, action: 'product.delete',
      resource: 'Product', resourceId: product._id, details: { name: product.name }
    });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Server error deleting product' });
  }
});

// POST /api/products/:id/update-stock — admin/manager only
router.post('/:id/update-stock', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { quantity, operation = 'subtract' } = req.body;
    if (!quantity || quantity < 0) return res.status(400).json({ error: 'Invalid quantity' });
    const product = await Product.findOne({ _id: req.params.id, ...req.tenantQuery });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    await product.updateStock(quantity, operation);
    await AuditLog.create({
      tenant: req.tenantId, user: req.user.userId, action: 'product.stock_update',
      resource: 'Product', resourceId: product._id,
      details: { name: product.name, operation, quantity, newStock: product.stockQuantity }
    });
    res.json({ product });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: 'Server error updating stock' });
  }
});

export default router;
