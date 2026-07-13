import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Search, X, Tag, Info } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Stock status visible to agents — badge only, no raw count
const StockStatus = ({ qty, threshold }) => {
  if (qty <= 0) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Out of Stock</span>;
  if (qty <= threshold) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Low Stock</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">In Stock</span>;
};

// Product detail slide-over
const ProductDrawer = ({ product, onClose }) => {
  if (!product) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative w-full max-w-sm bg-white h-full shadow-2xl overflow-y-auto"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-gray-900">Product Details</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
              <StockStatus qty={product.stockQuantity} threshold={product.lowStockThreshold} />
            </div>
            <p className="text-xs font-mono text-gray-500 mt-1">SKU: {product.sku}</p>
          </div>

          <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
            <p className="text-xs text-primary-700 font-medium uppercase tracking-wide mb-1">Unit Price</p>
            <p className="text-2xl font-bold text-primary-600">{product.currency} {Number(product.price).toLocaleString()}</p>
            <p className="text-xs text-primary-500 mt-0.5">per {product.unit}</p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Category</span>
              <span className="font-medium text-gray-800">{product.category}</span>
            </div>
            {product.subcategories?.length > 0 && (
              <div className="flex items-start justify-between gap-3">
                <span className="text-gray-500">Subcategories</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {product.subcategories.map(s => (
                    <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{s}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Unit</span>
              <span className="font-medium text-gray-800">{product.unit}</span>
            </div>
          </div>

          {product.description && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Description</p>
              <p className="text-sm text-gray-700 leading-relaxed">{product.description}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">Use these details when quoting clients. Attach this product to a Deal or Sale to auto-calculate the value.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const AgentProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pRes, cRes] = await Promise.all([
          api.get('/products', { params: { isActive: true, limit: 200 } }),
          api.get('/products/categories'),
        ]);
        setProducts(pRes.data.products || []);
        setCategories(cRes.data.categories || []);
      } catch {
        toast.error('Failed to load product catalogue');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCategory || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  // Group by category for a nicer browse experience
  const grouped = filtered.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Search + filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products by name, SKU, or description..."
            className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.category} value={c.category}>{c.category}</option>)}
        </select>
      </div>

      <p className="text-xs text-gray-500 px-1">{filtered.length} product{filtered.length !== 1 ? 's' : ''} available — click any card to see full details and pricing</p>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-3">Loading catalogue...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No products found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search or category filter</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-primary-500" />
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{category}</h3>
                <span className="text-xs text-gray-400">({items.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map(product => (
                  <motion.button
                    key={product._id}
                    whileHover={{ y: -2 }}
                    onClick={() => setSelectedProduct(product)}
                    className="text-left bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary-100 transition-colors">
                        <Package className="w-5 h-5 text-primary-500" />
                      </div>
                      <StockStatus qty={product.stockQuantity} threshold={product.lowStockThreshold} />
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm leading-tight mb-1">{product.name}</h4>
                    {product.description && (
                      <p className="text-xs text-gray-400 mb-2 line-clamp-2">{product.description}</p>
                    )}
                    <p className="text-base font-bold text-primary-600 mt-2">
                      {product.currency} {Number(product.price).toLocaleString()}
                      <span className="text-xs font-normal text-gray-400 ml-1">/ {product.unit}</span>
                    </p>
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedProduct && (
          <ProductDrawer product={selectedProduct} onClose={() => setSelectedProduct(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgentProducts;
