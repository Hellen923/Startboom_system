import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, MoreVertical, X, Check, CheckCheck } from 'lucide-react';
import dm from '../utils/darkModeClasses';
import { useAuth } from '../context/AuthContext';

const ChatWindow = ({ conversation, messages, onSendMessage, onClose }) => {
  const { user } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!messageText.trim() || sending) return;

    setSending(true);
    try {
      await onSendMessage(messageText);
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateSeparator = (date) => {
    if (!date) return '';
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const groupMessagesByDate = () => {
    const grouped = [];
    let currentDate = null;

    messages?.forEach((message) => {
      const messageDate = new Date(message.createdAt).toDateString();
      
      if (messageDate !== currentDate) {
        grouped.push({ type: 'date', date: message.createdAt });
        currentDate = messageDate;
      }
      
      grouped.push({ type: 'message', data: message });
    });

    return grouped;
  };

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <Send className={`w-12 h-12 ${dm.textMuted}`} />
        </div>
        <h3 className={`text-xl font-semibold mb-2 ${dm.textPrimary}`}>Select a conversation</h3>
        <p className={`text-sm ${dm.textMuted}`}>Choose a conversation from the list to start messaging</p>
      </div>
    );
  }

  const getConversationName = () => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants?.find(p => p._id !== user.userId);
      return otherParticipant?.name || 'Unknown User';
    }
    return conversation.name || conversation.team?.name || conversation.department?.name || 'Conversation';
  };

  const groupedMessages = groupMessagesByDate();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`px-4 py-3 border-b ${dm.border} flex items-center justify-between bg-white dark:bg-gray-900`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold">
            {getConversationName().charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className={`font-semibold ${dm.textPrimary}`}>{getConversationName()}</h3>
            <p className={`text-xs ${dm.textMuted}`}>
              {conversation.participants?.length || 0} {conversation.type === 'direct' ? 'participant' : 'members'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${dm.textMuted}`}
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900/50">
        {groupedMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className={`text-sm ${dm.textMuted}`}>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedMessages.map((item, index) => {
              if (item.type === 'date') {
                return (
                  <div key={`date-${index}`} className="flex items-center justify-center my-4">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1">
                      <span className={`text-xs font-medium ${dm.textMuted}`}>
                        {formatDateSeparator(item.date)}
                      </span>
                    </div>
                  </div>
                );
              }

              const message = item.data;
              const isOwn = message.sender?._id === user.userId || message.sender === user.userId;
              const isRead = message.readBy?.some(r => r.user !== user.userId);

              return (
                <div
                  key={message._id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                    {!isOwn && conversation.type !== 'direct' && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 ml-2">
                        {message.sender?.name || 'Unknown'}
                      </p>
                    )}
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        isOwn
                          ? 'bg-primary-500 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                        <span className="text-xs">{formatTime(message.createdAt)}</span>
                        {isOwn && (
                          <span>
                            {isRead ? (
                              <CheckCheck className="w-3 h-3 text-blue-300" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className={`px-4 py-3 border-t ${dm.border} bg-white dark:bg-gray-900`}>
        <div className="flex items-end gap-2">
          <button
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${dm.textMuted}`}
            title="Attach file (coming soon)"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <div className="flex-1 relative">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className={`w-full px-4 py-2 rounded-lg border ${dm.border} ${dm.inputBg} ${dm.textPrimary} placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none max-h-32`}
              style={{ minHeight: '40px' }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!messageText.trim() || sending}
            className={`p-2 rounded-lg transition-colors ${
              messageText.trim() && !sending
                ? 'bg-primary-500 hover:bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
