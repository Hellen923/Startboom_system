import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { salesAPI, clientsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  Plus,
  ShoppingCart,
  DollarSign,
  X,
  Edit,
} from 'lucide-react';

const SalesManagement = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [clients, setClients] = useState([]);
  const [leads, setLeads] = useState([]);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [selectedSaleForPayment, setSelectedSaleForPayment] = useState(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [leadSearchTerm, setLeadSearchTerm] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showLeadDropdown, setShowLeadDropdown] = useState(false);
  const [filteredClients, setFilteredClients] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedSaleForDetails, setSelectedSaleForDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Sale form state - simplified (removed items, paymentMethod, credit fields)
  const [saleForm, setSaleForm] = useState({
    clientId: '',
    leadId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    saleDate: new Date().toISOString().split('T')[0],
    saleAmount: '',
    notes: '',
  });

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const formatCurrency = (amount) => {
    return `UGX ${Number(amount || 0).toLocaleString('en-UG', { maximumFractionDigits: 0 })}`;
  };

  const loadSales = async () => {
    try {
      const response = await salesAPI.getAll({ limit: 200 });
      setSales(response.data.sales || []);
    } catch (error) {
      console.error('Error loading sales:', error);
      toast.error('Failed to load sales');
    }
  };

  const loadClientsAndLeads = async () => {
    try {
      setLoadingClients(true);
      const [clientsRes, leadsRes] = await Promise.all([
        clientsAPI.getAll({ limit: 200 }),
        clientsAPI.getAll({ status: 'prospect', limit: 500 })
      ]);
      
      const fetchedClients = clientsRes.data?.clients || clientsRes.data || [];
      const fetchedLeads = leadsRes.data?.clients || leadsRes.data || [];
      
      setClients(fetchedClients);
      setFilteredClients(fetchedClients);
      setLeads(fetchedLeads);
      setFilteredLeads(fetchedLeads);
    } catch (error) {
      console.error('Error loading clients/leads:', error);
      toast.error('Failed to load clients/leads');
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  useEffect(() => {
    if (location?.state?.openCreate) {
      setShowSaleModal(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (showSaleModal) {
      loadClientsAndLeads();
    }
  }, [showSaleModal]);

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

  useEffect(() => {
    if (leadSearchTerm.trim() === '') {
      setFilteredLeads(leads);
    } else {
      const filtered = leads.filter(lead =>
        (lead.contactName || lead.name)?.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
        (lead.companyName || lead.company)?.toLowerCase().includes(leadSearchTerm.toLowerCase())
      );
      setFilteredLeads(filtered);
    }
  }, [leadSearchTerm, leads]);

  const handleSelectClient = (client) => {
    setSaleForm({
      ...saleForm,
      clientId: client._id,
      leadId: '',
      customerName: client.name,
      customerEmail: client.email || '',
      customerPhone: client.phone || ''
    });
    setClientSearchTerm('');
    setShowClientDropdown(false);
  };

  const handleSelectLead = (lead) => {
    setSaleForm({
      ...saleForm,
      leadId: lead._id,
      clientId: lead._id,
      customerName: lead.contactName || lead.name,
      customerEmail: lead.companyEmail || lead.email || '',
      customerPhone: lead.telephone || lead.phone || ''
    });
    setLeadSearchTerm(lead.contactName || lead.name || '');
    setShowLeadDropdown(false);
  };

  const handleSaveSale = async (e) => {
    e.preventDefault();

    if (!saleForm.customerName || !saleForm.saleAmount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const saleData = {
        customerName: saleForm.customerName,
        customerEmail: saleForm.customerEmail,
        customerPhone: saleForm.customerPhone,
        finalAmount: Number(saleForm.saleAmount),
        notes: saleForm.notes,
        client: saleForm.clientId || saleForm.leadId || null,
        saleDate: new Date(saleForm.saleDate).toISOString()
      };

      if (editingSale) {
        await salesAPI.update(editingSale._id, saleData);
        toast.success('Sale updated successfully');
      } else {
        await salesAPI.create(saleData);
        toast.success('Sale created successfully');
      }

      if (saleForm.leadId) {
        await clientsAPI.update(saleForm.leadId, {
          status: 'active',
          leadStatus: 'Converted'
        });
        toast.success('Lead moved to contacts');
      }

      resetForm();
      setShowSaleModal(false);
      loadSales();
    } catch (error) {
      console.error('Error saving sale:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to save sale';
      toast.error(errorMessage);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();

    if (!paymentForm.amount) {
      toast.error('Please enter payment amount');
      return;
    }

    try {
      await salesAPI.recordPayment(selectedSaleForPayment._id, {
        amount: Number(paymentForm.amount),
        paymentDate: new Date(paymentForm.paymentDate).toISOString(),
        notes: paymentForm.notes
      });
      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      setPaymentForm({
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: ''
      });
      loadSales();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  };

  const handleEditSale = (sale) => {
    setEditingSale(sale);
    setSaleForm({
      clientId: sale.client?._id || sale.client || '',
      leadId: '',
      customerName: sale.customerName,
      customerEmail: sale.customerEmail,
      customerPhone: sale.customerPhone,
      saleDate: sale.saleDate ? sale.saleDate.split('T')[0] : new Date().toISOString().split('T')[0],
      saleAmount: sale.finalAmount || '',
      notes: sale.notes || ''
    });
    setShowSaleModal(true);
  };

  const resetForm = () => {
    setSaleForm({
      clientId: '',
      leadId: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      saleDate: new Date().toISOString().split('T')[0],
      saleAmount: '',
      notes: ''
    });
    setEditingSale(null);
    setClientSearchTerm('');
    setLeadSearchTerm('');
  };

  const calculateTotalPaid = (sale) => {
    return sale.payments?.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0) || 0;
  };

  const calculateBalance = (sale) => {
    const totalPaid = calculateTotalPaid(sale);
    return Math.max(0, sale.finalAmount - totalPaid);
  };

  return (
    <div className="space-y-6">
      {/* Quick Add Button */}
      <div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            resetForm();
            setShowSaleModal(true);
          }}
          className="flex items-center space-x-2 bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span>New Sale</span>
        </motion.button>
      </div>

      {/* Sales Table */}
      {sales.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No sales yet</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first sale</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Sale Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Paid</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Balance</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => { setSelectedSaleForDetails(sale); setShowDetailsModal(true); }}>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{sale.customerName}</p>
                        <p className="text-sm text-gray-600">{sale.customerEmail || '-'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(sale.saleDate).toLocaleDateString('en-UG')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(sale.finalAmount)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600">
                      {formatCurrency(calculateTotalPaid(sale))}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-orange-600">
                      {formatCurrency(calculateBalance(sale))}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {calculateBalance(sale) > 0 && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            onClick={(e) => { e.stopPropagation(); setSelectedSaleForPayment(sale); setShowPaymentModal(true); }}
                            className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                          >
                            Record Payment
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          onClick={(e) => { e.stopPropagation(); handleEditSale(sale); }}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Edit className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Sale Modal */}
      {showSaleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[min(90vh,900px)] flex flex-col overflow-hidden"
          >
            <div className="flex-shrink-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {editingSale ? 'Edit Sale' : 'Create New Sale'}
              </h2>
              <button onClick={() => { setShowSaleModal(false); resetForm(); }} className="hover:bg-orange-700 p-2 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSale} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Customer *</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search customer by name, email, phone..."
                    value={clientSearchTerm || saleForm.customerName}
                    onChange={(e) => {
                      setClientSearchTerm(e.target.value);
                      setShowClientDropdown(true);
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  {showClientDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {loadingClients ? (
                        <div className="px-4 py-3 text-sm text-gray-500">Loading clients...</div>
                      ) : filteredClients.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          {clientSearchTerm.trim() === '' ? 'No clients found. Please add clients first.' : 'No matching clients found'}
                        </div>
                      ) : (
                        filteredClients.map((client) => (
                          <div
                            key={client._id}
                            onClick={() => handleSelectClient(client)}
                            className="px-4 py-3 hover:bg-orange-50 cursor-pointer border-b last:border-b-0"
                          >
                            <p className="font-medium text-gray-900">{client.name}</p>
                            <p className="text-sm text-gray-600">{client.email}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Lead Selection - Alternative for quick sale */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Or Convert a Lead</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search leads to convert..."
                    value={leadSearchTerm}
                    onChange={(e) => {
                      setLeadSearchTerm(e.target.value);
                      setShowLeadDropdown(true);
                    }}
                    onFocus={() => setShowLeadDropdown(true)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  {showLeadDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {loadingClients ? (
                        <div className="px-4 py-3 text-sm text-gray-500">Loading leads...</div>
                      ) : filteredLeads.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500">No leads found</div>
                      ) : (
                        filteredLeads.map((lead) => (
                          <div
                            key={lead._id}
                            onClick={() => handleSelectLead(lead)}
                            className="px-4 py-3 hover:bg-orange-50 cursor-pointer border-b last:border-b-0"
                          >
                            <p className="font-medium text-gray-900">{lead.contactName || lead.name}</p>
                            <p className="text-sm text-gray-600">{lead.companyName || lead.company}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={saleForm.customerEmail}
                    onChange={(e) => setSaleForm({ ...saleForm, customerEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={saleForm.customerPhone}
                    onChange={(e) => setSaleForm({ ...saleForm, customerPhone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Sale Date *</label>
                  <input
                    type="date"
                    value={saleForm.saleDate}
                    onChange={(e) => setSaleForm({ ...saleForm, saleDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (UGX) *</label>
                  <input
                    type="number"
                    value={saleForm.saleAmount}
                    onChange={(e) => setSaleForm({ ...saleForm, saleAmount: e.target.value })}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <textarea
                  value={saleForm.notes}
                  onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
                  placeholder="Add notes about this sale..."
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              </div>

              <div className="flex-shrink-0 flex gap-4 p-6 border-t bg-gray-50">
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  {editingSale ? 'Update Sale' : 'Create Sale'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowSaleModal(false); resetForm(); }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 py-3 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Sale Details Modal */}
      {showDetailsModal && selectedSaleForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Sale Details</h2>
              <button onClick={() => setShowDetailsModal(false)} className="hover:bg-orange-700 p-2 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium text-gray-900">{selectedSaleForDetails.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{selectedSaleForDetails.customerEmail || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{selectedSaleForDetails.customerPhone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Sale Date</p>
                    <p className="font-medium text-gray-900">{new Date(selectedSaleForDetails.saleDate).toLocaleDateString('en-UG')}</p>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-semibold text-gray-900">Total:</span>
                  <span className="font-bold text-lg text-orange-600">{formatCurrency(selectedSaleForDetails.finalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Paid:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(calculateTotalPaid(selectedSaleForDetails))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Balance:</span>
                  <span className="font-semibold text-orange-600">{formatCurrency(calculateBalance(selectedSaleForDetails))}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedSaleForDetails.notes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                  <p className="text-sm text-gray-600">{selectedSaleForDetails.notes}</p>
                </div>
              )}

              {/* Payment History */}
              {selectedSaleForDetails.payments && selectedSaleForDetails.payments.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Payment History</h3>
                  <div className="space-y-2">
                    {selectedSaleForDetails.payments.map((payment, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-lg">
                        <div className="flex justify-between">
                          <span className="font-medium">{formatCurrency(payment.amount)}</span>
                          <span className="text-gray-600">{new Date(payment.paymentDate).toLocaleDateString('en-UG')}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{payment.notes || 'No notes'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 py-3 rounded-lg font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Payment Recording Modal */}
      {showPaymentModal && selectedSaleForPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full"
          >
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Record Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="hover:bg-orange-700 p-2 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-sm text-gray-600">Customer: <span className="font-semibold text-gray-900">{selectedSaleForPayment.customerName}</span></p>
                <p className="text-sm text-gray-600">Total: <span className="font-semibold text-gray-900">{formatCurrency(selectedSaleForPayment.finalAmount)}</span></p>
                <p className="text-sm text-gray-600">Already Paid: <span className="font-semibold text-green-600">{formatCurrency(calculateTotalPaid(selectedSaleForPayment))}</span></p>
                <p className="text-sm text-gray-600">Balance: <span className="font-semibold text-orange-600">{formatCurrency(calculateBalance(selectedSaleForPayment))}</span></p>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Amount *</label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    placeholder="Add notes about this payment..."
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t">
                  <button
                    type="submit"
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-semibold transition-colors"
                  >
                    Record Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SalesManagement;
