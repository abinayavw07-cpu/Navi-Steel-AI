import React, { useState } from 'react';
import { MessageSquare, Send, Sparkles, RefreshCw } from 'lucide-react';
import { GoogleGenAI } from '@google/genai'; // Ensure @google/genai is installed
import { portData } from '../data/mockData';

export default function NaviAICopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState([
    { sender: 'ai', text: 'Hello! I am your Navi AI Copilot powered by Gemini. Ask me about port waiting times, draft limits, or maritime optimization.' }
  ]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMsg = query.trim();
    setQuery('');
    
    // Add user message to chat history immediately
    const updatedChat = [...chat, { sender: 'user', text: userMsg }];
    setChat(updatedChat);
    setLoading(true);

    try {
      // Initialize Gemini SDK using the modern standard
      // (Ensure VITE_GEMINI_API_KEY is defined in your .env file)
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

      // Provide maritime context along with current port mock data so Gemini has accurate domain data
      const contextPrompt = `
      You are Navi AI, an expert maritime chartering and logistics assistant for NaviSteel.
      Here is the current port status dataset:
      ${JSON.stringify(portData)}

      User Question: "${userMsg}"

      Answer professionally, concisely, and keep it formatted nicely for a chat interface.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contextPrompt,
      });

      const aiReply = response.text || "I couldn't generate a response at the moment.";

      setChat([...updatedChat, { sender: 'ai', text: aiReply }]);
    } catch (err) {
      console.error("Gemini API Error:", err);
      // Fallback response if API key is missing or request fails
      setChat([
        ...updatedChat, 
        { sender: 'ai', text: "⚠️ Network or API Key error. Please check your Gemini API configuration." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 font-mono">
      {isOpen ? (
        <div className="bg-white w-80 h-96 rounded-2xl shadow-2xl border border-sky-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-600 to-blue-700 text-white p-3 flex justify-between items-center">
            <span className="text-xs font-bold flex items-center gap-1.5">
              <Sparkles size={14} /> Navi AI Copilot (Gemini)
            </span>
            <button 
              onClick={() => setIsOpen(false)} 
              className="text-white hover:text-sky-200 text-sm font-bold px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs bg-sky-50/30">
            {chat.map((c, i) => (
              <div 
                key={i} 
                className={`p-2.5 rounded-xl whitespace-pre-line leading-relaxed ${
                  c.sender === 'ai' 
                    ? 'bg-white text-sky-900 border border-sky-100 shadow-xs' 
                    : 'bg-blue-600 text-white ml-auto max-w-[85%]'
                }`}
              >
                {c.text}
              </div>
            ))}
            {loading && (
              <div className="bg-white text-sky-900 border border-sky-100 p-2.5 rounded-xl shadow-xs flex items-center gap-2 text-xs">
                <RefreshCw size={12} className="animate-spin text-sky-600" /> Thinking with Gemini...
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-2.5 border-t border-sky-100 bg-white flex gap-1.5">
            <input 
              type="text" 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder="Ask Gemini about ports, draft..." 
              className="flex-1 border border-sky-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
            <button 
              type="submit" 
              disabled={loading}
              className="bg-sky-600 hover:bg-sky-700 text-white p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center disabled:opacity-50"
            >
              <Send size={12}/>
            </button>
          </form>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)} 
          className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold cursor-pointer transition-transform hover:scale-105"
        >
          <MessageSquare size={16} /> Navi AI Assistant
        </button>
      )}
    </div>
  );
}