import React, { useState, useEffect } from 'react';
import {
    Award,
    ChevronRight,
    BookOpen,
    Calendar,
    TrendingUp,
    CheckCircle,
    Info
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const MarksView = () => {
    const { user } = useAuth();
    const [marks, setMarks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchMyMarks();
    }, []);

    const fetchMyMarks = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/marks/my-marks');
            setMarks(res.data.data);
        } catch (error) {
            console.error('Error fetching marks:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getGradeColor = (marks, maxMarks) => {
        const percentage = (marks / maxMarks) * 100;
        if (percentage >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
        if (percentage >= 60) return 'text-primary-400 bg-primary-500/10 border-primary-500/20';
        if (percentage >= 40) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Award size={160} className="text-primary-500" />
                </div>

                <div className="relative z-10 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-400 text-[10px] font-black uppercase tracking-widest">
                        Academic Transcript
                    </div>
                    <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none">
                        My Assessment <span className="text-primary-500">Record</span>
                    </h1>
                    <p className="text-slate-400 font-medium max-w-xl">
                        View your internal assessment performance across all subjects. Grades are automatically calculated based on your scores.
                    </p>
                </div>
            </div>

            {marks.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center space-y-6 shadow-xl">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-600">
                        <Info size={40} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">No Marks Found</h3>
                        <p className="text-slate-500 max-w-xs mx-auto text-sm font-medium">
                            Internal marks haven't been uploaded by your faculty yet. Check back later!
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {marks.map((entry) => (
                        <div key={entry._id} className="group bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-primary-500/50 transition-all duration-300 shadow-xl overflow-hidden relative">
                            {/* Decorative background number */}
                            <div className="absolute -bottom-4 -right-4 text-8xl font-black text-white/[0.02] italic select-none group-hover:text-primary-500/[0.05] transition-colors">
                                {entry.grade}
                            </div>

                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <BookOpen size={14} className="text-primary-400" />
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{entry.subject}</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tight italic group-hover:text-primary-400 transition-colors">
                                        {entry.testType}
                                    </h3>
                                </div>
                                <div className={`px-4 py-2 border rounded-2xl font-black text-xl italic ${getGradeColor(entry.marks, entry.maxMarks)}`}>
                                    {entry.grade}
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Score Tracker */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        <span>Performance Score</span>
                                        <span>{entry.marks} / {entry.maxMarks}</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5 p-[1px]">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary-600 to-blue-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_#0ea5e966]"
                                            style={{ width: `${(entry.marks / entry.maxMarks) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                                            <Calendar size={14} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em]">Updated By</span>
                                            <span className="text-xs font-bold text-slate-300">{entry.faculty?.name}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-emerald-400">
                                        <CheckCircle size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MarksView;
