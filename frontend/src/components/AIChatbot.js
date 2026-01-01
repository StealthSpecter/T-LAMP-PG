import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';

const AIChatbot = () => {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: "Hello! 👋 I'm your PowerGrid T-LAMP AI Assistant. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage = {
      type: 'user',
      text: inputMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await api.post('/api/ai/chatbot', { message: inputMessage });
      
      // Add bot response
      const botMessage = {
        type: 'bot',
        text: response.response,
        data: response.data,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      const errorMessage = {
        type: 'bot',
        text: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    "How many transmission lines?",
    "Show recent incidents",
    "Which lines are high risk?",
    "Help"
  ];

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg shadow-xl p-6">
        <h1 className="text-3xl font-bold flex items-center">
          <span className="mr-3">💬</span>
          AI CHATBOT ASSISTANT
        </h1>
        <p className="text-sm opacity-90">
          Ask me anything about your transmission line data
        </p>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Messages */}
        <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-4 ${
                  msg.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-800 shadow'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <div className={`text-xs mt-2 ${msg.type === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                  {msg.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        <div className="bg-gray-100 p-4 border-t">
          <div className="text-sm text-gray-600 mb-2">Quick questions:</div>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                className="bg-white text-gray-700 px-4 py-2 rounded-full text-sm hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-4 bg-white border-t">
          <div className="flex space-x-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send 📤
            </button>
          </div>
        </form>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <h4 className="font-bold text-blue-900 mb-2">💡 Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Ask about statistics, recent incidents, or high-risk lines</li>
          <li>Use natural language - I understand context!</li>
          <li>Type "help" to see all available commands</li>
        </ul>
      </div>
    </div>
  );
};

export default AIChatbot;
