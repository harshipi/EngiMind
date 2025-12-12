
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { generateActivityPlan } from '../services/gemini';
import { Music, Activity, Palette, Camera, Loader2 } from 'lucide-react';

export const ActivityCenter: React.FC = () => {
    const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
    const [plan, setPlan] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const categories = [
        { name: 'Music & Singing', icon: Music, color: 'text-pink-500', bg: 'bg-pink-50' },
        { name: 'Dance & Fitness', icon: Activity, color: 'text-orange-500', bg: 'bg-orange-50' },
        { name: 'Digital Art', icon: Palette, color: 'text-blue-500', bg: 'bg-blue-50' },
        { name: 'Photography', icon: Camera, color: 'text-green-500', bg: 'bg-green-50' },
    ];

    const handleSelect = async (activity: string) => {
        setSelectedActivity(activity);
        setLoading(true);
        try {
            const res = await generateActivityPlan(activity);
            setPlan(res);
        } catch (e) { alert("Failed to generate plan"); setSelectedActivity(null); }
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 pb-24 animate-slide-in">
            <h1 className="text-3xl font-bold mb-2">Life Beyond Study</h1>
            <p className="text-gray-500 mb-8">Develop new skills and hobbies with structured AI coaching.</p>

            {!selectedActivity && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map((cat) => (
                        <button 
                            key={cat.name}
                            onClick={() => handleSelect(cat.name)}
                            className="ios-card p-6 flex items-center gap-4 hover:scale-[1.02] transition-transform dark:bg-[#1C1C1E]"
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${cat.bg} dark:bg-opacity-20`}>
                                <cat.icon className={`w-6 h-6 ${cat.color}`} />
                            </div>
                            <span className="text-lg font-bold">{cat.name}</span>
                        </button>
                    ))}
                    <div className="col-span-1 md:col-span-2 mt-4">
                        <p className="text-sm font-bold text-gray-400 uppercase mb-2">Or type your own</p>
                        <input 
                            placeholder="e.g. Chess, Public Speaking, Cooking..."
                            className="w-full p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] shadow-sm outline-none focus:ring-2 ring-blue-500"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSelect(e.currentTarget.value);
                            }}
                        />
                    </div>
                </div>
            )}

            {loading && (
                <div className="text-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-gray-400" />
                    <p>Curating your lesson plan...</p>
                </div>
            )}

            {plan && !loading && (
                <div className="animate-fade-in">
                    <button onClick={() => { setSelectedActivity(null); setPlan(null); }} className="mb-4 text-sm font-bold text-gray-400 uppercase">Back to activities</button>
                    <div className="ios-card p-8 dark:bg-[#1C1C1E]">
                        <h2 className="text-2xl font-bold mb-6 text-black dark:text-white">{selectedActivity} Mastery Plan</h2>
                        <div className="prose prose-lg dark:prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {plan}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
