
import React, { useState, useRef, useEffect } from 'react';
import { Users, Send, MessageSquare, Plus, Share2, FileText, Bot, Loader2 } from 'lucide-react';
import { ChatMessage, StudyGroup } from '../types';
import { chatWithAgent } from '../services/gemini';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export const ActivityHub: React.FC = () => {
    const [groups, setGroups] = useState<StudyGroup[]>([
        { id: '1', name: 'Circuit Theory Squad', members: 4, topic: 'EE' },
        { id: '2', name: 'Algo Masters', members: 6, topic: 'CSE' }
    ]);
    const [activeGroup, setActiveGroup] = useState<string>('1');
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', sender: 'Alex', text: 'Hey, has anyone solved the KCL problem?', isAi: false, timestamp: Date.now() - 100000 },
        { id: '2', sender: 'Sarah', text: 'Yeah, I uploaded the notes in files.', isAi: false, timestamp: Date.now() - 50000 },
        { id: '3', sender: 'EngiBot', text: 'I can help analyze circuits if you upload the schematic!', isAi: true, timestamp: Date.now() - 20000 },
    ]);
    const [inputText, setInputText] = useState('');
    const [isAiThinking, setIsAiThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            sender: 'You',
            text: inputText,
            isAi: false,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        const currentText = inputText;
        setInputText('');

        // Check if AI help is needed
        if (currentText.toLowerCase().includes('@ai') || currentText.toLowerCase().includes('bot') || currentText.toLowerCase().includes('solve')) {
            setIsAiThinking(true);
            try {
                // Prepare simple history for context
                const history = messages.slice(-5).map(m => ({ 
                    role: m.isAi ? 'model' : 'user', 
                    parts: [{ text: m.text }] 
                }));
                
                // Add current message
                history.push({ role: 'user', parts: [{ text: currentText }] });

                const response = await chatWithAgent(
                    history, 
                    currentText, 
                    "You are a helpful AI tutor in a group chat study session. Keep answers brief and helpful."
                );

                const aiMsg: ChatMessage = {
                    id: crypto.randomUUID(),
                    sender: 'EngiBot',
                    text: response,
                    isAi: true,
                    timestamp: Date.now()
                };
                setMessages(prev => [...prev, aiMsg]);
            } catch (error) {
                console.error(error);
            } finally {
                setIsAiThinking(false);
            }
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 animate-slide-in h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6">
            {/* Sidebar / Groups List */}
            <div className="w-full md:w-80 flex flex-col gap-4">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Study Groups</h2>
                    <button className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="space-y-3 overflow-y-auto max-h-48 md:max-h-full">
                    {groups.map(g => (
                        <div 
                            key={g.id}
                            onClick={() => setActiveGroup(g.id)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                                activeGroup === g.id 
                                ? 'bg-white dark:bg-[#1E293B] border-indigo-500 shadow-md' 
                                : 'bg-slate-50 dark:bg-slate-900 border-transparent hover:bg-white dark:hover:bg-[#1E293B]'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                    {g.name[0]}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white text-sm">{g.name}</p>
                                    <p className="text-xs text-slate-500">{g.members} members • {g.topic}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center">
                        <p className="text-sm text-slate-400 mb-2">Invite friends to collaborate!</p>
                        <button className="text-indigo-600 font-bold text-sm flex items-center justify-center gap-2 w-full py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg">
                            <Share2 className="w-4 h-4" /> Share Invite Link
                        </button>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-white dark:bg-[#1E293B] rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden">
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-slate-900 dark:text-white">
                            {groups.find(g => g.id === activeGroup)?.name}
                        </span>
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Online
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                            <FileText className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-[#0F172A]">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex flex-col max-w-[80%] ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}>
                                <span className="text-[10px] text-slate-400 mb-1 px-1 flex items-center gap-1">
                                    {msg.isAi && <Bot className="w-3 h-3 text-indigo-500" />} {msg.sender}
                                </span>
                                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                    msg.sender === 'You' 
                                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                                    : msg.isAi 
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 text-slate-800 dark:text-slate-100 rounded-tl-none'
                                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-tl-none'
                                }`}>
                                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {msg.text}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isAiThinking && (
                        <div className="flex justify-start">
                            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                                <Bot className="w-4 h-4 text-indigo-500" />
                                <span className="text-xs text-indigo-500 font-medium animate-pulse">EngiBot is thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-[#1E293B] border-t border-slate-100 dark:border-slate-800">
                    <div className="relative flex items-center gap-2">
                        <button className="p-3 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <Plus className="w-5 h-5" />
                        </button>
                        <input 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type a message or ask @AI..."
                            className="flex-1 p-3 pl-4 bg-slate-100 dark:bg-slate-900 rounded-full outline-none text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 ring-indigo-500/50 transition-all"
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={!inputText.trim()}
                            className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-[10px] text-center text-slate-400 mt-2">
                        Tip: Mention <span className="font-bold text-indigo-500">@AI</span> to get homework help instantly.
                    </p>
                </div>
            </div>
        </div>
    );
};
