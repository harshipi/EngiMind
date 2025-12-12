
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { generateCareerAdvice } from '../services/gemini';
import { UserSettings } from '../types';
import { Briefcase, Compass, ArrowRight, Loader2 } from 'lucide-react';

export const CareerHub: React.FC<{ settings: UserSettings }> = ({ settings }) => {
    const [interest, setInterest] = useState('');
    const [advice, setAdvice] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleConsult = async () => {
        if (!interest.trim()) return;
        setLoading(true);
        try {
            const res = await generateCareerAdvice(settings.major, interest);
            setAdvice(res);
        } catch (e) { alert("Error generating advice"); }
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 pb-24 animate-slide-in">
             <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">Career Compass</h1>
                <p className="text-slate-500 dark:text-slate-400">AI-driven guidance for {settings.major} students.</p>
            </div>

            {!advice ? (
                <div className="ios-card p-8 text-center dark:bg-[#1E293B]">
                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600 dark:text-indigo-400">
                        <Compass className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Where do you want to go?</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">Tell us your interests (e.g., "AI in Healthcare", "Embedded Systems", "Web Development") and we'll build a roadmap.</p>
                    
                    <div className="relative max-w-lg mx-auto">
                        <input 
                            value={interest}
                            onChange={(e) => setInterest(e.target.value)}
                            placeholder="I'm interested in..."
                            className="w-full p-4 pl-6 pr-14 rounded-full bg-slate-100 dark:bg-[#0F172A] text-slate-900 dark:text-white outline-none focus:ring-2 ring-indigo-500 transition-all placeholder-slate-400"
                            onKeyDown={(e) => e.key === 'Enter' && handleConsult()}
                        />
                        <button 
                            onClick={handleConsult}
                            disabled={loading}
                            className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-full hover:scale-105 transition-transform shadow-md"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="animate-fade-in">
                    <button onClick={() => setAdvice(null)} className="mb-4 text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 transition-colors">
                        <ArrowRight className="w-4 h-4 rotate-180" /> Ask about something else
                    </button>
                    <div className="ios-card p-8 md:p-12 dark:bg-[#1E293B]">
                        <div className="font-sans">
                            <ReactMarkdown
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                                components={{
                                    h1: ({node, ...props}) => <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8 mt-4 text-slate-900 dark:text-white" {...props} />,
                                    h2: ({node, ...props}) => <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6 mt-10 text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800" {...props} />,
                                    h3: ({node, ...props}) => <h3 className="text-xl font-semibold mb-4 mt-8 text-slate-900 dark:text-white" {...props} />,
                                    p: ({node, ...props}) => <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300 mb-6 font-normal tracking-wide" {...props} />,
                                    ul: ({node, ...props}) => <ul className="list-disc list-outside ml-6 space-y-3 mb-6 text-slate-700 dark:text-slate-300" {...props} />,
                                    ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-6 space-y-3 mb-6 text-slate-700 dark:text-slate-300" {...props} />,
                                    li: ({node, ...props}) => <li className="text-lg leading-relaxed pl-2 marker:text-slate-400" {...props} />,
                                    strong: ({node, ...props}) => <strong className="font-semibold text-slate-900 dark:text-white" {...props} />,
                                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-slate-200 dark:border-slate-700 pl-6 italic text-slate-600 dark:text-slate-400 my-8 py-2" {...props} />,
                                    code: ({node, ...props}) => <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono text-slate-800 dark:text-slate-200" {...props} />,
                                }}
                            >
                                {advice}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
