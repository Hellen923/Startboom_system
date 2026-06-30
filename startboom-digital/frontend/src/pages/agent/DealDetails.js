// components/DealDetails.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const DealDetails = ({ deal, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'activities', name: 'Activities' },
    { id: 'notes', name: 'Notes' },
    { id: 'tasks', name: 'Tasks' },
    { id: 'attachments', name: 'Attachments' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{deal.title}</h2>
              <p className="text-gray-600 mt-1">{deal.client?.companyName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="flex gap-4 mt-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === tab.id 
                    ? 'bg-orange-100 text-orange-500' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && <OverviewTab deal={deal} onUpdate={onUpdate} />}
          {activeTab === 'activities' && <ActivitiesTab deal={deal} />}
          {activeTab === 'notes' && <NotesTab deal={deal} />}
          {activeTab === 'tasks' && <TasksTab deal={deal} />}
          {activeTab === 'attachments' && <AttachmentsTab deal={deal} />}
        </div>
      </motion.div>
    </div>
  );
};

const OverviewTab = ({ deal, onUpdate }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Deal Value</label>
          <p className="text-lg font-semibold text-orange-500">${deal.value?.toLocaleString()}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Stage</label>
          <p className="text-sm text-gray-900 capitalize">{deal.stage}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Probability</label>
          <div className="flex items-center gap-2">
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${deal.probability}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-600">{deal.probability}%</span>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Expected Close Date</label>
          <p className="text-sm text-gray-900">
            {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : 'Not set'}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Last Activity</label>
          <p className="text-sm text-gray-900">
            {new Date(deal.lastActivityDate).toLocaleDateString()}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Assigned Agent</label>
          <p className="text-sm text-gray-900">{deal.agent?.name}</p>
        </div>
      </div>
    </div>
  );
};

// Implement other tabs similarly...
// Add this to your DealDetails component
const DocumentsTab = ({ deal }) => {
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleDocumentUpload = async (file) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('uploadedBy', 'current-user-id'); // Replace with actual user ID

      const response = await fetch(`/api/deals/${deal._id}/documents`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        // Refresh deal data or update local state
        console.log('Document uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setUploading(false);
      setShowUploadModal(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Documents</h3>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
        >
          <Upload size={16} />
          Upload Document
        </button>
      </div>

      {/* Document list implementation */}
      <div className="space-y-3">
        {deal.documents && deal.documents.map((doc) => (
          <div key={doc._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="text-gray-400" size={20} />
              <div>
                <div className="font-medium">{doc.originalName}</div>
                <div className="text-sm text-gray-500">
                  Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={`/api/deals/${deal._id}/documents/${doc.filename}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600"
              >
                View
              </a>
              <a
                href={`/api/deals/${deal._id}/documents/${doc.filename}`}
                download
                className="text-green-500 hover:text-green-600"
              >
                Download
              </a>
            </div>
          </div>
        ))}
      </div>

      {showUploadModal && (
        <UploadDocumentModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleDocumentUpload}
          uploading={uploading}
        />
      )}
    </div>
  );
};
export default DealDetails;