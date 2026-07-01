import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { salesAPI, clientsAPI, productsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  Plus, ShoppingCart, Search, X, CheckCircle, CreditCard, ListTodo,
  Calendar, Clock, AlertCircle, Package, Download, Trash2, AlertTriangle
} from 'lucide-react';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'credit', label: 'Credit Card', icon: '💳' },
  { value: 'mtn_momo', label: 'MTN Mobile Money', icon: '📱' },
  { value: 'airtel_momo', label: 'Airtel Money', icon: '📱' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { value: 'cheque', label: 'Cheque', icon: '📝' }
];

const Sales = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [filteredClients, setFilteredClients] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);

  const [saleForm, setSaleForm] = useState({
    clientId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    paymentMethod: 'cash',
    notes: '',
    items: [{ product: null, productId: '', itemName: '', sku: '', quantity: 1, unitPrice: 0, discount: 0, stockAvailable: 0 }]
  });

  const formatCurrency = (amount) => {
    return `UGX ${Number(amount || 0).toLocaleString('en-UG', { maximumFractionDigits: 0 })}`;
  };

  const loadSales = async () => {
    try {
      setLoading(true);
      const response = await salesAPI.getAll({ limit: 100 });
      setSales(response.data.sales || []);
    } catch (error) {
      console.error('Error loading sales:', error);
      toast.error('Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  const loadClientsAndProducts = async () => {
    try {
      setLoadingProducts(true);
      const [clientsRes, productsRes] = await Promise.all([
        clientsAPI.getAll({ limit: 500 }),
        productsAPI.getAll({ limit: 1000, isActive: true })
      ]);
      
      const fetchedClients = clientsRes.data?.clients || clientsRes.data || [];
      setClients(fetchedClients.filter(c => c.status !== 'prospect'));
      setFilteredClients(fetchedClients.filter(c => c.status !== 'prospect'));
      
      const fetchedProducts = productsRes.data?.products || productsRes.data || [];
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load clients/products');
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  useEffect(() => {
    if (showModal) {
      loadClientsAndProducts();
    }
  }, [showModal]);

  useEffect(() => {
    if (clientSearchTerm.trim() === '') {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(client =>
        client.name?.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
        client.phone?.includes(clientSearchTerm) ||
        client.company?.toLowerCase().includes(clientSearchTerm.toLowerCase())
      );
      setFilteredClients(filtered);
    }
  }, [clientSearchTerm, clients]);

  const handleClientSelect = (client) => {
    setSaleForm({
      ...saleForm,
      clientId: client._id,
      customerName: client.name,
      customerEmail: client.email || '',
      customerPhone: client.phone || ''
    });
    setClientSearchTerm(client.name);
    setShowClientDropdown(false);
  };

  const handleProductSelect = (index, product) => {
    const updatedItems = [...saleForm.items];
    updatedItems[index] = {
      ...updatedItems[index],
      product: product,
      productId: product._id,
      itemName: product.name,
      sku: product.sku,
      unitPrice: product.price,
      stockAvailable: product.stockQuantity,
      quantity: 1,
      discount: 0
    };
    setSaleForm({ ...saleForm, items: updatedItems });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...saleForm.items];
    if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
      const numValue = Number(value) || 0;
      updatedItems[index][field] = numValue;
    } else {
      updatedItems[index][field] = value;
    }
    setSaleForm({ ...saleForm, items: updatedItems });
  };

  const addItem = () => {
    setSaleForm({
      ...saleForm,
      items: [...saleForm.items, { product: null, productId: '', itemName: '', sku: '', quantity: 1, unitPrice: 0, discount: 0, stockAvailable: 0 }]
    });
  };

  const removeItem = (index) => {
    if (saleForm.items.length > 1) {
      const updatedItems = saleForm.items.filter((_, i) => i !== index);
      setSaleForm({ ...saleForm, items: updatedItems });
    }
  };

  const calculateItemTotal = (item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const itemTotal = qty * price;
    const discount = itemTotal * ((Number(item.discount) || 0) / 100);
    return itemTotal - discount;
  };

  const calculateGrandTotal = () => {
    return saleForm.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!saleForm.clientId || !saleForm.customerName.trim()) {
      toast.error('Please select a client');
      return;
    }

    const validItems = saleForm.items.filter(item => item.productId && item.itemName.trim() !== '');
    if (validItems.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    // Validate stock
    for (const item of validItems) {
      if (item.quantity > item.stockAvailable) {
        toast.error(`${item.itemName}: Only ${item.stockAvailable} units available in stock`);
        return;
      }
      if (item.quantity < 1) {
        toast.error(`${item.itemName}: Quantity must be at least 1`);
        return;
      }
    }

    try {
      const saleData = {
        customerName: saleForm.customerName,
        customerEmail: saleForm.customerEmail || undefined,
        customerPhone: saleForm.customerPhone || undefined,
        client: saleForm.clientId,
        items: validItems.map(item => ({
          product: item.productId,
          itemName: item.itemName.trim(),
          sku: item.sku,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discount: Number(item.discount) || 0
        })),
        paymentMethod: saleForm.paymentMethod,
        notes: saleForm.notes.trim() || undefined
      };

      const response = await salesAPI.create(saleData);
      toast.success('Sale created successfully! Stock updated.');

      setSaleForm({
        clientId: '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        paymentMethod: 'cash',
        notes: '',
        items: [{ product: null, productId: '', itemName: '', sku: '', quantity: 1, unitPrice: 0, discount: 0, stockAvailable: 0 }]
      });
      setClientSearchTerm('');
      setShowClientDropdown(false);
      setShowModal(false);
      loadSales();
    } catch (error) {
      console.error('Error creating sale:', error);
      toast.error(error.response?.data?.message || 'Failed to create sale');
    }
  };

  const generateReceipt = (sale) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text('SALES RECEIPT', pageWidth / 2, 20, { align: 'center' });
    
    // Company info (if available)
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Startboom Digital CRM', pageWidth / 2, 28, { align: 'center' });
    
    // Receipt details
    doc.setFontSize(11);
    doc.setTextColor(60);
    doc.text(`Receipt #: ${sale._id}`, 14, 45);
    doc.text(`Date: ${new Date(sale.saleDate || sale.createdAt).toLocaleDateString('en-UG')}`, 14, 52);
    doc.text(`Agent: ${user?.name || 'N/A'}`, 14, 59);
    
    // Customer details
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text('BILL TO:', 14, 72);
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(sale.customerName, 14, 79);
    if (sale.customerEmail) doc.text(sale.customerEmail, 14, 86);
    if (sale.customerPhone) doc.text(sale.customerPhone, 14, 93);
    
    // Items table
    const tableData = sale.items?.map(item => [
      item.itemName,
      item.sku || 'N/A',
      item.quantity,
      formatCurrency(item.unitPrice),
      `${item.discount || 0}%`,
      formatCurrency(item.totalPrice || (item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100)))
    ]) || [];
    
    doc.autoTable({
      startY: 105,
      head: [['Item', 'SKU', 'Qty', 'Price', 'Disc', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [255, 215, 0], textColor: [40, 40, 40] },
      styles: { fontSize: 9 }
    });
    
    // Totals
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text(`Subtotal: ${formatCurrency(sale.totalAmount || 0)}`, pageWidth - 14, finalY, { align: 'right' });
    doc.text(`Discount: ${formatCurrency(sale.discountAmount || 0)}`, pageWidth - 14, finalY + 7, { align: 'right' });
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text(`TOTAL: ${formatCurrency(sale.finalAmount || 0)}`, pageWidth - 14, finalY + 16, { align: 'right' });
    
    // Payment method
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Payment: ${PAYMENT_METHODS.find(p => p.value === sale.paymentMethod)?.label || sale.paymentMethod}`, 14, finalY + 16);
    
    // Footer
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text('Thank you for your business!', pageWidth / 2, finalY + 35, { align: 'center' });
    doc.text('This is a computer-generated receipt', pageWidth / 2, finalY + 41, { align: 'center' });
    
    // Save
    doc.save(`Receipt-${sale._id}.pdf`);
    toast.success('Receipt downloaded!');
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSaleForm({
      clientId: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      paymentMethod: 'cash',
      notes: '',
      items: [{ product: null, productId: '', itemName: '', sku: '', quantity: 1, unitPrice: 0, discount: 0, stockAvailable: 0 }]
    });
    setClientSearchTerm('');
    setShowClientDropdown(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
          <p className="text-gray-600 mt-1">Record and manage sales transactions</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"
        >
          <Plus size={20} />
          New Sale
        </button>
      </div>

      {/* Sales List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Sales</h2>
        </div>
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Loading sales...</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No sales yet</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first sale</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{sale.customerName}</div>
                      {sale.customerEmail && <div className="text-sm text-gray-500">{sale.customerEmail}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{sale.items?.length || 0} item(s)</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(sale.finalAmount || 0)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {PAYMENT_METHODS.find(p => p.value === sale.paymentMethod)?.icon} {PAYMENT_METHODS.find(p => p.value === sale.paymentMethod)?.label || sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(sale.saleDate || sale.createdAt).toLocaleDateString('en-UG', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => generateReceipt(sale)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Download size={16} />
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Sale Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
                <h2 className="text-2xl font-bold text-gray-900">Create New Sale</h2>
                <button onClick={handleModalClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Client Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Select Client *</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={clientSearchTerm}
                      onChange={(e) => {
                        setClientSearchTerm(e.target.value);
                        setShowClientDropdown(true);
                      }}
                      onFocus={() => setShowClientDropdown(true)}
                      placeholder="Search clients..."
                      className={`w-full pl-10 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                        saleForm.clientId ? 'border-green-300 bg-green-50' : 'border-gray-300'
                      }`}
                      required
                    />
                    {saleForm.clientId && <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-600" />}

                    {showClientDropdown && (
                      <>
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                          {loadingProducts ? (
                            <div className="px-4 py-3 text-sm text-gray-500">Loading clients...</div>
                          ) : filteredClients.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500">No clients found</div>
                          ) : (
                            filteredClients.map((client) => (
                              <div
                                key={client._id}
                                onClick={() => handleClientSelect(client)}
                                className="px-4 py-3 hover:bg-primary-50 cursor-pointer border-b last:border-b-0"
                              >
                                <div className="font-medium text-gray-900">{client.name}</div>
                                <div className="text-sm text-gray-600">{client.email} • {client.phone}</div>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="fixed inset-0 z-40" onClick={() => setShowClientDropdown(false)} />
                      </>
                    )}
                  </div>
                </div>

                {/* Product Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">Products *</label>
                    <button type="button" onClick={addItem} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                      + Add Item
                    </button>
                  </div>

                  {saleForm.items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          {/* Product Picker */}
                          <select
                            value={item.productId}
                            onChange={(e) => {
                              const product = products.find(p => p._id === e.target.value);
                              if (product) handleProductSelect(index, product);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            required
                          >
                            <option value="">-- Select Product --</option>
                            {products.map(product => (
                              <option key={product._id} value={product._id}>
                                {product.name} ({product.sku}) - {formatCurrency(product.price)} - Stock: {product.stockQuantity}
                              </option>
                            ))}
                          </select>

                          {/* Stock Warning */}
                          {item.stockAvailable > 0 && item.stockAvailable <= 10 && (
                            <div className="flex items-center gap-2 text-sm text-orange-600">
                              <AlertTriangle size={16} />
                              Low stock: Only {item.stockAvailable} units available
                            </div>
                          )}

                          {/* Quantity, Price, Discount */}
                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <label className="text-xs text-gray-600">Quantity</label>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                min="1"
                                max={item.stockAvailable}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Unit Price</label>
                              <input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Discount %</label>
                              <input
                                type="number"
                                value={item.discount}
                                onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                                min="0"
                                max="100"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Total</label>
                              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-semibold text-gray-900">
                                {formatCurrency(calculateItemTotal(item))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {saleForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="ml-3 text-red-600 hover:text-red-700 p-2"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Payment Method *</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {PAYMENT_METHODS.map(method => (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setSaleForm({ ...saleForm, paymentMethod: method.value })}
                        className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                          saleForm.paymentMethod === method.value
                            ? 'border-primary-600 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-lg mr-2">{method.icon}</span>
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    value={saleForm.notes}
                    onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Additional notes..."
                  />
                </div>

                {/* Grand Total */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between text-xl font-bold">
                    <span>Grand Total:</span>
                    <span className="text-primary-600">{formatCurrency(calculateGrandTotal())}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                  >
                    Create Sale
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Sales;
