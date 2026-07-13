import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Plus, Upload, Search, Edit2, Trash2, X,
  CheckCircle, AlertCircle, Download, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Pagination from '../../components/Pagination';
import { BUTTON_STYLES } from '../../utils/designSystem';

// ── Stock badge helper ───────────────────────────────────────────────────────
const StockBadge = ({ qty, threshold }) => {
  if (qty <= 0) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Out of Stock</span>;
  if (qty <= threshold) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Low Stock ({qty})</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">In Stock ({qty})</span>;
};

// ── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({ onAdd, onUpload }) => (
  <div className="p-16 text-center">
    <Package className="w-14 h-14 mx-auto text-gray-300 mb-4" />
    <h3 className="text-lg font-semibold text-gray-800 mb-1">No products yet</h3>
    <p className="text-gray-500 text-sm mb-6">Add products manually or bulk-upload via CSV.</p>
    <div className="flex items-center justify-center gap-3">
      <button onClick={onUpload} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
        <Upload className="w-4 h-4" /> Upload CSV
      </button>
      <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium">
        <Plus className="w-4 h-4" /> Add Product
      </button>
    </div>
  </div>
);

// ── Add / Edit Modal ─────────────────────────────────────────────────────────
const ProductFormModal = ({ product, onClose, onSaved }) => {
  const isEdit = !!product;
  const [form, setForm] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    category: product?.category || '',
    subcategories: product?.subcategories?.join(', ') || '',
    price: product?.price || '',
    currency: product?.currency || 'UGX',
    unit: product?.unit || 'piece',
    stockQuantity: product?.stockQuantity ?? 0,
    lowStockThreshold: product?.lowStockThreshold ?? 10,
    description: product?.description || '',
    isActive: product?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.sku || !form.category || !form.price) {
      toast.error('Name, SKU, Category and Price are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        stockQuantity: parseInt(form.stockQuantity),
        lowStockThreshold: parseInt(form.lowStockThreshold),
        subcategories: form.subcategories ? form.subcategories.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      if (isEdit) {
        await api.put(`/products/${product._id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/products', payload);
        toast.success('Product created');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Product Name *</label>
              <input value={form.name} onChange={set('name')} placeholder="e.g. Dettol 500ml" className={inputCls} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">SKU *</label>
              <input value={form.sku} onChange={set('sku')} placeholder="e.g. SKU-001" className={inputCls} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
              <input value={form.category} onChange={set('category')} placeholder="e.g. Soap" className={inputCls} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Subcategories</label>
              <input value={form.subcategories} onChange={set('subcategories')} placeholder="e.g. Liquid, Bar (comma-separated)" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Price *</label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={set('price')} placeholder="0.00" className={inputCls} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
              <select value={form.currency} onChange={set('currency')} className={inputCls}>
                <option value="UGX">UGX</option>
                <option value="USD">USD</option>
                <option value="KES">KES</option>
                <option value="NGN">NGN</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
              <input value={form.unit} onChange={set('unit')} placeholder="e.g. bottle, kg, piece" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Stock Quantity</label>
              <input type="number" min="0" value={form.stockQuantity} onChange={set('stockQuantity')} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Low Stock Alert Below</label>
              <input type="number" min="0" value={form.lowStockThreshold} onChange={set('lowStockThreshold')} className={inputCls} />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" id="isActive" checked={form.isActive}
                onChange={e => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 text-primary-500 rounded border-gray-300 focus:ring-primary-500" />
              <label htmlFor="isActive" className="text-sm text-gray-700">Active (visible to agents)</label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={set('description')} rows={3}
              placeholder="Brief product description..." className={inputCls} />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className={`${BUTTON_STYLES.secondary}`}>Cancel</button>
            <button type="submit" disabled={saving} className={`${BUTTON_STYLES.primary} disabled:opacity-50`}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ── CSV Upload Modal ──────────────────────────────────────────────────────────
const CSVUploadModal = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const dropRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.endsWith('.csv')) setFile(dropped);
    else toast.error('Only .csv files are accepted');
  };

  const downloadTemplate = () => {
    const csv = `category,subcategory,name,sku,price,currency,unit,stock_quantity,low_stock_threshold,description\r\nSoap,Liquid Soap,Dettol 500ml,SKU-001,4500,UGX,bottle,100,10,Dettol liquid hand wash\r\nSoap,Bar Soap,Lifebuoy 100g,SKU-002,1200,UGX,bar,200,20,Lifebuoy antibacterial bar soap\r\n`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'honeypot-product-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file) { toast.error('Please select a CSV file'); return; }
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await api.post('/products/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(response.data);
      if (response.data.imported > 0) {
        toast.success(`✓ Imported ${response.data.imported} product${response.data.imported !== 1 ? 's' : ''}`);
        setTimeout(() => onSuccess(), 1800);
      } else {
        toast.error('No products were imported — check the errors below');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Bulk Upload via CSV</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Format guide */}
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 text-sm">
            <p className="font-semibold text-primary-800 mb-2">Required CSV columns:</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-primary-700 text-xs font-mono">
              <span>• category <span className="text-red-500">*</span></span>
              <span>• name <span className="text-red-500">*</span></span>
              <span>• sku <span className="text-red-500">*</span></span>
              <span>• price <span className="text-red-500">*</span></span>
              <span>• subcategory</span>
              <span>• currency (default: UGX)</span>
              <span>• unit (default: piece)</span>
              <span>• stock_quantity</span>
              <span>• low_stock_threshold</span>
              <span>• description</span>
            </div>
          </div>

          {/* Drop zone */}
          <div
            ref={dropRef}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}`}
          >
            <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
            <p className="text-sm font-medium text-gray-700 mb-1">Drag & drop your CSV here</p>
            <p className="text-xs text-gray-500 mb-3">or click to browse (max 5 MB)</p>
            <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} className="hidden" id="csv-input" />
            <label htmlFor="csv-input" className={`${BUTTON_STYLES.secondary} cursor-pointer`}>
              Browse File
            </label>
            {file && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-primary-700 font-medium">
                <CheckCircle className="w-4 h-4" /> {file.name}
              </div>
            )}
          </div>

          {/* Result */}
          {result && (
            <div className={`rounded-xl p-4 border ${result.imported > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 font-semibold mb-2 text-sm">
                {result.imported > 0 ? <CheckCircle className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                <span className={result.imported > 0 ? 'text-green-800' : 'text-red-800'}>Upload complete</span>
              </div>
              <div className="text-sm space-y-0.5">
                <p className="text-green-700">✓ Imported: <strong>{result.imported}</strong></p>
                {result.errors > 0 && <p className="text-red-700">✗ Errors: <strong>{result.errors}</strong></p>}
              </div>
              {result.errorDetails?.length > 0 && (
                <div className="mt-3">
                  <button onClick={() => setShowErrors(v => !v)} className="flex items-center gap-1 text-xs text-red-700 font-medium">
                    {showErrors ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {showErrors ? 'Hide' : 'Show'} error details
                  </button>
                  {showErrors && (
                    <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                      {result.errorDetails.map((err, i) => (
                        <div key={i} className="text-xs bg-white border border-red-200 rounded p-2">
                          <span className="font-mono text-red-600">Line {err.line}:</span> {err.error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={downloadTemplate} className={`${BUTTON_STYLES.secondary} flex-1`}>
              <Download className="w-4 h-4" /> Download Template
            </button>
            <button onClick={handleUpload} disabled={!file || uploading}
              className={`${BUTTON_STYLES.primary} flex-1 disabled:opacity-50`}>
              {uploading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload Now</>}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ── Main Products Page ────────────────────────────────────────────────────────
const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [prodPage, setProdPage] = useState(1);
  const [prodPageSize, setProdPageSize] = useState(25);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products');
      setProducts(res.data.products || []);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/products/categories');
      setCategories(res.data.categories || []);
    } catch { /* non-critical */ }
  };

  useEffect(() => { fetchProducts(); fetchCategories(); }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This will hide it from agents.`)) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product removed');
      fetchProducts();
    } catch { toast.error('Failed to delete product'); }
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = !selectedCategory || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const stats = {
    total: products.length,
    active: products.filter(p => p.isActive).length,
    lowStock: products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold).length,
    outOfStock: products.filter(p => p.stockQuantity <= 0).length,
  };

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: stats.total, color: 'text-gray-900' },
          { label: 'Active', value: stats.active, color: 'text-green-600' },
          { label: 'Low Stock', value: stats.lowStock, color: 'text-yellow-600' },
          { label: 'Out of Stock', value: stats.outOfStock, color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by name or SKU..."
            className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.category} value={c.category}>{c.category}</option>)}
        </select>
        <div className="flex gap-2">
          <button onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Upload className="w-4 h-4" /> CSV Upload
          </button>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500 mt-3">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState onAdd={() => setShowAddModal(true)} onUpload={() => setShowUploadModal(true)} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  {['Product', 'SKU', 'Category', 'Price', 'Stock', 'Status', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.slice((prodPage - 1) * prodPageSize, prodPage * prodPageSize).map(p => (
                  <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{p.name}</div>
                      {p.description && <div className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{p.description}</div>}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">{p.sku}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">{p.category}</span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-gray-900">{p.currency} {Number(p.price).toLocaleString()}</td>
                    <td className="px-5 py-3"><StockBadge qty={p.stockQuantity} threshold={p.lowStockThreshold} /></td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditProduct(p)} title="Edit"
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-primary-50 hover:text-primary-600">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p._id, p.name)} title="Delete"
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
              Showing {Math.min(prodPage * prodPageSize, filteredProducts.length)} of {filteredProducts.length} products
            </div>
            <Pagination
              currentPage={prodPage}
              totalPages={Math.ceil(filteredProducts.length / prodPageSize)}
              totalItems={filteredProducts.length}
              pageSize={prodPageSize}
              onPageChange={setProdPage}
              onPageSizeChange={(s) => { setProdPageSize(s); setProdPage(1); }}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(showAddModal || editProduct) && (
          <ProductFormModal
            product={editProduct || null}
            onClose={() => { setShowAddModal(false); setEditProduct(null); }}
            onSaved={() => { setShowAddModal(false); setEditProduct(null); fetchProducts(); fetchCategories(); }}
          />
        )}
        {showUploadModal && (
          <CSVUploadModal
            onClose={() => setShowUploadModal(false)}
            onSuccess={() => { setShowUploadModal(false); fetchProducts(); fetchCategories(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Products;
