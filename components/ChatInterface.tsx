import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { ChatMessage, Source } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  sources: Source[];
  onSendMessage: (text: string) => void;
  isGenerating: boolean;
  suggestedQuestions: string[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  sources,
  onSendMessage, 
  isGenerating,
  suggestedQuestions
}) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;
    onSendMessage(input);
    setInput('');
  };

  const handleSuggestionClick = (q: string) => {
    if (isGenerating) return;
    onSendMessage(q);
  };

  if (sources.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
        <div className="max-w-md">
          <div className="w-16 h-16 bg-nexus-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-nexus-600">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-3">Welcome to Nexus LLM</h2>
          <p className="text-slate-500 text-lg leading-relaxed">
            Upload your documents on the left to get started. Nexus can summarize, answer questions, and even create audio podcasts from your sources.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
        {messages.length === 0 && (
          <div className="max-w-3xl mx-auto mt-8">
             <h3 className="text-slate-400 font-medium uppercase tracking-widest text-xs mb-6 text-center">Suggested Questions</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {suggestedQuestions.map((q, i) => (
                 <button 
                  key={i}
                  onClick={() => handleSuggestionClick(q)}
                  className="p-4 text-left rounded-xl border border-slate-200 hover:border-nexus-300 hover:bg-nexus-50 transition-all group"
                 >
                   <p className="text-slate-700 font-medium group-hover:text-nexus-800">{q}</p>
                 </button>
               ))}
             </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 max-w-3xl mx-auto ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nexus-500 to-nexus-700 flex-shrink-0 flex items-center justify-center text-white shadow-sm mt-1">
                <Sparkles className="w-4 h-4" />
              </div>
            )}
            
            <div className={`prose prose-slate max-w-none rounded-2xl p-5 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-slate-100 text-slate-800 rounded-tr-sm' 
                : 'bg-white border border-slate-100 rounded-tl-sm'
            }`}>
              <ReactMarkdown 
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {msg.text}
              </ReactMarkdown>
            </div>
            
            {msg.role === 'user' && (
               <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-500 shadow-sm mt-1">
                 <User className="w-4 h-4" />
               </div>
            )}
          </div>
        ))}

        {isGenerating && (
          <div className="flex gap-4 max-w-3xl mx-auto">
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nexus-500 to-nexus-700 flex-shrink-0 flex items-center justify-center text-white shadow-sm mt-1">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm p-5 shadow-sm">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-nexus-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-nexus-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-nexus-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
          </div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100 sticky bottom-0 z-10">
        <div className="max-w-3xl mx-auto relative">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your sources..."
              className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-nexus-500/30 focus:border-nexus-500 transition-all shadow-sm text-slate-800 placeholder:text-slate-400"
              disabled={isGenerating}
            />
            <button
              type="submit"
              disabled={!input.trim() || isGenerating}
              className="absolute right-2 top-2 p-2 bg-nexus-600 text-white rounded-full hover:bg-nexus-700 disabled:opacity-50 disabled:bg-slate-300 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="text-center mt-2">
             <p className="text-[10px] text-slate-400">Nexus LLM can make mistakes. Verify important information.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;