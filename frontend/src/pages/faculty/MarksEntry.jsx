import React, { useState, useEffect } from 'react';
import {
    Award,
    Upload,
    Save,
    Search,
    TrendingUp,
    Users,
    AlertCircle,
    CheckCircle,
    FileSpreadsheet,
    Sparkles,
    BarChart
} from 'lucide-react';
import academicService from '../../services/academicService';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from 'react-router-dom';

const MarksEntry = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [students, setStudents] = useState([]);
    const [marks, setMarks] = useState({});       // { studentId: marksValue }
    const [apiSubjects, setApiSubjects] = useState([]); // subjects from API with real IDs
    const [filters, setFilters] = useState({
        subjectCode: location.state?.subjectCode || '',
        subjectName: location.state?.subjectName || '',
        section: location.state?.section || '',
        testType: 'IA-1'
    });
    const [maxMarks, setMaxMarks] = useState(50);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [message, setMessage] = useState(null);

    // Load faculty subjects from API on mount
    useEffect(() => {
        const loadSubjects = async () => {
            try {
                const res = await academicService.getFacultySubjects();
                const subs = res.data || [];
                setApiSubjects(subs);
                // Auto-select the first subject if none passed
                if (!filters.subjectCode && subs.length > 0) {
                    setFilters(prev => ({
                        ...prev,
                        subjectCode: subs[0].subjectCode,
                        subjectName: subs[0].subjectName,
                        section: subs[0].section,
                    }));
                }
            } catch (err) {
                console.error('Failed to load subjects:', err);
            }
        };
        loadSubjects();
    }, []);

    useEffect(() => {
        if (filters.subjectCode && filters.section) {
            fetchStudentsAndMarks();
        }
    }, [filters.subjectCode, filters.section, filters.testType]);

    const fetchStudentsAndMarks = async () => {
        setIsLoading(true);
        try {
            const studentRes = await academicService.getStudentsBySubject(filters.subjectCode, filters.section);
            setStudents(studentRes.data || []);

            // Load existing marks for pre-population
            try {
                const marksRes = await academicService.getMarks(filters.subjectCode, filters.testType, filters.section);
                const existingMarks = {};
                (marksRes.data || []).forEach(m => {
                    existingMarks[m.studentId] = m.marks;
                });
                setMarks(existingMarks);
            } catch (_) {
                // Marks may not exist yet — that's fine
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setMessage({ type: 'error', text: 'Failed to load student data' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkChange = (studentId, value) => {
        const val = value === '' ? '' : Math.min(maxMarks, Math.max(0, parseInt(value) || 0));
        setMarks(prev => ({ ...prev, [studentId]: val }));
    };

    const calculateGrade = (score) => {
        if (score === undefined || score === '') return '-';
        const percentage = (score / maxMarks) * 100;
        if (percentage >= 90) return 'S';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B';
        if (percentage >= 60) return 'C';
        if (percentage >= 50) return 'D';
        if (percentage >= 40) return 'E';
        return 'F';
    };

    const handleSave = async () => {
        if (students.length === 0) {
            setMessage({ type: 'error', text: 'No students loaded to save marks for.' });
            return;
        }
        setIsSaving(true);
        try {
            // Build the batch payload — only include students who have marks entered
            const marksData = students
                .filter(s => marks[s._id] !== undefined && marks[s._id] !== '')
                .map(s => ({
                    studentId: s._id,
                    marks: Number(marks[s._id]),
                }));

            if (marksData.length === 0) {
                setMessage({ type: 'error', text: 'Please enter at least one mark before saving.' });
                setIsSaving(false);
                return;
            }

            // Single batch call — POST /api/marks/save
            const res = await academicService.saveMarksBatch(
                filters.subjectCode,
                filters.testType,
                maxMarks,
                marksData
            );

            setMessage({ type: 'success', text: `Marks saved for ${res.data?.count || marksData.length} students!` });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('[MARKS] Save error:', error);
            const msg = error.response?.data?.message || 'Failed to save marks.';
            setMessage({ type: 'error', text: msg });
        } finally {
            setIsSaving(false);
        }
    };

    const runAIAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            const res = await academicService.getMarksAnalysis(filters.subjectCode, filters.testType);
            setAnalysis(res.data);
        } catch (error) {
            console.error('Analysis error:', error);
            setMessage({ type: 'error', text: 'AI analysis failed.' });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleCSVUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const rows = text.split('\n');
            const newMarks = { ...marks };

            // Expected format: USN,Marks
            rows.forEach(row => {
                const [usn, score] = row.split(',').map(s => s.trim());
                const student = students.find(s => s.usn === usn);
                if (student && !isNaN(score)) {
                    newMarks[student._id] = Math.min(maxMarks, parseInt(score));
                }
            });
            setMarks(newMarks);
            setMessage({ type: 'success', text: 'CSV marks imported! Review and save.' });
        };
        reader.readAsText(file);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-indigo-400 font-black text-[10px] uppercase tracking-[0.4em] mb-2 bg-indigo-500/5 px-3 py-1 rounded-lg border border-indigo-500/10 w-fit">
                        <Award size={12} className="animate-pulse" />
                        <span>Institutional Grade Registry</span>
                    </div>
                    <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
                        Neural <span className="text-primary-500 text-shadow-glow">Evaluation</span> Matrix
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 italic">Pedagogical Performance Handshake Node</p>
                </div>

                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer transition-all text-sm font-bold text-white group">
                        <Upload size={18} className="text-primary-400 group-hover:scale-110 transition-transform" />
                        CSV Import
                        <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
                    </label>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || students.length === 0}
                        className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 rounded-xl transition-all text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-primary-500/20"
                    >
                        {isSaving ? <TrendingUp className="animate-spin" size={18} /> : <Save size={18} />}
                        Save Marks
                    </button>
                </div>
            </div>

            {/* Config Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Subject</label>
                    <select
                        value={filters.subjectCode}
                        onChange={(e) => {
                            const sub = apiSubjects.find(s => s.subjectCode === e.target.value);
                            setFilters(prev => ({
                                ...prev,
                                subjectCode: e.target.value,
                                subjectName: sub?.subjectName || '',
                                section: sub?.section || '',
                            }));
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                    >
                        <option value="">— Select Subject —</option>
                        {apiSubjects.map(s => (
                            <option key={s.subjectCode} value={s.subjectCode}>
                                {s.subjectName} ({s.subjectCode})
                            </option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Section</label>
                    <input
                        value={filters.section}
                        readOnly
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-400 outline-none cursor-not-allowed"
                        placeholder="Auto from subject"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Test Type</label>
                    <select
                        value={filters.testType}
                        onChange={(e) => setFilters({ ...filters, testType: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                    >
                        <option value="IA-1">Internal Assessment 1</option>
                        <option value="IA-2">Internal Assessment 2</option>
                        <option value="IA-3">Internal Assessment 3</option>
                        <option value="Final">Final Examination</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Max Marks</label>
                    <input
                        type="number"
                        value={maxMarks}
                        onChange={(e) => setMaxMarks(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                    />
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 ${message.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    }`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span className="font-bold text-sm tracking-tight">{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Students List Table */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                        <div className="p-4 border-b border-white/5 bg-slate-800/20 flex items-center justify-between">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Entry Sheet</h3>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{students.length} Students Listed</span>
                        </div>
                        <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-slate-900 z-10">
                                    <tr className="border-b border-white/5 bg-slate-800/40 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        <th className="px-6 py-4">Student</th>
                                        <th className="px-6 py-4">USN</th>
                                        <th className="px-6 py-4 w-32">Marks</th>
                                        <th className="px-6 py-4">Grade</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center">
                                                <div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                                            </td>
                                        </tr>
                                    ) : students.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center text-slate-500 font-bold uppercase tracking-widest text-xs italic">
                                                No students found for this batch
                                            </td>
                                        </tr>
                                    ) : (
                                        students.map((student) => (
                                            <tr key={student._id} className="hover:bg-slate-800/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-black text-white group-hover:text-primary-400 transition-colors uppercase">{student.name || student.fullName}</p>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs text-slate-400 font-bold">{student.studentId || student.usn}</td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="number"
                                                        value={marks[student._id] ?? ''}
                                                        onChange={(e) => handleMarkChange(student._id, e.target.value)}
                                                        placeholder="0"
                                                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-1.5 text-white font-black focus:border-primary-500/50 outline-none"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black italic ${calculateGrade(marks[student._id]) === 'F' ? 'text-rose-400 bg-rose-500/10' :
                                                        'text-emerald-400 bg-emerald-500/10'
                                                        }`}>
                                                        GRADE: {calculateGrade(marks[student._id])}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Analysis Side Panel */}
                <div className="space-y-6">
                    {/* Stats Overview */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-white uppercase italic tracking-wider flex items-center gap-3">
                                <Sparkles className="text-primary-500" size={20} /> AI Analysis
                            </h3>
                            <button
                                onClick={runAIAnalysis}
                                disabled={isAnalyzing || students.length === 0}
                                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
                            >
                                <BarChart size={16} className={isAnalyzing ? 'animate-pulse' : ''} />
                            </button>
                        </div>

                        {analysis ? (
                            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-slate-950/60 p-5 rounded-[2rem] border border-white/5 shadow-2xl group flex flex-col justify-between">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Scholastic Velocity</p>
                                            <p className="text-4xl font-black text-primary-400 italic leading-none">{analysis.average}<span className="text-sm font-bold text-slate-700 ml-1">/{analysis.maxMarks}</span></p>
                                        </div>
                                        <div className="h-[2px] w-full bg-slate-800 mt-4 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary-500 rounded-full group-hover:w-full transition-all duration-1000" style={{ width: `${(analysis.average / analysis.maxMarks) * 100}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-950/60 p-5 rounded-[2rem] border border-white/5 shadow-2xl flex flex-col justify-between">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Pedagogical Health</p>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full animate-pulse ${parseFloat(analysis.average) > analysis.maxMarks * 0.6 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'}`} />
                                                <p className={`text-sm font-black uppercase italic ${parseFloat(analysis.average) > analysis.maxMarks * 0.6 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                    {parseFloat(analysis.average) > analysis.maxMarks * 0.6 ? 'Stable Sector' : 'Analysis Required'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest mt-4">Synced with Registry</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                                            <CheckCircle size={12} /> Excellence Candidates
                                        </div>
                                        <span className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.2em]">Live Registry</span>
                                    </div>
                                    <div className="space-y-3">
                                        {analysis.topPerformers.map((p, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-slate-900/60 rounded-2xl border border-white/5 hover:border-emerald-500/20 transition-all group overflow-hidden relative">
                                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-emerald-500/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700" />
                                                <div className="flex items-center gap-4 relative z-10">
                                                    <span className="text-[10px] font-black text-slate-600 italic">#{i + 1}</span>
                                                    <span className="text-xs font-black text-white italic uppercase tracking-tight truncate max-w-[120px]">{p.name}</span>
                                                </div>
                                                <span className="text-xs font-black text-emerald-400 italic relative z-10">{p.marks} UNIT</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 px-2 text-rose-400 text-[10px] font-black uppercase tracking-widest">
                                        <AlertCircle size={12} /> Neural Diagnostic Insight
                                    </div>
                                    <div className="p-6 bg-slate-950/40 rounded-[2rem] border border-rose-500/10 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-rose-500 group-hover:rotate-12 transition-transform">
                                            <TrendingUp size={80} />
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-400 leading-relaxed italic uppercase tracking-wide relative z-10">
                                            {analysis.aiInsight}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                                <BarChart size={48} className="text-slate-700" />
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Enter & Save Marks to<br />Generate AI Insights</p>
                            </div>
                        )}
                    </div>

                    {/* Guidelines Card */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 text-center space-y-4">
                        <FileSpreadsheet className="mx-auto text-slate-700" size={32} />
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CSV Format Support</h4>
                        <p className="text-[10px] text-slate-600 font-bold leading-relaxed px-4">
                            Upload a comma-separated file with <span className="text-white">USN, Marks</span> format to instantly bulk import student scores.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarksEntry;
