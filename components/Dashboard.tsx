
import React, { useState, useEffect } from 'react';
import { getSessions, deleteSession } from '../services/storage';
import { LearningSession } from '../types';
import { BookOpen, CheckCircle, Clock, Trash2, Trophy, ArrowRight } from 'lucide-react';

interface DashboardProps {
  onSelectSession: (session: LearningSession) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectSession }) => {
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    setSessions(getSessions());
  }, [trigger]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this study session?')) {
        deleteSession(id);
        setTrigger(t => t + 1);
    }
  };

  const totalSessions = sessions.length;
  const notesRead = sessions.filter(s => s.progress.notesRead).length;
  const quizzesTaken = sessions.filter(s => s.progress.quizScore !== undefined).length;
  const avgScore = quizzesTaken > 0 
    ? Math.round(sessions.reduce((acc, s) => acc + (s.progress.quizScore || 0), 0) / sessions.reduce((acc, s) => acc + (s.progress.quizTotal || 0), 0) * 100)
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
            <h1 className="text-4xl font-light text-slate-900 dark:text-white">Your Progress</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[
                { label: 'Total Topics', value: totalSessions, icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
                { label: 'Notes Read', value: notesRead, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
                { label: 'Quizzes Taken', value: quizzesTaken, icon: Trophy, color: 'bg-amber-50 text-amber-600' },
                { label: 'Avg. Score', value: `${avgScore}%`, icon: Trophy, color: 'bg-purple-50 text-purple-600' },
            ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-[#1E293B] p-6 border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${stat.color} dark:bg-opacity-20`}>
                        <stat.icon className="w-5 h-5" />
                    </div>
                    <p className="text-3xl font-light text-slate-900 dark:text-white mb-1">{stat.value}</p>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
                </div>
            ))}
        </div>

        <h2 className="text-xl font-medium text-slate-900 dark:text-white mb-6 uppercase tracking-wide border-b border-slate-100 dark:border-slate-800 pb-4 mt-12">Recent Sessions</h2>
        
        {sessions.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No study sessions yet. Start by generating notes!</p>
            </div>
        ) : (
            <div className="grid gap-4">
                {sessions.map((session) => (
                    <div 
                        key={session.id}
                        onClick={() => onSelectSession(session)}
                        className="group bg-white dark:bg-[#1E293B] p-6 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-100 dark:hover:shadow-none transition-all cursor-pointer flex justify-between items-center"
                    >
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm ${
                                    session.type === 'files' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 
                                    session.type === 'mixed' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                    {session.type === 'files' ? 'Files' : session.type === 'mixed' ? 'Mixed' : 'Text'}
                                </span>
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(session.timestamp).toLocaleDateString()}
                                </span>
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors mb-1">
                                {session.topic.length > 60 ? session.topic.substring(0, 60) + '...' : session.topic}
                            </h3>
                            <div className="flex gap-4 text-xs text-slate-400 mt-2">
                                <span className={session.progress.notesRead ? 'text-green-600 font-medium' : ''}>
                                    {session.progress.notesRead ? '✓ Notes Read' : '• Notes Unread'}
                                </span>
                                <span className={session.progress.quizScore !== undefined ? 'text-amber-600 font-medium' : ''}>
                                    {session.progress.quizScore !== undefined ? `✓ Score: ${session.progress.quizScore}/${session.progress.quizTotal}` : '• Quiz Untaken'}
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                                onClick={(e) => handleDelete(e, session.id)}
                                className="p-2 text-slate-300 hover:text-red-600 transition-colors"
                                title="Delete Session"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <ArrowRight className="w-5 h-5 text-indigo-600 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};
