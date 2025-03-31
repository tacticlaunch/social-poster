import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TelegramMessage } from '../types';
import { getUserChats, getChatMessages, getCurrentUser } from '../services/telegramService';

const MessageSelector = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState<Array<{
    id: number;
    title: string;
    username?: string;
    type: 'private' | 'group' | 'supergroup' | 'channel';
    is_forum?: boolean;
    accessHash?: string;
    forum_topics?: Array<{
      id: number;
      title: string;
      icon_color: number;
      icon_emoji_id?: string;
      top_message: number;
      message_thread_id: number;
      messages_count: number;
      views_count: number;
      creation_date: number;
      creator_id: number;
      is_pinned: boolean;
      is_closed: boolean;
      is_hidden: boolean;
    }>;
  }>>([]);
  const [messages, setMessages] = useState<TelegramMessage[]>([]);
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<TelegramMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatWidth, setChatWidth] = useState(300); // Initial width in pixels
  const [isResizing, setIsResizing] = useState(false);
  const [initialWidth, setInitialWidth] = useState(0);
  const [initialX, setInitialX] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageLimit = 20; // Number of messages to load per batch
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Add resize handler
  const handleResizeStart = (e: React.MouseEvent) => {
    setIsResizing(true);
    setInitialWidth(chatWidth);
    setInitialX(e.clientX);
    e.preventDefault();
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  const handleResize = (e: MouseEvent) => {
    if (!isResizing) return;

    const diff = e.clientX - initialX;
    const newWidth = initialWidth + diff;
    
    // Set minimum and maximum width constraints
    if (newWidth >= 200 && newWidth <= 600) {
      setChatWidth(newWidth);
    }
  };

  // Add and remove event listeners
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', handleResizeEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing]);

  useEffect(() => {
    const checkLoginAndLoadChats = async () => {
      try {
        setLoading(true);
        
        // Check if user is logged in
        const user = await getCurrentUser();
        if (!user) {
          navigate('/login');
          return;
        }
        setCurrentUserId(user.id);
        
        // Load user chats
        const userChats = await getUserChats();
        setChats(userChats);
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to load chats:', error);
        setError('Failed to load chats. Please try refreshing the page.');
        setLoading(false);
      }
    };
    
    checkLoginAndLoadChats();
  }, [navigate]);

  const handleChatSelect = async (chatId: number) => {
    try {
      setSelectedChat(chatId);
      setSelectedTopic(null);
      setLoadingMessages(true);
      setError(null);
      setMessages([]);
      setHasMoreMessages(true);
      
      // Get messages for the selected chat
      const selectedChatObj = chats.find(chat => chat.id === chatId);
      if (!selectedChatObj || !selectedChatObj.accessHash) {
        throw new Error('Selected chat not found or missing access hash');
      }

      const result = await getChatMessages({
        chat: {
          id: chatId,
          accessHash: selectedChatObj.accessHash,
        },
        limit: messageLimit,
      });
      
      if (!result) {
        setMessages([]);
        setHasMoreMessages(false);
        return;
      }
      
      // Check if there might be more messages
      setHasMoreMessages(result.messages.length === messageLimit);
      
      // Add chat_title and user info to each message
      const messagesWithChatTitle = result.messages.map(message => {
        const user = result.users?.find(u => u.id.toString() === message.fromId?.toString());
        return {
          ...message,
          chat_title: selectedChatObj.title || 'Unknown Chat',
          fromId: message.fromId,
          user: user || undefined
        };
      });
      
      // Store messages in reverse order (oldest first)
      setMessages(messagesWithChatTitle.reverse());
      setLoadingMessages(false);
      
      // Scroll to the bottom after messages are loaded
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        }
      }, 100);
    } catch (error) {
      console.error(`Failed to load messages for chat ${chatId}:`, error);
      setError('Failed to load messages. Please try selecting another chat.');
      setLoadingMessages(false);
      setMessages([]);
      setHasMoreMessages(false);
    }
  };

  const handleTopicSelect = async (chatId: number, topicId: number) => {
    try {
      setSelectedTopic(topicId);
      setLoadingMessages(true);
      setError(null);
      setMessages([]);
      setHasMoreMessages(true);
      
      // Get messages for the selected topic
      const selectedChatObj = chats.find(chat => chat.id === chatId);
      if (!selectedChatObj || !selectedChatObj.accessHash) {
        throw new Error('Selected chat not found or missing access hash');
      }

      const result = await getChatMessages({
        chat: {
          id: chatId,
          accessHash: selectedChatObj.accessHash,
        },
        threadId: topicId,
        limit: messageLimit,
      });
      
      if (!result) {
        setMessages([]);
        setHasMoreMessages(false);
        return;
      }
      
      // Check if there might be more messages
      setHasMoreMessages(result.messages.length === messageLimit);
      
      // Add chat_title to each message from the selected chat
      const messagesWithChatTitle = result.messages.map(message => ({
        ...message,
        chat_title: selectedChatObj.title || 'Unknown Chat'
      }));
      
      // Store messages in reverse order (oldest first)
      setMessages(messagesWithChatTitle.reverse());
      setLoadingMessages(false);
      
      // Scroll to the bottom after messages are loaded
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        }
      }, 100);
    } catch (error) {
      console.error(`Failed to load messages for topic ${topicId}:`, error);
      setError('Failed to load messages. Please try selecting another topic.');
      setLoadingMessages(false);
      setMessages([]);
      setHasMoreMessages(false);
    }
  };

  // Handle scroll for infinite loading when scrolling up
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    
    // If we're close to the top (100px threshold) and we have more messages, load more
    if (scrollTop < 100 && hasMoreMessages && !loadingMoreMessages && !searchTerm) {
      // Remember the current scroll position and content before loading
      const scrollContainer = e.currentTarget;
      const previousScrollHeight = scrollContainer.scrollHeight;
      
      // Set loading immediately to prevent multiple calls
      setLoadingMoreMessages(true);
      
      // Use async/await inside the callback rather than returning a promise
      (async () => {
        try {
          // Get the ID of the first (oldest loaded) message to use as offset
          const firstMessage = messages[0];
          if (!firstMessage || !selectedChat) {
            setLoadingMoreMessages(false);
            return;
          }
          
          // Get the selected chat object
          const selectedChatObj = chats.find(chat => chat.id === selectedChat);
          if (!selectedChatObj || !selectedChatObj.accessHash) {
            throw new Error('Selected chat not found or missing access hash');
          }
          
          // Load more messages with offset
          const result = await getChatMessages({
            chat: {
              id: selectedChat,
              accessHash: selectedChatObj.accessHash,
            },
            offsetId: firstMessage.id,
            limit: messageLimit,
            ...(selectedTopic && { threadId: selectedTopic }),
          });
          
          if (!result) {
            setHasMoreMessages(false);
            setLoadingMoreMessages(false);
            return;
          }
          
          // Check if there might be more messages to load
          setHasMoreMessages(result.messages.length === messageLimit);
          
          if (result.messages.length > 0) {
            // Add chat_title and user info to each message
            const messagesWithChatTitle = result.messages.map(message => {
              const user = result.users?.find(u => u.id.toString() === message.fromId?.toString());
              return {
                ...message,
                chat_title: selectedChatObj.title || 'Unknown Chat',
                fromId: message.fromId,
                user: user || undefined
              };
            });
            
            // Add new messages to the beginning of the list (they are older messages)
            setMessages(prev => [...messagesWithChatTitle.reverse(), ...prev]);
            
            // After state update, preserve the scroll position
            requestAnimationFrame(() => {
              if (scrollContainer) {
                const newScrollHeight = scrollContainer.scrollHeight;
                const heightDifference = newScrollHeight - previousScrollHeight;
                scrollContainer.scrollTop = heightDifference;
              }
            });
          }
        } catch (error) {
          console.error('Failed to load more messages:', error);
        } finally {
          setLoadingMoreMessages(false);
        }
      })();
    }
  }, [messages, selectedChat, selectedTopic, loadingMoreMessages, hasMoreMessages, chats, searchTerm, messageLimit]);
  
  const handleMessageSelect = (message: TelegramMessage) => {
    setSelectedMessages(prevSelected => {
      const isAlreadySelected = prevSelected.some(m => m.id === message.id);
      
      if (isAlreadySelected) {
        return prevSelected.filter(m => m.id !== message.id);
      } else {
        return [...prevSelected, message];
      }
    });
  };

  const handleContinue = () => {
    if (selectedMessages.length === 0) {
      alert('Please select at least one message');
      return;
    }

    // Store selected messages in local storage for the next page
    localStorage.setItem('selected_messages', JSON.stringify(selectedMessages));
    navigate('/editor');
  };

  // Filter chats based on chat search term
  const filteredChats = chatSearchTerm
    ? chats.filter(chat => 
        chat.title?.toLowerCase().includes(chatSearchTerm.toLowerCase()) ||
        (chat.username && chat.username.toLowerCase().includes(chatSearchTerm.toLowerCase())))
    : chats;

  const filteredMessages = searchTerm
    ? messages.filter(message => 
        message.text?.toLowerCase().includes(searchTerm.toLowerCase()))
    : messages;

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4 text-white">Select Messages</h2>
        
        {error && (
          <div className="p-4 bg-[#ff3b30]/10 border border-[#ff3b30]/20 rounded-md text-[#ff3b30]">
            {error}
          </div>
        )}
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Chat List */}
        <div 
          className="bg-[#2f2f2f] shadow-md flex flex-col"
          style={{ width: `${chatWidth}px` }}
        >
          <div className="p-4 border-b border-[#3f3f3f]">
            <h3 className="text-lg font-semibold mb-4 text-white">Chats</h3>
            
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full p-2 bg-[#1f1f1f] border border-[#3f3f3f] rounded-md text-white placeholder-[#a8a8a8] focus:outline-none focus:border-[#4f4f4f]"
              value={chatSearchTerm}
              onChange={(e) => setChatSearchTerm(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-[#a8a8a8]">
                Loading chats...
              </div>
            ) : (
              <ul className="space-y-1 p-2">
                {filteredChats.map(chat => (
                  <li key={chat.id}>
                    <button
                      onClick={() => handleChatSelect(chat.id)}
                      className={`w-full text-left p-2 rounded-md transition-colors ${
                        selectedChat === chat.id
                          ? 'bg-[#3f3f3f] text-white'
                          : 'hover:bg-[#3f3f3f] text-[#a8a8a8]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="truncate">{chat.title}</span>
                        {chat.username && (
                          <span className="text-sm text-[#808080]">
                            @{chat.username}
                          </span>
                        )}
                      </div>
                    </button>
                    
                    {selectedChat === chat.id && chat.is_forum && chat.forum_topics && (
                      <ul className="ml-4 mt-2 space-y-1">
                        {chat.forum_topics.map((topic: {
                          id: number;
                          title: string;
                          icon_color: number;
                          icon_emoji_id?: string;
                          top_message: number;
                          message_thread_id: number;
                          messages_count: number;
                          views_count: number;
                          creation_date: number;
                          creator_id: number;
                          is_pinned: boolean;
                          is_closed: boolean;
                          is_hidden: boolean;
                        }) => (
                          <li
                            key={topic.id}
                            className="flex items-center gap-2"
                          >
                            <button
                              onClick={() => handleTopicSelect(chat.id, topic.id)}
                              className={`flex-1 text-left p-2 rounded-md transition-colors ${
                                selectedTopic === topic.id
                                  ? 'bg-[#3f3f3f] text-white'
                                  : 'hover:bg-[#3f3f3f] text-[#a8a8a8]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: `#${topic.icon_color.toString(16).padStart(6, '0')}` }}
                                />
                                <span className="truncate">{topic.title}</span>
                                <span className="ml-auto text-sm text-[#808080]">
                                  {topic.messages_count}
                                </span>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Resizer */}
        <div
          className="w-1 bg-[#3f3f3f] cursor-col-resize hover:bg-[#4f4f4f] transition-colors"
          onMouseDown={handleResizeStart}
          style={{ cursor: isResizing ? 'col-resize' : 'default' }}
        />

        {/* Messages Section */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#1f1f1f]">
          <div className="p-4 border-b border-[#3f3f3f]">
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Search messages..."
                className="flex-1 p-2 bg-[#2f2f2f] border border-[#3f3f3f] rounded-md text-white placeholder-[#a8a8a8] focus:outline-none focus:border-[#4f4f4f]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loadingMessages}
              />
              
              <button
                onClick={handleContinue}
                disabled={selectedMessages.length === 0}
                className="px-4 py-2 bg-[#007bff] text-white rounded-md hover:bg-[#0056b3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue ({selectedMessages.length})
              </button>
            </div>
          </div>
          
          <div 
            className="flex-1 overflow-y-auto p-4"
            onScroll={handleScroll}
          >
            {loadingMessages ? (
              <div className="py-8 text-center text-[#a8a8a8]">
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="py-8 text-center text-[#a8a8a8]">
                {selectedChat ? 'No messages found' : 'Select a chat to view messages'}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMessages.map(message => {
                  const isOwnMessage = currentUserId && message.fromId?.toString() === currentUserId.toString();

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-4 rounded-lg cursor-pointer transition-colors ${
                          selectedMessages.some(m => m.id === message.id)
                            ? isOwnMessage
                              ? 'bg-[#007bff]' // Primary color for own message
                              : 'bg-[#3f3f3f]'
                            : isOwnMessage
                              ? 'bg-[#007bff]/80 hover:bg-[#007bff]' // Primary color for own message with hover
                              : 'bg-[#2f2f2f] hover:bg-[#3f3f3f]'
                        }`}
                        onClick={() => handleMessageSelect(message)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {!isOwnMessage && message.user && (
                            <span className="text-sm text-[#a8a8a8]">
                              {message.user.first_name}
                              {message.user.last_name && ` ${message.user.last_name}`}
                              {message.user.username && ` (@${message.user.username})`}
                            </span>
                          )}
                          <span className={`text-sm ${isOwnMessage ? 'text-[#a8a8a8]' : 'text-[#808080]'}`}>
                            {new Date(message.date * 1000).toLocaleString()}
                          </span>
                        </div>
                        <p className={`whitespace-pre-wrap ${isOwnMessage ? 'text-white' : 'text-white'}`}>
                          {message.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageSelector; 