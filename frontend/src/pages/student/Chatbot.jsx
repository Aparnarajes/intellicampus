import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  Send, Bot, User, Sparkles, Command, Paperclip, Eraser,
  MessageSquare, History, GraduationCap, Calendar, Award,
  Users, AlertTriangle, BookOpen, Clock, MapPin, ChevronRight
} from 'lucide-react';
import aiService from '../../services/aiService';
import { AuthContext } from '../../context/AuthContext';

const ResponseCard = ({ type, data }) => {
  if (!data) return null;

  switch (type) {
    case 'ATTENDANCE':
      return (
        <div className="mt-4 bg-slate-900/50 border border-emerald-500/20 rounded-2xl p-4 space-y-4 animate-in zoom-in-95 duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                <Users size={16} />
              </div>
              <span className="text-xs font-black text-white uppercase tracking-widest">Attendance Metric</span>
            </div>
            <span className={`text-xl font-black ${parseFloat(data.percentage) >= 75 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {data.percentage}%
            </span>
          </div>
          <div className="space-y-2">
            {data.breakdown?.slice(0, 3).map((s, i) => (
              <div key={i} className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-bold truncate max-w-[150px]">{s.subject}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${s.percentage}%` }} />
                  </div>
                  <span className="text-slate-200 w-8 text-right font-black">{s.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'MARKS':
      return (
        <div className="mt-4 bg-slate-900/50 border border-blue-500/20 rounded-2xl p-4 space-y-4 animate-in zoom-in-95 duration-500">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Award size={16} />
            </div>
            <span className="text-xs font-black text-white uppercase tracking-widest">Academic Transcript</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {data.slice(0, 3).map((m, i) => (
              <div key={i} className="bg-slate-800/50 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-white uppercase truncate max-w-[120px]">{m.subject}</p>
                  <p className="text-[8px] font-bold text-slate-500 uppercase">{m.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-blue-400">{m.marks}/{m.maxMarks}</p>
                  <p className="text-[8px] font-bold text-slate-500">{m.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'EXAMS':
      return (
        <div className="mt-4 bg-slate-900/50 border border-amber-500/20 rounded-2xl p-4 space-y-4 animate-in zoom-in-95 duration-500">
          <div className="flex items-center gap-2 text-amber-500">
            <AlertTriangle size={16} />
            <span className="text-xs font-black uppercase tracking-widest">Upcoming Neural Evaluations</span>
          </div>
          <div className="space-y-2">
            {data.map((e, i) => (
              <div key={i} className="relative pl-4 border-l-2 border-amber-500/30 py-1">
                <p className="text-[10px] font-black text-white uppercase">{e.subject}</p>
                <div className="flex items-center gap-3 mt-1 text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1"><Calendar size={8} /> {new Date(e.date).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Clock size={8} /> {e.time}</span>
                  <span className="flex items-center gap-1"><MapPin size={8} /> {e.venue}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'ASSIGNMENTS':
      return (
        <div className="mt-4 bg-slate-900/50 border border-indigo-500/20 rounded-2xl p-4 space-y-4 animate-in zoom-in-95 duration-500">
          <div className="flex items-center gap-2 text-indigo-400">
            <BookOpen size={16} />
            <span className="text-xs font-black uppercase tracking-widest">Active Objectives</span>
          </div>
          <div className="space-y-2">
            {data.map((a, i) => (
              <div key={i} className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
                <div>
                  <p className="text-[10px] font-black text-white uppercase">{a.title}</p>
                  <p className="text-[8px] font-bold text-slate-500 uppercase">{a.subject}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-rose-500 uppercase tracking-tighter">Due In</p>
                  <p className="text-[10px] font-black text-slate-200 italic">{new Date(a.dueDate).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    case 'TUTOR':
      return (
        <div className="mt-4 bg-slate-900/50 border border-purple-500/20 rounded-2xl p-4 space-y-4 animate-in zoom-in-95 duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-400">
              <Sparkles size={16} />
              <span className="text-xs font-black uppercase tracking-widest text-white">Neural Tutor Active</span>
            </div>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-[8px] font-black text-purple-400 uppercase">
                {data.difficulty}
              </span>
              {data.isWeakTopic && (
                <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded text-[8px] font-black text-rose-400 uppercase flex items-center gap-1">
                  <AlertTriangle size={8} /> Focus Required
                </span>
              )}
            </div>
          </div>
          <div className="bg-slate-800/30 p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen size={12} className="text-slate-500" />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">{data.subject}</p>
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">{data.topic}</p>
          </div>
        </div>
      );
    case 'ALERT':
      return (
        <div className="mt-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 space-y-3 animate-in slide-in-from-right-4 duration-500">
          <div className="flex items-center gap-2 text-rose-500">
            <AlertTriangle size={16} />
            <span className="text-xs font-black uppercase tracking-widest">Urgent Academic Alert</span>
          </div>
          <p className="text-[11px] font-bold text-slate-300 leading-relaxed">{data.message}</p>
          <div className="flex justify-between items-center bg-black/20 p-2 rounded-lg">
            <span className="text-[9px] font-black text-rose-400 uppercase tracking-tighter">{data.type}</span>
            <button className="text-[9px] font-black text-white hover:text-primary-400 uppercase transition-colors">Action Required</button>
          </div>
        </div>
      );

    default:
      return null;
  }
};

const Chatbot = () => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Greetings ${user?.name || ''}! I'm your AI Class Rep. How can I assist your learning path today?`,
      type: 'text'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await aiService.getHistory();
        if (data.success && data.messages && data.messages.length > 0) {
          setMessages([
            messages[0],
            ...data.messages.map(m => ({
              role: m.role,
              content: m.content,
              type: m.responseType || 'text',
              cardType: m.cardType,
              cardData: m.cardData
            }))
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    const fetchProactive = async () => {
      try {
        const data = await aiService.getProactiveNotifications();
        if (data.success && data.proactive) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.proactive.message,
            type: 'alert',
            cardType: 'ALERT',
            cardData: { message: data.proactive.message, type: 'CR Recommendation' }
          }]);
        }
      } catch (e) {
        console.error("Proactive fetch failed", e);
      }
    };

    fetchHistory();
    fetchProactive();
  }, [user]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = { role: 'user', content: input, type: 'text' };
    const currentInput = input;
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const history = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      const data = await aiService.chat(currentInput, history);

      if (data.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message,
          type: data.responseType || 'text',
          cardType: data.cardType,
          cardData: data.data
        }]);
      } else {
        throw new Error(data.message || "Failed to get AI response");
      }
    } catch (error) {
      console.error("AI Fetch Error:", error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble syncing with the campus mainframe. Please verify connectivity.",
        type: 'text'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm("Clear neural link history?")) {
      try {
        await aiService.clearHistory();
        setMessages([messages[0]]);
      } catch (error) {
        alert("Failed to purge logs.");
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto bg-slate-950 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Header */}
      <header className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-950/50 backdrop-blur-3xl">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-primary-500/20 group-hover:scale-110 transition-transform duration-500 rotate-3 group-hover:rotate-0">
              <Bot size={34} />
            </div>
            <div className="absolute -top-1 -right-1 flex gap-1">
              <span className="w-4 h-4 bg-emerald-500 border-4 border-slate-950 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">AI Class Rep</h2>
              <span className="px-2 py-0.5 bg-primary-500/10 border border-primary-500/20 rounded-md text-[8px] font-black text-primary-400 uppercase tracking-widest">Protocol 4.0</span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
              <span className="flex items-center gap-1.5"><Users size={12} className="text-emerald-500" /> Batch 2023-A</span>
              <div className="w-1 h-1 bg-slate-800 rounded-full" />
              <span className="flex items-center gap-1.5 italic text-slate-400 font-black"><Sparkles size={10} className="text-primary-500" /> Neural Guidance</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={handleClearHistory} className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-rose-500 hover:bg-rose-500/5 rounded-2xl transition-all"><Eraser size={20} /></button>
          <div className="h-10 w-[1px] bg-white/5 mx-2" />
          <div className="px-5 py-3 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Syncing via Gemini 1.5</span>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-8 py-10 space-y-10 scrollbar-none hover:scrollbar-thin">
        {isLoadingHistory && (
          <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" /></div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} group`}>
            <div className={`flex gap-6 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-2 rotate-3 group-hover:rotate-0 transition-transform ${m.role === 'user' ? 'bg-primary-600 text-white' : 'bg-slate-900 border border-white/5 text-primary-400'
                }`}>
                {m.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className="space-y-2">
                <div className={`p-6 rounded-[2rem] shadow-2xl ${m.role === 'user'
                  ? 'bg-primary-600 text-white rounded-tr-none'
                  : 'bg-slate-900/40 backdrop-blur-xl text-slate-200 rounded-tl-none border border-white/5'
                  }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{m.content}</p>

                  {m.role === 'assistant' && m.cardType && (
                    <ResponseCard type={m.cardType} data={m.cardData} />
                  )}
                </div>
                <p className={`text-[8px] font-black uppercase tracking-widest text-slate-600 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {m.role === 'user' ? user.name : 'AI Representative'} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start"><div className="bg-slate-900/40 p-6 rounded-[2rem] rounded-tl-none border border-white/5 flex gap-1.5"><span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" /><span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce delay-150" /><span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce delay-300" /></div></div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer */}
      <footer className="p-8 bg-slate-950 border-t border-white/5">
        <form onSubmit={handleSend} className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
            placeholder="Ask your CR: 'What is my attendance?', 'Upcoming exams?', 'Help with Unit 3'..."
            className="w-full bg-white/5 border border-white/10 text-white rounded-[2rem] px-8 py-6 pr-40 focus:outline-none focus:border-primary-500/50 focus:ring-[15px] focus:ring-primary-500/5 transition-all resize-none h-20 placeholder:text-slate-600 font-medium italic text-sm"
          />
          <div className="absolute right-4 bottom-4 flex items-center gap-3">
            <button type="button" className="p-3 text-slate-500 hover:text-white transition-colors"><Paperclip size={24} /></button>
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white p-4 rounded-2xl transition-all shadow-2xl shadow-primary-500/40"
            >
              <Send size={24} />
            </button>
          </div>
        </form>
        <div className="flex items-center justify-center gap-8 mt-6 opacity-30">
          {['Academic Queries', 'DB Insights', 'Auto-Notes'].map((t) => (
            <div key={t} className="flex items-center gap-2"><div className="w-1 h-1 bg-primary-500 rounded-full" /><span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{t}</span></div>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default Chatbot;