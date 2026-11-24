import { useState, useRef, useEffect } from 'react';
import '../chatbot.css';

const BACKEND_URL = import.meta.env.VITE_AI_BACKEND_URL || 'https://dream-wedding-ai-backend.onrender.com';

const INITIAL_MESSAGE = {
  id: 'welcome-1',
  sender: 'bot',
  text: 'Namaste! I am Mira, your Dream Wedding AI Consultant. How can I help you plan your special day? Feel free to ask about our wedding packages, budget breakdowns in Indian Rupees (₹), ceremony decor, or catering rates!',
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
};

const SUGGESTIONS = [
  'Budget breakdown for 200 guests',
  'Compare Essential & Premium packages',
  'Haldi & Mandap decor prices',
  'Catering per plate cost'
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to the bottom of the conversation
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = async (messageText) => {
    const textToSend = (messageText || inputText).trim();
    if (!textToSend || isLoading) return;

    const userMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Keep conversation history in simple React state only
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setErrorMessage(null);
    setIsLoading(true);

    const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: textToSend })
      });   try {
   

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to get a response from Mira. Please try again.');
      }

      const botMessage = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: data.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Chatbot error:', err);
      const friendlyError = 'Mira is temporarily unavailable. Please make sure the backend is running, or contact our wedding experts directly!';
      setErrorMessage(friendlyError);

      setMessages((prev) => [
        ...prev,
        {
          id: 'error-' + Date.now(),
          sender: 'bot',
          isError: true,
          text: friendlyError,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        ...INITIAL_MESSAGE,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setErrorMessage(null);
    setInputText('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="dw-chatbot-root">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          className="dw-chatbot-trigger-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Wedding Assistant"
          title="Chat with Mira - AI Wedding Consultant"
        >
          <span className="dw-chatbot-trigger-icon">💍</span>
          <span className="dw-chatbot-trigger-label">Ask Mira AI</span>
          <span className="dw-chatbot-trigger-pulse"></span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="dw-chatbot-window">
          {/* Header */}
          <div className="dw-chatbot-header">
            <div className="dw-chatbot-profile">
              <div className="dw-chatbot-avatar-wrap">
                <span className="dw-chatbot-avatar">👰</span>
                <span className="dw-chatbot-online-dot"></span>
              </div>
              <div className="dw-chatbot-header-info">
                <h4>Mira</h4>
                <p>AI Wedding Consultant • Online</p>
              </div>
            </div>

            <div className="dw-chatbot-header-actions">
              <button
                type="button"
                className="dw-chatbot-header-btn"
                onClick={handleClearChat}
                title="Clear Chat History"
                aria-label="Clear Chat History"
              >
                <i className="fa-solid fa-rotate-right"></i>
              </button>
              <button
                type="button"
                className="dw-chatbot-header-btn dw-chatbot-close-btn"
                onClick={() => setIsOpen(false)}
                title="Close Chat"
                aria-label="Close Chat"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="dw-chatbot-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`dw-chat-message-row ${msg.sender === 'user' ? 'dw-chat-user-row' : 'dw-chat-bot-row'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="dw-chat-avatar-mini" aria-hidden="true">
                    👰
                  </div>
                )}
                <div
                  className={`dw-chat-bubble ${msg.sender === 'user'
                      ? 'dw-chat-bubble-user'
                      : msg.isError
                        ? 'dw-chat-bubble-error'
                        : 'dw-chat-bubble-bot'
                    }`}
                >
                  <div className="dw-chat-bubble-text">{msg.text}</div>
                  <div className="dw-chat-bubble-time">{msg.time}</div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="dw-chat-message-row dw-chat-bot-row">
                <div className="dw-chat-avatar-mini">👰</div>
                <div className="dw-chat-bubble dw-chat-bubble-bot dw-chat-typing">
                  <span className="dw-chat-typing-dot"></span>
                  <span className="dw-chat-typing-dot"></span>
                  <span className="dw-chat-typing-dot"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          {messages.length <= 2 && !isLoading && (
            <div className="dw-chatbot-suggestions">
              <div className="dw-chatbot-suggestions-title">Quick Questions:</div>
              <div className="dw-chatbot-chips-wrap">
                {SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="dw-chatbot-chip"
                    onClick={() => handleSend(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="dw-chatbot-error-banner">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Input Form */}
          <form className="dw-chatbot-input-bar" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask Mira about packages, budget, decor..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              maxLength={1000}
              className="dw-chatbot-input"
            />
            <button
              type="submit"
              className="dw-chatbot-send-btn"
              disabled={isLoading || !inputText.trim()}
              aria-label="Send Message"
            >
              {isLoading ? (
                <span className="dw-chatbot-spinner"></span>
              ) : (
                <i className="fa-solid fa-paper-plane"></i>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
