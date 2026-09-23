import React, { useState, useEffect } from 'react';
import { Plus, Search, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { messagesAPI } from '../services/enterpriseApi';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';
import NewConversationModal from '../components/NewConversationModal';
import toast from 'react-hot-toast';
import dm from '../utils/darkModeClasses';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);

  // Load conversations
  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await messagesAPI.getConversations();
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  // Load messages for selected conversation
  const loadMessages = async (conversationId) => {
    try {
      setLoadingMessages(true);
      const response = await messagesAPI.getConversation(conversationId);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  // Send message
  const handleSendMessage = async (content) => {
    if (!selectedConversation) return;

    try {
      const response = await messagesAPI.send({
        conversationId: selectedConversation._id,
        content
      });

      // Add new message to list
      setMessages(prev => [...prev, response.data.message]);

      // Update last message in conversation list
      setConversations(prev => 
        prev.map(conv => 
          conv._id === selectedConversation._id
            ? { ...conv, lastMessage: response.data.message }
            : conv
        )
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      throw error;
    }
  };

  // Select conversation
  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation._id);
  };

  // Create new conversation
  const handleCreateConversation = async (data) => {
    try {
      let conversation;
      
      if (data.type === 'direct') {
        const response = await messagesAPI.createDirect(data.userId);
        conversation = response.data.conversation;
      } else if (data.type === 'team') {
        // Send a welcome message to create the team conversation
        const response = await messagesAPI.sendToTeam(data.teamId, {
          content: 'Conversation started'
        });
        conversation = response.data.conversation;
      } else if (data.type === 'department') {
        toast.info('Department chat feature coming soon');
        return;
      }

      if (conversation) {
        // Check if conversation already exists in list
        const existingIndex = conversations.findIndex(c => c._id === conversation._id);
        if (existingIndex >= 0) {
          // Update existing conversation
          setConversations(prev => [
            conversation,
            ...prev.filter((_, i) => i !== existingIndex)
          ]);
        } else {
          // Add new conversation
          setConversations(prev => [conversation, ...prev]);
        }
        
        setSelectedConversation(conversation);
        loadMessages(conversation._id);
        toast.success('Conversation started!');
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  };

  // Initial load
  useEffect(() => {
    loadConversations();
  }, []);

  // Poll for new messages every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedConversation) {
        loadMessages(selectedConversation._id);
      }
      loadConversations();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [selectedConversation]);

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const name = conv.name || 
                 conv.team?.name || 
                 conv.department?.name || 
                 conv.participants?.find(p => p._id !== user.userId)?.name || 
                 '';
    
    return name.toLowerCase().includes(searchLower);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Left Sidebar - Conversations List */}
      <div className={`w-80 flex flex-col rounded-xl border ${dm.border} ${dm.card} overflow-hidden`}>
        {/* Search Header */}
        <div className={`p-4 border-b ${dm.border}`}>
          <div className="flex items-center gap-2 mb-3">
            <h1 className={`text-xl font-bold flex-1 ${dm.textPrimary}`}>Messages</h1>
            <button
              onClick={() => setShowNewConversationModal(true)}
              className="p-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition-colors"
              title="New conversation"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${dm.textMuted}`} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${dm.border} ${dm.inputBg} ${dm.textPrimary} placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500`}
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-hidden">
          <ConversationList
            conversations={filteredConversations}
            selectedConversation={selectedConversation}
            onSelectConversation={handleSelectConversation}
            currentUserId={user.userId}
          />
        </div>
      </div>

      {/* Right Panel - Chat Window */}
      <div className={`flex-1 rounded-xl border ${dm.border} ${dm.card} overflow-hidden`}>
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <ChatWindow
            conversation={selectedConversation}
            messages={messages}
            onSendMessage={handleSendMessage}
            onClose={() => setSelectedConversation(null)}
          />
        )}
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onConversationCreated={handleCreateConversation}
      />
    </div>
  );
};

export default Messages;
