
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { ArrowLeft, Book, ListChecks, HelpCircle, CheckCircle, Circle, Layers, Video, RotateCw } from 'lucide-react';
import { LearningSession } from '../types';
import { updateSessionProgress } from '../services/storage';

interface OutputDisplayProps {
  session: LearningSession;
  onReset: () => void;
}

export const OutputDisplay: React.FC<OutputDisplayProps> = ({ session, onReset }) => {
  const [activeSection, setActiveSection] = useState<'notes' | 'summary' | 'practice' | 'flashcards' | 'mindmap' | 'videos'>('notes');
  const [localProgress, setLocalProgress] = useState(session.progress);
  const [quizAnswers, setQuizAnswers] = useState<number[]>(new Array(session.content.mcqs?.length || 0).fill(-1));
  const [showScore, setShowScore] = useState(false);
  const [activeFlashcard, setActiveFlashcard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Sync session progress changes to storage
  const updateProgress = (updates: Partial<typeof localProgress>) => {
    const newProgress = { ...localProgress, ...updates };
    setLocalProgress(newProgress);
    updateSessionProgress(session.id, newProgress);
  };

  const handleQuizSubmit = () => {
    if (!session.content.mcqs) return;
    let correctCount = 0;
    session.content.mcqs.forEach((q, idx) => {
        if (quizAnswers[idx] === q.correctAnswerIndex) correctCount++;
    });
    setShowScore(true);
    updateProgress({ quizScore: correctCount, quizTotal: session.content.mcqs.length, practiceCompleted: true });
  };

  // Custom components for consistent, visible styling of markdown
  const markdownComponents = {
      h1: ({node, ...props}: any) => <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mt-8 mb-4 border-b border-slate-200 dark:border-slate-800 pb-2" {...props} />,
      h2: ({node, ...props}: any) => <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mt-6 mb-3" {...props} />,
      h3: ({node, ...props}: any) => <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 mb-2" {...props} />,
      p: ({node, ...props}: any) => <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300 font-normal" {...props} />,
      li: ({node, ...props}: any) => <li className="ml-4 list-disc marker:text-indigo-500 pl-1 mb-2 text-slate-700 dark:text-slate-300" {...props} />,
      strong: ({node, ...props}: any) => <strong className="font-bold text-slate-900 dark:text-white" {...props} />,
      blockquote: ({node, ...props}: any) => <blockquote className="border-l-4 border-indigo-500 pl-4 italic my-4 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 py-2 pr-2 rounded-r" {...props} />,
  };

  return (
    <div className="min-h-screen bg-[#fdfdfd] dark:bg-black pb-32 animate-fade-in-up">
      {/* Sticky Header */}
      <div className="sticky top-16 z-30 bg-[#fdfdfd]/95 dark:bg-black/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 py-3 px-4 md:px-8 transition-all duration-300 w-full">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <button 
                onClick={onReset}
                className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest group px-1"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
            </button>
            
            {/* Scrollable Tabs Container */}
            <div className="w-full md:w-auto overflow-hidden">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0 w-full mask-linear-fade">
                    {[
                        { id: 'notes', label: 'Notes', icon: Book },
                        { id: 'summary', label: 'Summary', icon: ListChecks },
                        { id: 'practice', label: 'Quiz', icon: HelpCircle },
                        { id: 'flashcards', label: 'Flashcards', icon: RotateCw },
                        { id: 'mindmap', label: 'Mind Map', icon: Layers },
                        { id: 'videos', label: 'Videos', icon: Video },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSection(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-300 whitespace-nowrap border ${
                                activeSection === tab.id
                                ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-transparent shadow-md transform scale-105'
                                : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 md:py-12">
        <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
            {activeSection === 'notes' && (
                <div className="animate-fade-in space-y-8">
                    <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-4">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white m-0 tracking-tight">Concise Explanation</h2>
                        <button 
                            onClick={() => updateProgress({ notesRead: !localProgress.notesRead })}
                            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full transition-all ${
                                localProgress.notesRead 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                        >
                            {localProgress.notesRead ? <CheckCircle className="w-4 h-4"/> : <Circle className="w-4 h-4"/>}
                            {localProgress.notesRead ? 'Read' : 'Mark Read'}
                        </button>
                    </div>
                    <ReactMarkdown 
                        className="text-slate-700 dark:text-slate-300 font-light leading-loose"
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={markdownComponents}
                    >
                        {session.content.longNotes || "*No comprehensive notes generated.*"}
                    </ReactMarkdown>
                </div>
            )}
            
            {activeSection === 'summary' && (
                 <div className="animate-fade-in space-y-8">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white pb-4 border-b border-slate-200 dark:border-slate-800 tracking-tight">Exam Cheat Sheet</h2>
                    <div className="bg-white dark:bg-[#1E293B] p-8 border-l-4 border-indigo-600 shadow-sm rounded-r-xl">
                        <ReactMarkdown 
                            className="text-slate-800 dark:text-slate-200 leading-relaxed"
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={markdownComponents}
                        >
                            {session.content.shortNotes || "*No summary notes generated.*"}
                        </ReactMarkdown>
                    </div>
                 </div>
            )}
            
            {activeSection === 'flashcards' && session.content.flashcards && (
                <div className="animate-fade-in flex flex-col items-center justify-center min-h-[500px]">
                     <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 tracking-tight">Study Flashcards</h2>
                     <div 
                        className="relative w-full max-w-xl aspect-[3/2] cursor-pointer perspective-1000"
                        onClick={() => setIsFlipped(!isFlipped)}
                     >
                        <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`} 
                             style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                            
                            {/* Front */}
                            <div className="absolute inset-0 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 backface-hidden"
                                 style={{ backfaceVisibility: 'hidden' }}>
                                <span className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-4">Term</span>
                                <div className="text-2xl md:text-4xl font-bold text-center text-slate-900 dark:text-white">
                                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {session.content.flashcards[activeFlashcard].front}
                                    </ReactMarkdown>
                                </div>
                                <span className="absolute bottom-6 text-xs text-slate-400">Tap to flip</span>
                            </div>

                            {/* Back */}
                            <div className="absolute inset-0 bg-indigo-600 dark:bg-indigo-900 border border-indigo-500 rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 backface-hidden"
                                 style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                                <span className="text-xs font-bold uppercase tracking-widest text-indigo-200 mb-4">Definition</span>
                                <div className="text-xl md:text-2xl font-medium text-center text-white leading-relaxed">
                                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {session.content.flashcards[activeFlashcard].back}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                     </div>
                     
                     <div className="flex gap-4 mt-8">
                        <button 
                            onClick={() => {
                                setIsFlipped(false);
                                setTimeout(() => setActiveFlashcard(prev => Math.max(0, prev - 1)), 200);
                            }}
                            disabled={activeFlashcard === 0}
                            className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 disabled:opacity-50"
                        >
                            <ArrowLeft className="w-5 h-5"/>
                        </button>
                        <span className="flex items-center font-mono font-bold">
                            {activeFlashcard + 1} / {session.content.flashcards.length}
                        </span>
                        <button 
                            onClick={() => {
                                setIsFlipped(false);
                                setTimeout(() => setActiveFlashcard(prev => Math.min(session.content.flashcards!.length - 1, prev + 1)), 200);
                            }}
                            disabled={activeFlashcard === session.content.flashcards.length - 1}
                            className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 disabled:opacity-50"
                        >
                            <ArrowLeft className="w-5 h-5 rotate-180"/>
                        </button>
                     </div>
                </div>
            )}

            {activeSection === 'mindmap' && (
                <div className="animate-fade-in space-y-8">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white pb-4 border-b border-slate-200 dark:border-slate-800 tracking-tight">Concept Mind Map</h2>
                    <div className="bg-slate-50 dark:bg-[#1E293B] p-8 rounded-2xl border border-slate-200 dark:border-slate-700">
                         {/* Simple visualizer for nested lists */}
                         <div className="prose prose-indigo dark:prose-invert max-w-none prose-li:marker:text-indigo-500">
                             <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {session.content.mindMap || "*No mind map generated.*"}
                             </ReactMarkdown>
                         </div>
                    </div>
                </div>
            )}
            
            {activeSection === 'videos' && (
                <div className="animate-fade-in space-y-8">
                     <h2 className="text-3xl font-bold text-slate-900 dark:text-white pb-4 border-b border-slate-200 dark:border-slate-800 tracking-tight">Curated Video Recommendations</h2>
                     {!session.content.videoTopics ? <p>No specific video topics found.</p> : (
                         <div className="grid gap-4">
                             {session.content.videoTopics.map((vid, i) => (
                                 <a 
                                    key={i}
                                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(vid.query)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block p-6 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-md transition-shadow group"
                                 >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center">
                                            <Video className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{vid.title}</h3>
                                            <p className="text-sm text-slate-500">Suggested Search: {vid.source} - {vid.query}</p>
                                        </div>
                                    </div>
                                 </a>
                             ))}
                         </div>
                     )}
                     <div className="mt-8 p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                         <h4 className="font-bold text-indigo-900 dark:text-indigo-200 mb-2">Pro Tip</h4>
                         <p className="text-indigo-800 dark:text-indigo-300 text-sm">
                             We recommend checking MIT OpenCourseWare and Stanford Online for deep dives into these topics.
                         </p>
                     </div>
                </div>
            )}

            {activeSection === 'practice' && (
                 <div className="animate-fade-in space-y-12">
                     {/* Text Questions */}
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 pb-4 border-b border-slate-200 dark:border-slate-800 tracking-tight">Written Questions</h2>
                        <ReactMarkdown 
                            className="text-slate-700 dark:text-slate-300"
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                                ...markdownComponents,
                                h2: ({node, ...props}: any) => <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4 uppercase tracking-wide border-l-4 border-indigo-600 pl-4" {...props} />
                            }}
                        >
                            {session.content.practiceQuestions || "*No practice questions generated.*"}
                        </ReactMarkdown>
                    </div>

                    {/* Interactive Quiz */}
                    {session.content.mcqs && session.content.mcqs.length > 0 && (
                        <div className="mt-12 pt-12 border-t border-slate-200 dark:border-slate-800">
                             <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Interactive Quiz</h2>
                             <div className="space-y-8">
                                {session.content.mcqs.map((q, qIdx) => (
                                    <div key={qIdx} className="bg-white dark:bg-[#1E293B] p-6 shadow-sm border border-slate-100 dark:border-slate-700 rounded-2xl">
                                        <div className="font-medium text-lg mb-4 text-slate-900 dark:text-white flex gap-2">
                                            <span>{qIdx + 1}.</span>
                                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{q.question}</ReactMarkdown>
                                        </div>
                                        <div className="space-y-3">
                                            {q.options.map((opt, optIdx) => {
                                                const isSelected = quizAnswers[qIdx] === optIdx;
                                                const isCorrect = q.correctAnswerIndex === optIdx;
                                                let btnClass = "w-full text-left p-4 rounded-xl border text-sm transition-all ";
                                                
                                                if (showScore) {
                                                    if (isCorrect) btnClass += "bg-green-50 border-green-200 text-green-800 font-medium dark:bg-green-900/30 dark:border-green-800 dark:text-green-400 ";
                                                    else if (isSelected && !isCorrect) btnClass += "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400 ";
                                                    else btnClass += "border-slate-200 dark:border-slate-700 text-slate-500 opacity-60 ";
                                                } else {
                                                    if (isSelected) btnClass += "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 dark:shadow-none ";
                                                    else btnClass += "bg-slate-50 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 ";
                                                }

                                                return (
                                                    <button
                                                        key={optIdx}
                                                        onClick={() => {
                                                            if (showScore) return;
                                                            const newAnswers = [...quizAnswers];
                                                            newAnswers[qIdx] = optIdx;
                                                            setQuizAnswers(newAnswers);
                                                        }}
                                                        disabled={showScore}
                                                        className={btnClass}
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            <span className="inline-block w-6 font-bold opacity-50 mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                                                            <div className="inline-block"><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{opt}</ReactMarkdown></div>
                                                            {showScore && isCorrect && <CheckCircle className="inline w-4 h-4 ml-2 text-green-600"/>}
                                                        </span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                             </div>

                             {!showScore ? (
                                <button 
                                    onClick={handleQuizSubmit}
                                    disabled={quizAnswers.includes(-1)}
                                    className="mt-8 px-8 py-4 bg-indigo-600 text-white text-sm font-bold uppercase tracking-wider rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Submit Answers
                                </button>
                             ) : (
                                <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center animate-fade-in">
                                    <p className="text-slate-600 dark:text-slate-400 text-sm uppercase tracking-widest mb-2">Your Score</p>
                                    <p className="text-5xl font-light text-slate-900 dark:text-white mb-2">
                                        {localProgress.quizScore} <span className="text-slate-300 text-3xl">/ {localProgress.quizTotal}</span>
                                    </p>
                                    <p className="text-slate-500 text-sm">
                                        {(localProgress.quizScore! / localProgress.quizTotal!) >= 0.8 ? "Excellent work!" : "Keep practicing!"}
                                    </p>
                                </div>
                             )}
                        </div>
                    )}
                 </div>
            )}
        </div>
      </div>
    </div>
  );
};
