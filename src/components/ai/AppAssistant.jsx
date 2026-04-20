import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const ASSISTANT_CONFIG = {
  appName: 'RE Jones Global',
  appColor: '#6366F1',
  suggestedChips: ['How to refer', 'Available housing', 'Become a partner'],
};

export default function AppAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text = inputValue) => {
    if (!text.trim()) return;

    const userMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await base44.functions.invoke('aiAssistant', {
        message: text,
        conversationHistory: messages,
        contactInfo,
      });

      const assistantMessage = { role: 'assistant', content: response.data.reply };
      setMessages((prev) => [...prev, assistantMessage]);

      if (response.data.contactInfo) {
        setContactInfo(response.data.contactInfo);
      }
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all hover:shadow-xl hover:scale-110 z-40"
        style={{
          backgroundColor: ASSISTANT_CONFIG.appColor,
          color: '#FFFFFF',
          boxShadow: `0 0 20px ${ASSISTANT_CONFIG.appColor}40`,
        }}
        title="Open RE Jones Global Assistant"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Assistant Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 bg-white rounded-lg shadow-2xl flex flex-col max-h-96 z-40 border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200" style={{ backgroundColor: `${ASSISTANT_CONFIG.appColor}10` }}>
            <h2 className="text-sm font-bold" style={{ color: ASSISTANT_CONFIG.appColor }}>
              {ASSISTANT_CONFIG.appName}
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-gray-600 text-sm mt-4">
                <p className="mb-4 font-semibold">How can we help you today?</p>
                <div className="space-y-2">
                  {ASSISTANT_CONFIG.suggestedChips.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(chip)}
                      className="block w-full text-left text-xs px-3 py-2 rounded border transition"
                      style={{
                        borderColor: ASSISTANT_CONFIG.appColor,
                        color: ASSISTANT_CONFIG.appColor,
                      }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`text-xs p-3 rounded ${
                  msg.role === 'user'
                    ? `text-white ml-8`
                    : 'bg-gray-100 text-gray-800 mr-8'
                }`}
                style={msg.role === 'user' ? { backgroundColor: ASSISTANT_CONFIG.appColor } : {}}
              >
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="text-xs text-gray-400 flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask a question..."
                className="flex-1 bg-gray-50 border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400"
                disabled={loading}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={loading || !inputValue.trim()}
                className="p-2 rounded transition disabled:opacity-50"
                style={{ backgroundColor: ASSISTANT_CONFIG.appColor, color: '#FFFFFF' }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}