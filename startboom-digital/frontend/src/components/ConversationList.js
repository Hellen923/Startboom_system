import React from 'react';
import { Users, User, MessageSquare, Building, MapPin, Clock } from 'lucide-react';
import dm from '../utils/darkModeClasses';

const ConversationList = ({ conversations, selectedConversation, onSelectConversation, currentUserId }) => {
  
  const getConversationDisplay = (conversation) => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants?.find(p => p._id !== currentUserId);
      return {
        name: otherParticipant?.name || 'Unknown User',
        icon: User,
        subtitle: 'Direct Message'
      };
    } else if (conversation.type === 'team') {
      return {
        name: conversation.team?.name || conversation.name || 'Team Chat',
        icon: Users,
        subtitle: `${conversation.participants?.length || 0} members`
      };
    } else if (conversation.type === 'department') {
      return {
        name: conversation.department?.name || conversation.name || 'Department Chat',
        icon: Building,
        subtitle: `${conversation.participants?.length || 0} members`
      };
    } else if (conversation.type === 'branch') {
      return {
        name: conversation.branch?.name || conversation.name || 'Branch Chat',
        icon: MapPin,
        subtitle: `${conversation.participants?.length || 0} members`
      };
    } else {
      return {
        name: conversation.name || 'Group Chat',
        icon: MessageSquare,
        subtitle: `${conversation.participants?.length || 0} members`
      };
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    const messageDate = new Date(date);
    const now = new Date();
    const diffMs = now - messageDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return messageDate.toLocaleDateString();
  };

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <MessageSquare className={`w-16 h-16 mb-4 ${dm.textMuted}`} />
        <h3 className={`text-lg font-semibold mb-2 ${dm.textPrimary}`}>No conversations yet</h3>
        <p className={`text-sm ${dm.textMuted}`}>Start a new conversation to connect with your team</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className={`px-4 py-3 border-b ${dm.border}`}>
        <h2 className={`text-lg font-semibold ${dm.textPrimary}`}>Messages</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => {
          const display = getConversationDisplay(conversation);
          const Icon = display.icon;
          const isSelected = selectedConversation?._id === conversation._id;
          const hasUnread = conversation.unreadCount > 0;

          return (
            <button
              key={conversation._id}
              onClick={() => onSelectConversation(conversation)}
              className={`w-full px-4 py-3 flex items-start gap-3 border-b transition-colors ${dm.border} ${
                isSelected 
                  ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-l-primary-500' 
                  : `hover:bg-gray-50 dark:hover:bg-gray-800/50 ${hasUnread ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                isSelected 
                  ? 'bg-primary-100 dark:bg-primary-800/50 text-primary-600 dark:text-primary-400' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`font-semibold text-sm truncate ${dm.textPrimary} ${hasUnread ? 'font-bold' : ''}`}>
                    {display.name}
                  </h3>
                  {conversation.lastMessage && (
                    <span className={`text-xs flex-shrink-0 ml-2 ${hasUnread ? 'text-primary-600 dark:text-primary-400 font-semibold' : dm.textMuted}`}>
                      {formatTime(conversation.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <p className={`text-sm truncate ${hasUnread ? 'font-semibold text-gray-900 dark:text-white' : dm.textMuted}`}>
                    {conversation.lastMessage?.content || display.subtitle}
                  </p>
                  {hasUnread && (
                    <span className="ml-2 bg-primary-500 text-white text-xs font-bold rounded-full px-2 py-0.5 flex-shrink-0">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ConversationList;
