
import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, Send, Volume2, Loader2, MessageSquare } from 'lucide-react';
import { getSettings, getGrades, getSessions } from '../services/storage';
import { chatWithAgent } from '../services/gemini';

interface VoiceAgentProps {
    isOpen: boolean;
    onClose: () => void;
}

export const VoiceAgent: React.FC<VoiceAgentProps> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [transcript, setTranscript] = useState('');
    
    // Context Gathering
    const getContext = () => {
        const settings = getSettings();
        const grades = getGrades();
        const recent = getSessions().slice(0, 3).map(s => s.topic).join(', ');
        
        return `
            Student Name: ${settings.name}
            Major: ${settings.major}
            Year: ${settings.year}
            Semester: ${settings.semester}
            College: ${settings.college}
            Recent Topics Studied: ${recent}
            Latest Semester GPA: ${grades.length > 0 ? 'Available in records' : 'No data'}
        `;
    };

    const handleSend = async (text: string) => {
        if (!text.trim()) return;
        
        const newMsgs = [...messages, { role: 'user' as const, text }];
        setMessages(newMsgs);
        setTranscript('');
        setIsLoading(true);

        try {
            // Format history for Gemini API
            const history = newMsgs.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
            history.pop(); 
            
            const response = await chatWithAgent(history, text, getContext());
            
            setMessages(prev => [...prev, { role: 'model', text: response }]);
            speak(response);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now." }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Speech to Text
    const startListening = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Speech recognition not supported in this browser. Please type.");
            return;
        }
        
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: any) => {
            const text = event.results[0][0].transcript;
            handleSend(text);
        };
        recognition.start();
    };

    // Text to Speech with Accent Selection
    const speak = (text: string) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Voice Selection Logic
        const voices = window.speechSynthesis.getVoices();
        // Priority: Google UK English Female, or any en-GB voice, or default
        const preferredVoice = voices.find(v => v.name === 'Google UK English Female') || 
                               voices.find(v => v.lang === 'en-GB') ||
                               voices.find(v => v.lang === 'en-US');
                               
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.rate = 1.0; 
        utterance.pitch = 1.05;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    };

    // Preload voices
    useEffect(() => {
        window.speechSynthesis.getVoices();
    }, []);

    useEffect(() => {
        if (!isOpen) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-[#1C1C1E] w-full max-w-md h-[500px] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-in border border-slate-200 dark:border-slate-800">
                
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        <span className="font-bold">EngiMind Assistant</span>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full"><X className="w-5 h-5" /></button>
                </div>

                {/* Chat Area */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 dark:bg-[#0F172A]">
                    {messages.length === 0 && (
                        <div className="text-center text-slate-400 mt-20">
                            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageSquare className="w-8 h-8" />
                            </div>
                            <p>Ask me anything about your studies, grades, or career.</p>
                        </div>
                    )}
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                                m.role === 'user' 
                                ? 'bg-indigo-600 text-white rounded-tr-none' 
                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-tl-none shadow-sm'
                            }`}>
                                {m.text}
                            </div>
                        </div>
                    ))}
                    {isLoading && <div className="flex justify-start"><Loader2 className="w-5 h-5 animate-spin text-indigo-500" /></div>}
                </div>

                {/* Controls */}
                <div className="p-4 bg-white dark:bg-[#1C1C1E] border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                         <button 
                            onClick={startListening}
                            className={`p-3 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
                        >
                            <Mic className="w-5 h-5" />
                        </button>
                        <input 
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend(transcript)}
                            placeholder="Type or speak..."
                            className="flex-1 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none text-slate-900 dark:text-white text-sm"
                        />
                        <button 
                            onClick={() => handleSend(transcript)}
                            className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
