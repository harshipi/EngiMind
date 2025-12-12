
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { generateSubjectTest } from '../services/gemini';
import { QuizQuestion, TestResult, UserSettings } from '../types';
import { Loader2, Award, Search, Sparkles, History } from 'lucide-react';
import { saveTestResult, getTestResults } from '../services/storage';

interface TestCenterProps {
    settings: UserSettings;
}

export const TestCenter: React.FC<TestCenterProps> = ({ settings }) => {
    const [view, setView] = useState<'menu' | 'loading' | 'quiz' | 'result'>('menu');
    const [subject, setSubject] = useState('');
    const [customTopic, setCustomTopic] = useState('');
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [answers, setAnswers] = useState<number[]>([]);
    const [score, setScore] = useState(0);
    const [history] = useState<TestResult[]>(getTestResults());

    const popularSubjects = ['Digital Electronics', 'Data Structures', 'Circuit Theory', 'Signals & Systems', 'Database Mgmt', 'Computer Networks'];

    const startTest = async (subj: string) => {
        if (!subj.trim()) return;
        setSubject(subj);
        setView('loading');
        try {
            const qs = await generateSubjectTest(subj);
            setQuestions(qs);
            setAnswers(new Array(qs.length).fill(-1));
            setView('quiz');
        } catch (e) {
            alert("Failed to generate test. Try again.");
            setView('menu');
        }
    };

    const submitTest = () => {
        let s = 0;
        questions.forEach((q, i) => { if (answers[i] === q.correctAnswerIndex) s++; });
        setScore(s);
        saveTestResult({ id: crypto.randomUUID(), subject, score: s, total: questions.length, date: Date.now() });
        setView('result');
    };

    return (
        <div className="max-w-5xl mx-auto p-6 lg:p-12 animate-slide-in pb-32">
            {view === 'menu' && (
                <>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                        <div>
                            <h1 className="text-4xl font-bold mb-3 tracking-tight text-slate-900 dark:text-white">Test Center</h1>
                            <p className="text-lg text-slate-500 font-normal">Challenge yourself. Master your subjects.</p>
                        </div>
                        {history.length > 0 && (
                            <div className="bg-white dark:bg-[#1C1C1E] px-6 py-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                                <div className="text-right">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Avg Performance</span>
                                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 leading-none">
                                        {Math.round(history.reduce((a,b) => a + (b.score/b.total), 0)/history.length * 100)}%
                                    </div>
                                </div>
                                <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
                                    <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Search Section */}
                    <div className="ios-card p-10 mb-12 bg-gradient-to-br from-[#4F46E5] to-[#4338ca] text-white shadow-2xl shadow-indigo-600/20 dark:shadow-none relative overflow-hidden">
                         {/* Abstract Shape */}
                         <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                         <div className="flex items-center gap-3 mb-6 opacity-90 relative z-10">
                            <Sparkles className="w-5 h-5" />
                            <span className="text-sm font-bold uppercase tracking-widest">AI Exam Generator</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-8 relative z-10 tracking-tight">What do you want to test?</h2>
                        <div className="relative max-w-2xl z-10">
                            <input 
                                value={customTopic}
                                onChange={(e) => setCustomTopic(e.target.value)}
                                placeholder="e.g. Thermodynamics, React Hooks, VLSI Design..."
                                className="w-full p-5 pl-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white placeholder-indigo-200/70 outline-none focus:bg-white/20 transition-all text-lg font-medium"
                                onKeyDown={(e) => e.key === 'Enter' && startTest(customTopic)}
                            />
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-indigo-200" />
                            <button 
                                onClick={() => startTest(customTopic)}
                                disabled={!customTopic.trim()}
                                className="absolute right-3 top-2 bottom-2 px-6 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                Start Exam
                            </button>
                        </div>
                    </div>
                    
                    {/* Popular Topics */}
                    <div className="mb-16">
                        <h3 className="font-semibold text-xl mb-6 text-slate-900 dark:text-white tracking-tight">Popular Engineering Subjects</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {popularSubjects.map(sub => (
                                <button 
                                    key={sub}
                                    onClick={() => startTest(sub)}
                                    className="p-5 bg-white dark:bg-[#1C1C1E] border border-slate-100 dark:border-slate-800 rounded-2xl text-left text-sm font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm hover:shadow-md"
                                >
                                    {sub}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* History */}
                    {history.length > 0 && (
                        <div>
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <History className="w-5 h-5 text-slate-400" />
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Recent Results</h3>
                            </div>
                            <div className="space-y-4">
                                {history.slice(0, 5).map(h => (
                                    <div key={h.id} className="bg-white dark:bg-[#1C1C1E] p-5 rounded-2xl flex justify-between items-center border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-white text-lg">{h.subject}</p>
                                            <p className="text-sm text-slate-500 mt-1">{new Date(h.date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-24 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${h.score/h.total > 0.7 ? 'bg-green-500' : 'bg-red-500'}`} 
                                                    style={{ width: `${(h.score/h.total)*100}%` }}
                                                />
                                            </div>
                                            <span className={`text-sm font-bold w-12 text-right ${h.score/h.total > 0.7 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {h.score}/{h.total}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Loading View */}
            {view === 'loading' && (
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                        <Loader2 className="w-16 h-16 animate-spin text-indigo-600 relative z-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-8 mb-2">Generating Exam...</h3>
                    <p className="text-slate-500 text-lg">Crafting challenging questions for "{subject}"</p>
                </div>
            )}

            {/* Quiz View */}
            {view === 'quiz' && (
                <div className="space-y-8 max-w-3xl mx-auto">
                    <div className="flex justify-between items-center bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 sticky top-24 z-20">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{subject}</h2>
                            <p className="text-sm font-medium text-slate-500">AI Generated Exam</p>
                        </div>
                        <div className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-mono font-bold text-slate-600 dark:text-slate-300">
                            {answers.filter(a => a !== -1).length} / {questions.length}
                        </div>
                    </div>
                    
                    {questions.map((q, idx) => (
                        <div key={idx} className="ios-card p-8 dark:bg-[#1C1C1E]">
                            <div className="flex gap-5 mb-6">
                                <span className="flex-shrink-0 w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-sm">
                                    {idx + 1}
                                </span>
                                <div className="font-medium text-xl text-slate-900 dark:text-white leading-relaxed pt-1 flex-1">
                                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {q.question}
                                    </ReactMarkdown>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3 pl-14">
                                {q.options.map((opt, optIdx) => (
                                    <button
                                        key={optIdx}
                                        onClick={() => {
                                            const newAns = [...answers];
                                            newAns[idx] = optIdx;
                                            setAnswers(newAns);
                                        }}
                                        className={`text-left p-5 rounded-xl text-base transition-all border font-medium ${
                                            answers[idx] === optIdx 
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-none transform scale-[1.01]' 
                                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                                                answers[idx] === optIdx ? 'border-white' : 'border-slate-300 dark:border-slate-600'
                                            }`}>
                                                {answers[idx] === optIdx && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                            </div>
                                            <div className="flex-1">
                                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                    {opt}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                    
                    <div className="pt-8 pb-12">
                        <button 
                            onClick={submitTest}
                            disabled={answers.includes(-1)}
                            className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none transition-all transform hover:-translate-y-1"
                        >
                            Submit Test
                        </button>
                    </div>
                </div>
            )}

            {/* Result View */}
            {view === 'result' && (
                <div className="text-center py-16 animate-scale-in max-w-3xl mx-auto">
                    <div className="w-32 h-32 bg-yellow-50 dark:bg-yellow-900/10 rounded-full flex items-center justify-center mx-auto mb-8">
                        <Award className="w-16 h-16 text-yellow-500 dark:text-yellow-400" />
                    </div>
                    <h2 className="text-4xl font-bold mb-3 text-slate-900 dark:text-white tracking-tight">Exam Completed</h2>
                    <p className="text-xl text-slate-500 mb-10">{subject}</p>
                    
                    <div className="text-8xl font-black mb-12 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 pb-4 tracking-tight">
                        {Math.round(score/questions.length*100)}%
                    </div>
                    
                    <div className="grid gap-6 text-left mb-16">
                        {questions.map((q, i) => (
                            <div key={i} className={`p-6 rounded-2xl border ${answers[i] === q.correctAnswerIndex ? 'border-green-200 bg-green-50/50 dark:bg-green-900/10 dark:border-green-800' : 'border-red-200 bg-red-50/50 dark:bg-red-900/10 dark:border-red-800'}`}>
                                <div className="flex gap-2 mb-3">
                                     <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${answers[i] === q.correctAnswerIndex ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                        {answers[i] === q.correctAnswerIndex ? 'Correct' : 'Incorrect'}
                                     </span>
                                </div>
                                <div className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">
                                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {q.question}
                                    </ReactMarkdown>
                                </div>
                                <div className="space-y-2 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                                    <div className="text-green-700 dark:text-green-400 font-medium text-sm flex gap-2">
                                        <span>✓</span>
                                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                            {q.options[q.correctAnswerIndex]}
                                        </ReactMarkdown>
                                    </div>
                                    {answers[i] !== q.correctAnswerIndex && (
                                        <div className="text-red-600 dark:text-red-400 text-sm flex gap-2">
                                            <span>✗ Your answer:</span>
                                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                {q.options[answers[i]]}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => { setView('menu'); setSubject(''); setCustomTopic(''); }} className="px-10 py-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl">
                        Take Another Test
                    </button>
                </div>
            )}
        </div>
    );
};
