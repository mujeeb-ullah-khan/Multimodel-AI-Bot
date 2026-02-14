import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Bot, User, Moon, Sun, Menu, X, Trash2, Download, Settings,
  Image, XCircle, PlusCircle
} from 'lucide-react';

// Message type with optional image
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  image?: string; // base64 or URL
  isImageAnalysis?: boolean;
}

// Get API base URL from environment (set by Vite)
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Theme handling
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Send message (with optional image)
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input.trim() || (selectedImage ? '[Image uploaded]' : ''),
      sender: 'user',
      timestamp: new Date(),
      image: imagePreview || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      let response;
      
      if (selectedImage) {
        // Send image for analysis
        const formData = new FormData();
        
        // Convert base64 to blob
        const blob = await fetch(selectedImage).then(res => res.blob());
        formData.append('image', blob, 'upload.jpg');
        formData.append('prompt', input.trim() || 'What\'s in this image?');

        response = await fetch(`${API_BASE_URL}/api/vision/analyze`, {
          method: 'POST',
          body: formData
        });
      } else {
        // Regular text message
        response = await fetch(`${API_BASE_URL}/api/chat/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: input.trim() })
        });
      }

      const data = await response.json();
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.analysis || data.reply || 'No response',
        sender: 'bot',
        timestamp: new Date(),
        isImageAnalysis: !!selectedImage
      };

      setMessages(prev => [...prev, botMessage]);
      clearSelectedImage();
    } catch (error) {
      console.error('Fetch error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    clearSelectedImage();
    setSidebarOpen(false);
  };

  // Export chat
  const exportChat = () => {
    const chatText = messages.map(m => 
      `[${m.timestamp.toLocaleTimeString()}] ${m.sender === 'user' ? 'You' : 'AI'}: ${m.text}${m.image ? ' [with image]' : ''}`
    ).join('\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setSidebarOpen(false);
  };

  // Create new chat (clear messages)
  const newChat = () => {
    setMessages([]);
    clearSelectedImage();
  };

  // Settings placeholder
  const handleSettings = () => {
    alert('⚙️ Settings panel coming soon!');
  };
  
  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-950' : 'bg-gray-50'}`}>
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar – persistent on desktop, sliding on mobile */}
      <AnimatePresence>
        {sidebarOpen ? (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25 }}
            className={`fixed top-0 left-0 h-full w-72 z-50 ${
              darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
            } shadow-xl p-4 flex flex-col`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Menu</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* New Chat button */}
            <button
              onClick={() => { newChat(); setSidebarOpen(false); }}
              className="w-full flex items-center gap-3 p-3 mb-6 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <PlusCircle className="w-5 h-5" />
              <span className="font-medium">New Chat</span>
            </button>

            {/* Chat history (placeholder) */}
            <div className="flex-1 overflow-y-auto">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Today</p>
              <div className="space-y-2">
                {messages.length > 0 ? (
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm truncate">
                    {messages[0].text.substring(0, 30)}...
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm italic">No history yet</p>
                )}
              </div>
            </div>

            {/* Bottom actions */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
              <button
                onClick={clearChat}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <Trash2 className="w-5 h-5 text-red-500" />
                <span>Clear chat</span>
              </button>
              <button
                onClick={exportChat}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <Download className="w-5 h-5 text-green-500" />
                <span>Export chat</span>
              </button>
              <button
                onClick={handleSettings}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <Settings className="w-5 h-5 text-gray-500" />
                <span>Settings</span>
              </button>
            </div>
          </motion.aside>
        ) : (
          // Desktop sidebar (always visible on large screens)
          <aside className={`hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 lg:left-0 ${
            darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
          } shadow-xl p-4`}>
            <h2 className="text-xl font-semibold mb-6">Menu</h2>

            <button
              onClick={newChat}
              className="w-full flex items-center gap-3 p-3 mb-6 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <PlusCircle className="w-5 h-5" />
              <span className="font-medium">New Chat</span>
            </button>

            <div className="flex-1 overflow-y-auto">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Today</p>
              <div className="space-y-2">
                {messages.length > 0 ? (
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm truncate">
                    {messages[0].text.substring(0, 30)}...
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm italic">No history yet</p>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
              <button
                onClick={clearChat}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <Trash2 className="w-5 h-5 text-red-500" />
                <span>Clear chat</span>
              </button>
              <button
                onClick={exportChat}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <Download className="w-5 h-5 text-green-500" />
                <span>Export chat</span>
              </button>
              <button
                onClick={handleSettings}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <Settings className="w-5 h-5 text-gray-500" />
                <span>Settings</span>
              </button>
            </div>
          </aside>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className={`lg:pl-72 flex flex-col h-screen`}>
        {/* Header */}
        <header className={`${
          darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        } border-b p-4 flex items-center justify-between shadow-sm`}>
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">MUK AI Model</h1>
          </div>
          <button
            onClick={toggleDarkMode}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </header>

        {/* Messages Container */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${
          darkMode ? 'bg-gray-950' : 'bg-gray-50'
        }`}>
          <AnimatePresence initial={false}>
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center h-full text-center p-8"
              >
                <div className="p-4 bg-blue-500 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Hello! I'm your Multimodal AI
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
                  Ask me anything – I can also analyze images.
                </p>
                <div className="flex gap-3 flex-wrap justify-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm flex items-center gap-2"
                  >
                    <Image className="w-4 h-4" /> Upload Image
                  </button>
                  <button
                    onClick={() => setInput('Tell me a fun fact')}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
                  >
                    Tell me a fun fact
                  </button>
                </div>
              </motion.div>
            )}
            
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.sender === 'user'
                      ? 'bg-blue-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                    )}
                  </div>
                  
                  {/* Message Bubble with optional image */}
                  <div>
                    {message.image && (
                      <div className="mb-2 rounded-lg overflow-hidden max-w-sm border border-gray-200 dark:border-gray-700">
                        <img src={message.image} alt="Uploaded" className="w-full h-auto" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                      } shadow-sm`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.text}</p>
                      {message.isImageAnalysis && (
                        <p className="text-xs mt-1 opacity-70">🔍 Image analyzed</p>
                      )}
                    </div>
                    <p className={`text-xs mt-1 text-gray-500 dark:text-gray-400 ${
                      message.sender === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Typing Indicator */}
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex gap-3 max-w-[80%]">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex space-x-1">
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0 }} className="w-2 h-2 bg-gray-400 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} className="w-2 h-2 bg-gray-400 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} className="w-2 h-2 bg-gray-400 rounded-full" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form with Image Preview */}
        <div className={`border-t ${
          darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
        } p-4`}>
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
          
          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-3 flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <img src={imagePreview} alt="Preview" className="h-10 w-10 object-cover rounded" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Image ready to upload</span>
              <button
                onClick={clearSelectedImage}
                className="ml-auto p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <XCircle className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          )}
          
          <form onSubmit={sendMessage} className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition border border-gray-200 dark:border-gray-700"
              title="Upload image"
            >
              <Image className="w-5 h-5" />
            </button>
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedImage ? "Ask about this image..." : "Type your message..."}
              className={`flex-1 px-4 py-3 ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                  : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500'
              } border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={loading}
            />
            
            <button
              type="submit"
              disabled={loading || (!input.trim() && !selectedImage)}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-md"
            >
              <Send className="w-5 h-5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            AI can make mistakes – double-check important info. Images up to 20MB.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;