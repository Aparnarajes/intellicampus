import React, { useState } from 'react';
import { Sparkles, Brain, Download, FileText, FileJson, Loader2, Target, CheckCircle2, AlertTriangle, ShieldCheck, Clock, Settings2, BookOpen } from 'lucide-react';
import { subjectsBySemester } from '../../utils/subjectData';
import aiService from '../../services/aiService';
import { useAuth } from '../../hooks/useAuth';
import { useMemo, useEffect } from 'react';

const AdaptivePaper = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [paper, setPaper] = useState(null);
    const [weakTopics, setWeakTopics] = useState('');
    const [syllabusContent, setSyllabusContent] = useState('');
    const [paperType, setPaperType] = useState('university'); // 'university' or 'short'
    const [auditResults, setAuditResults] = useState(null);
    const [isAuditing, setIsAuditing] = useState(false);
    const { user } = useAuth();

    // Determine which subjects to show
    const availableSubjects = useMemo(() => {
        if (user?.handledSubjects && user.handledSubjects.length > 0) {
            return user.handledSubjects.map(s => ({ title: s, code: s.toLowerCase().replace(/\s+/g, '-') }));
        }
        return subjectsBySemester[5] || []; // default to sem 5 if nothing handles
    }, [user]);

    const [settings, setSettings] = useState({
        semester: '5',
        subject: availableSubjects[0]?.title || '',
        subjectCode: availableSubjects[0]?.code || '',
    });

    // Update settings if availableSubjects changes (e.g. after login)
    useEffect(() => {
        if (availableSubjects.length > 0 && !settings.subject) {
            setSettings(prev => ({
                ...prev,
                subject: availableSubjects[0].title,
                subjectCode: availableSubjects[0].code
            }));
        }
    }, [availableSubjects]);

    const handleSemesterChange = (sem) => {
        setSettings({
            ...settings,
            semester: sem.toString(),
            subject: subjectsBySemester[sem][0].title,
            subjectCode: subjectsBySemester[sem][0].code
        });
    };

    const handleSubjectChange = (e) => {
        const sub = availableSubjects.find(s => s.title === e.target.value);
        if (sub) {
            setSettings({
                ...settings,
                subject: sub.title,
                subjectCode: sub.code
            });
        }
    };

    const generateAdaptivePaper = async () => {
        if (!syllabusContent.trim()) {
            alert("Syllabus content is required. Please paste your unit topics or reference text into the 'Syllabus / Reference Content' box to continue.");
            return;
        }

        setIsGenerating(true);
        setPaper(null);
        setAuditResults(null);

        try {
            let prompt = '';
            if (paperType === 'university') {
                prompt = `Task: Generate a university-level adaptive question paper.

Context:
Weak topics: ${weakTopics}
Subject: ${settings.subject}

Rules:
- Use ONLY the provided syllabus content
- Do NOT add external topics
- 70% questions from weak topics
- 30% from remaining syllabus topics
- Difficulty: mostly medium, at least one hard
- No repetition
- Clear academic language
- Cover multiple subtopics

Question pattern:
2 marks → short definition
5 marks → conceptual explanation
10 marks → analytical question

Bloom levels to include:
Remember, Understand, Apply, Analyze

Return ONLY valid JSON array:
[
  {
    "question": "",
    "marks": 0,
    "difficulty": "",
    "topic": "",
    "bloomLevel": ""
  }
]

If syllabus content is insufficient, return:
[]

Syllabus:
${syllabusContent}`;
            } else {
                prompt = `Generate a short adaptive test.

Rules:
- Use only given syllabus
- Focus on weak topics first
- Max 6 questions total
- Mostly medium difficulty
- One hard question
- No repetition
- Assign a Bloom’s Taxonomy level to each question.

Bloom Levels:
- Remember (definition or recall)
- Understand (explanation)
- Apply (use concept)
- Analyze (multi-step reasoning)

Return JSON:
[
  {
    "question": "",
    "marks": 0,
    "difficulty": "",
    "topic": "",
    "bloomLevel": ""
  }
]

Syllabus:
${syllabusContent}`;
            }

            const response = await aiService.chat(prompt, []);
            if (response.success) {
                const jsonMatch = response.message.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    const aiQuestions = JSON.parse(jsonMatch[0]);

                    if (aiQuestions.length === 0) {
                        alert("Syllabus content was insufficient to generate questions.");
                        setIsGenerating(false);
                        return;
                    }

                    const processedQuestions = aiQuestions.map(q => ({
                        text: q.question,
                        marks: q.marks,
                        difficulty: q.difficulty,
                        concept: q.topic,
                        bloomsLevel: q.bloomLevel || 'Apply',
                        estimatedTime: q.marks === 2 ? 4 : q.marks === 5 ? 12 : 25
                    }));

                    const newPaper = {
                        id: Date.now(),
                        title: paperType === 'university' ? `Adaptive Paper: ${settings.subject}` : `Short Test: ${settings.subject}`,
                        subjectCode: settings.subjectCode,
                        semester: settings.semester,
                        type: paperType,
                        questions: processedQuestions,
                        maxMarks: processedQuestions.reduce((sum, q) => sum + q.marks, 0),
                        generatedAt: new Date().toISOString()
                    };

                    setPaper(newPaper);
                }
            }
        } catch (error) {
            console.error("Failed to generate paper:", error);
            alert("Generation failed. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const exportAsText = () => {
        if (!paper) return;
        let text = `${paper.title}\n${'='.repeat(paper.title.length)}\n\n`;
        text += `Semester: ${paper.semester} | Code: ${paper.subjectCode}\n\n`;

        const parts = [
            { label: 'PART A (2 Marks)', marks: 2 },
            { label: 'PART B (5 Marks)', marks: 5 },
            { label: 'PART C (10 Marks)', marks: 10 }
        ];

        parts.forEach(part => {
            const qs = paper.questions.filter(q => q.marks === part.marks);
            if (qs.length > 0) {
                text += `${part.label}\n${'-'.repeat(part.label.length)}\n`;
                qs.forEach((q, i) => {
                    text += `${i + 1}. ${q.text} [${q.marks}M]\n`;
                });
                text += '\n';
            }
        });

        const blob = new Blob([text], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Adaptive_Paper_${paper.subjectCode}.txt`;
        link.click();
    };

    const auditPaper = async () => {
        if (!paper || !syllabusContent) return;

        setIsAuditing(true);
        try {
            const auditPrompt = `Evaluate the question paper using the syllabus.

Metrics:
- relevanceScore (0–5)
- coveragePercentage (0–100)
- difficultyMatch (0–100)
- repetition (true/false)
- hallucinationFlag (true/false)

Rules:
- Compare only with given syllabus
- Detect repeated questions
- Check if difficulty labels match question complexity

Return ONLY JSON:
{
  "relevanceScore": 0,
  "coveragePercentage": 0,
  "difficultyMatch": 0,
  "repetition": false,
  "hallucinationFlag": false
}

Syllabus:
${syllabusContent}

Questions:
${JSON.stringify(paper.questions.map(q => ({ q: q.text, m: q.marks, d: q.difficulty })))}
`;

            const response = await aiService.chat(auditPrompt, []);
            if (response.success) {
                const jsonMatch = response.message.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    setAuditResults(JSON.parse(jsonMatch[0]));
                }
            }
        } catch (error) {
            console.error("Audit failed:", error);
            alert("Audit failed. Please try again.");
        } finally {
            setIsAuditing(false);
        }
    };

    const bloomColors = {
        'Remember': 'bg-blue-50 text-blue-600 border-blue-200',
        'Understand': 'bg-emerald-50 text-emerald-600 border-emerald-200',
        'Apply': 'bg-amber-50 text-amber-600 border-amber-200',
        'Analyze': 'bg-rose-50 text-rose-600 border-rose-200'
    };

    return (
        <div className="min-h-screen bg-[#0f172a] p-4 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                            <Brain className="text-emerald-400" size={32} />
                            Adaptive Paper Generator
                            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-1 rounded border border-emerald-500/20 font-black uppercase tracking-widest ml-2">
                                Faculty Tool
                            </span>
                        </h1>
                        <p className="text-slate-400 mt-1 font-medium">Create university-level papers tailored to student performance</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Settings Section */}
                    <div className="space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                            <div className="flex items-center gap-2 text-white font-bold mb-2">
                                <Settings2 size={20} className="text-emerald-400" />
                                Configuration
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Semester</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[3, 4, 5, 6, 7].map((sem) => (
                                            <button
                                                key={sem}
                                                onClick={() => handleSemesterChange(sem)}
                                                className={`py-2 rounded-xl text-sm font-bold transition-all ${settings.semester == sem
                                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                                    }`}
                                            >
                                                S{sem}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Paper Type</label>
                                    <div className="flex gap-2 p-1 bg-slate-800 rounded-xl">
                                        <button
                                            onClick={() => setPaperType('university')}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${paperType === 'university' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            Full Paper
                                        </button>
                                        <button
                                            onClick={() => setPaperType('short')}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${paperType === 'short' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            Short Test
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Subject</label>
                                    <select
                                        value={settings.subject}
                                        onChange={handleSubjectChange}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500"
                                    >
                                        {availableSubjects.map((sub, idx) => (
                                            <option key={idx} value={sub.title}>{sub.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Target size={14} className="text-rose-400" />
                                        Weak Topics (Adaptive Target)
                                    </label>
                                    <textarea
                                        value={weakTopics}
                                        onChange={(e) => setWeakTopics(e.target.value)}
                                        placeholder="List topics students struggle with (e.g. Backpropagation, Memory Management)..."
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-emerald-500 h-24 resize-none"
                                    />
                                    <p className="text-[10px] text-slate-500">70% of questions will target these topics.</p>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between gap-2 w-full">
                                        <div className="flex items-center gap-2">
                                            <BookOpen size={14} className="text-blue-400" />
                                            Syllabus / Reference Content
                                        </div>
                                        <button
                                            onClick={() => setSyllabusContent("UNIT 1: Principles of Artificial Intelligence\n- Introduction to AI and Intelligent Agents\n- Problem solving by searching: Uninformed and Informed search strategies\n- Adversarial Search: Games, Alpha-Beta Pruning\n- Constraint Satisfaction Problems\n- Logic and Reasoning: Propositional Logic, First-Order Logic\n- Knowledge Representation and Reasoning\n- Quantifying Uncertainty: Probabilistic Reasoning")}
                                            className="text-[9px] bg-slate-800 hover:bg-slate-700 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 transition-all"
                                        >
                                            Load Sample
                                        </button>
                                    </label>
                                    <textarea
                                        value={syllabusContent}
                                        onChange={(e) => setSyllabusContent(e.target.value)}
                                        placeholder="Paste unit topics, syllabus text, or reference chunks here..."
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-[11px] focus:outline-none focus:border-emerald-500 h-40 resize-none font-mono leading-relaxed"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={generateAdaptivePaper}
                                disabled={isGenerating}
                                className={`w-full py-4 rounded-2xl font-black text-white transition-all flex items-center justify-center gap-2 mt-4 ${isGenerating ? 'bg-slate-800 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-500/20'
                                    }`}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 size={24} className="animate-spin" />
                                        <span>AI Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={24} />
                                        <span>Generate Adaptive Paper</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Paper Section */}
                    <div className="lg:col-span-2">
                        {!paper && !isGenerating ? (
                            <div className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-[2rem] p-20 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center">
                                    <Brain size={40} className="text-slate-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">No Paper Generated</h3>
                                    <p className="text-slate-500 max-w-sm mt-1">Configure the settings and paste syllabus content to generate an adaptive question paper.</p>
                                </div>
                            </div>
                        ) : isGenerating ? (
                            <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-20 flex flex-col items-center justify-center space-y-8 min-h-[600px]">
                                <div className="relative">
                                    <div className="w-32 h-32 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-400" size={40} />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-2xl font-bold text-white">AI Engine Working</h3>
                                    <p className="text-slate-400 mt-2">Diving into syllabus content and mapping questions to weak topics...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white text-slate-900 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-500">
                                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                    <div>
                                        <h2 className="font-black text-2xl tracking-tight uppercase">{paper.title}</h2>
                                        <p className="text-sm text-slate-500 font-bold mt-1">
                                            Semester: {paper.semester} • Max Marks: {paper.maxMarks} • {new Date(paper.generatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={auditPaper}
                                            disabled={isAuditing}
                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold transition-all shadow-lg ${isAuditing
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                : 'bg-emerald-600 text-white hover:bg-emerald-500'
                                                }`}
                                        >
                                            {isAuditing ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                                            {isAuditing ? 'Auditing...' : 'Quality Audit'}
                                        </button>
                                        <button onClick={exportAsText} className="p-3 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                                            <FileText size={20} />
                                        </button>
                                        <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg">
                                            <Download size={20} />
                                            Save PDF
                                        </button>
                                    </div>
                                </div>

                                {/* Audit Results Dashboard */}
                                {auditResults && (
                                    <div className="mx-8 mt-4 p-6 bg-slate-950 rounded-3xl border border-white/5 animate-in slide-in-from-top-4 duration-500">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-white font-black flex items-center gap-2 tracking-tight">
                                                <ShieldCheck className="text-emerald-400" size={20} />
                                                QUALITY AUDIT REPORT
                                            </h3>
                                            <button onClick={() => setAuditResults(null)} className="text-[10px] font-black text-slate-500 uppercase hover:text-white transition-colors">Dismiss</button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                    <span>Syllabus Relevance</span>
                                                    <span>{auditResults.relevanceScore}/5</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-emerald-500"
                                                        style={{ width: `${(auditResults.relevanceScore / 5) * 100}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                    <span>Topic Coverage</span>
                                                    <span>{auditResults.coveragePercentage}%</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500"
                                                        style={{ width: `${auditResults.coveragePercentage}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                    <span>Difficulty Accuracy</span>
                                                    <span>{auditResults.difficultyMatch}%</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-purple-500"
                                                        style={{ width: `${auditResults.difficultyMatch}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className={`flex-1 p-3 rounded-2xl border ${auditResults.repetition ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'} flex items-center gap-3`}>
                                                {auditResults.repetition ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60 leading-none">Repetition</span>
                                                    <span className="text-xs font-bold mt-1">{auditResults.repetition ? 'Issues Detected' : 'No Duplicates'}</span>
                                                </div>
                                            </div>

                                            <div className={`flex-1 p-3 rounded-2xl border ${auditResults.hallucinationFlag ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'} flex items-center gap-3`}>
                                                {auditResults.hallucinationFlag ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60 leading-none">Integrity Flag</span>
                                                    <span className="text-xs font-bold mt-1">{auditResults.hallucinationFlag ? 'Verify Content' : 'Syllabus Match'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="p-10 space-y-12 max-w-4xl mx-auto w-full">
                                    {paper.type === 'university' ? (
                                        <>
                                            {/* PART A */}
                                            <section>
                                                <div className="flex justify-between items-end border-b-4 border-slate-900 pb-2 mb-8">
                                                    <h3 className="font-black text-xl uppercase tracking-wider">Part A — Section I</h3>
                                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">[Short Answers]</span>
                                                </div>
                                                <div className="space-y-8">
                                                    {paper.questions.filter(q => q.marks === 2).map((q, i) => (
                                                        <div key={i} className="flex justify-between gap-6 group">
                                                            <div className="space-y-1">
                                                                <p className="font-bold text-lg leading-relaxed flex gap-4">
                                                                    <span className="text-slate-300 font-black">{i + 1}.</span>
                                                                    {q.text}
                                                                </p>
                                                                <div className="flex gap-2 ml-8">
                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${bloomColors[q.bloomsLevel] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                                        {q.bloomsLevel}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <span className="font-black text-lg text-slate-900 shrink-0">[2]</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>

                                            {/* PART B */}
                                            <section>
                                                <div className="flex justify-between items-end border-b-4 border-slate-900 pb-2 mb-8">
                                                    <h3 className="font-black text-xl uppercase tracking-wider">Part B — Section II</h3>
                                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">[Conceptual]</span>
                                                </div>
                                                <div className="space-y-10">
                                                    {paper.questions.filter(q => q.marks === 5).map((q, i) => (
                                                        <div key={i} className="flex justify-between gap-6">
                                                            <div className="space-y-1">
                                                                <p className="font-bold text-lg leading-relaxed flex gap-4">
                                                                    <span className="text-slate-300 font-black">{paper.questions.filter(qu => qu.marks === 2).length + i + 1}.</span>
                                                                    {q.text}
                                                                </p>
                                                                <div className="flex gap-2 ml-8">
                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${bloomColors[q.bloomsLevel] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                                        {q.bloomsLevel}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <span className="font-black text-lg text-slate-900 shrink-0">[5]</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>

                                            {/* PART C */}
                                            <section>
                                                <div className="flex justify-between items-end border-b-4 border-slate-900 pb-2 mb-8">
                                                    <h3 className="font-black text-xl uppercase tracking-wider">Part C — Section III</h3>
                                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">[Analytical]</span>
                                                </div>
                                                <div className="space-y-12">
                                                    {paper.questions.filter(q => q.marks === 10).map((q, i) => (
                                                        <div key={i} className="flex justify-between gap-6">
                                                            <div className="space-y-1">
                                                                <p className="font-bold text-lg leading-relaxed flex gap-4">
                                                                    <span className="text-slate-300 font-black">{paper.questions.filter(qu => qu.marks < 10).length + i + 1}.</span>
                                                                    {q.text}
                                                                </p>
                                                                <div className="flex gap-2 ml-8">
                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${bloomColors[q.bloomsLevel] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                                        {q.bloomsLevel}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <span className="font-black text-lg text-slate-900 shrink-0">[10]</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        </>
                                    ) : (
                                        <section>
                                            <div className="border-b-4 border-slate-900 pb-2 mb-8">
                                                <h3 className="font-black text-xl uppercase tracking-wider">Adaptive Diagnostics Test</h3>
                                            </div>
                                            <div className="space-y-10">
                                                {paper.questions.map((q, i) => (
                                                    <div key={i} className="flex justify-between gap-6">
                                                        <div className="space-y-1">
                                                            <p className="font-bold text-lg leading-relaxed flex gap-4">
                                                                <span className="text-slate-300 font-black">{i + 1}.</span>
                                                                {q.text}
                                                            </p>
                                                            <div className="flex gap-2 ml-8">
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${bloomColors[q.bloomsLevel] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                                    {q.bloomsLevel}
                                                                </span>
                                                                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-400 font-bold uppercase tracking-widest border border-slate-200">
                                                                    {q.difficulty}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span className="font-black text-lg text-slate-900 shrink-0">[{q.marks}]</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    <div className="pt-12 text-center border-t border-slate-100">
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">--- End of Question Paper ---</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdaptivePaper;
