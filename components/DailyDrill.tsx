
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { generateDailyDrill } from '../services/gemini';
import { QuizQuestion, UserSettings } from '../types';
import { Loader2, Zap, CheckCircle, XCircle } from 'lucide-react';

export const DailyDrill: React.FC<{ settings: UserSettings }> = ({ settings }) => {
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState<number[]>([]);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        loadDrill();
    }, [settings.major, settings.year, settings.semester]);

    const loadDrill = async () => {
        setLoading(true);
        try {
            const qs = await generateDailyDrill(settings.major, settings.year, settings.semester);
            setQuestions(qs);
            setAnswers(new Array(qs.length).fill(-1));
            setSubmitted(false);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Generating Daily Drill...</h2>
                <p className="text-slate-500 text-center max-w-md">Fetching Past Year Questions (PYQs) for {settings.major} ({settings.year} Year) syllabus.</p>
            </div>
        );
    }

    const score = answers.reduce((acc, ans, idx) => acc + (ans === questions[idx].correctAnswerIndex ? 1 : 0), 0);

    return (
        <div className="max-w-3xl mx-auto p-6 pb-24 animate-slide-in">
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Daily Drill</h1>
                </div>
                <p className="text-slate-500">Practice questions from GATE, IES, and University PYQs for your semester.</p>
            </div>

            {submitted && (
                <div className="mb-8 p-6 bg-indigo-600 rounded-2xl text-white flex justify-between items-center shadow-lg shadow-indigo-200 dark:shadow-none animate-scale-in">
                    <div>
                        <p className="font-bold text-lg">Drill Complete!</p>
                        <p className="text-indigo-100">You scored {score} / {questions.length}</p>
                    </div>
                    <button onClick={loadDrill} className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors">
                        New Set
                    </button>
                </div>
            )}

            <div className="space-y-6">
                {questions.map((q, idx) => (
                    <div key={idx} className="ios-card p-6 dark:bg-[#1E293B]">
                        <div className="font-medium text-lg mb-4 text-slate-900 dark:text-white flex gap-2">
                            <span className="text-indigo-600 font-bold">Q{idx + 1}.</span>
                            <div className="flex-1">
                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                    {q.question}
                                </ReactMarkdown>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {q.options.map((opt, optIdx) => {
                                let btnClass = "w-full text-left p-4 rounded-xl border text-sm transition-all ";
                                const isSelected = answers[idx] === optIdx;
                                const isCorrect = q.correctAnswerIndex === optIdx;

                                if (submitted) {
                                    if (isCorrect) {
                                        // Correct Answer: Green background, dark green text
                                        btnClass += "bg-green-100 border-green-300 text-green-900 dark:bg-green-900/40 dark:border-green-700 dark:text-green-100 font-bold ";
                                    } else if (isSelected) {
                                        // Wrong Selection: Red background, dark red text
                                        btnClass += "bg-red-100 border-red-300 text-red-900 dark:bg-red-900/40 dark:border-red-700 dark:text-red-100 font-medium ";
                                    } else {
                                        // Other Options: Faded
                                        btnClass += "border-slate-200 dark:border-slate-700 opacity-60 text-slate-500 dark:text-slate-400 ";
                                    }
                                } else {
                                    if (isSelected) {
                                        // Selected state before submit
                                        btnClass += "bg-indigo-100 border-indigo-300 text-indigo-900 dark:bg-indigo-900/40 dark:border-indigo-700 dark:text-indigo-100 font-medium ";
                                    } else {
                                        // Default state
                                        btnClass += "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 ";
                                    }
                                }

                                return (
                                    <button
                                        key={optIdx}
                                        disabled={submitted}
                                        onClick={() => {
                                            const newAns = [...answers];
                                            newAns[idx] = optIdx;
                                            setAnswers(newAns);
                                        }}
                                        className={btnClass}
                                    >
                                        <div className="flex justify-between items-center gap-2">
                                            <div className="flex-1">
                                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                    {opt}
                                                </ReactMarkdown>
                                            </div>
                                            {submitted && isCorrect && <CheckCircle className="w-5 h-5 text-green-700 dark:text-green-400 shrink-0" />}
                                            {submitted && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-700 dark:text-red-400 shrink-0" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {!submitted && (
                <button 
                    onClick={() => setSubmitted(true)}
                    disabled={answers.includes(-1)}
                    className="w-full mt-8 bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none transition-all"
                >
                    Submit Answers
                </button>
            )}
        </div>
    );
};
