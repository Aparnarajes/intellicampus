import React, { useState, useEffect } from 'react';
import {
  BookOpen, Sparkles, FileDown, Settings2, HelpCircle, Layout,
  ChevronRight, Loader2, Brain, Clock, Target, History, Share2,
  BarChart3, Download, FileText, FileJson, Lightbulb, CheckCircle2,
  TrendingUp, Zap, Languages, Book
} from 'lucide-react';
import { subjectsBySemester } from '../../utils/subjectData';
import { questionBank } from '../../utils/questionBank';
import aiService from '../../services/aiService';
import api from '../../services/api';
import MockTest from '../../components/ai/MockTest';

const NotesView = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [notes, setNotes] = useState(null);
  const [notesHistory, setNotesHistory] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSavedNotes, setShowSavedNotes] = useState(false);
  const [libraryData, setLibraryData] = useState([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingMockTest, setIsGeneratingMockTest] = useState(false);
  const [mockTest, setMockTest] = useState(null);
  const [showMockTest, setShowMockTest] = useState(false);
  const [syllabusContent, setSyllabusContent] = useState('');
  const [settings, setSettings] = useState({
    semester: '5',
    subject: subjectsBySemester[5][0].title,
    subjectCode: subjectsBySemester[5][0].code,
    unit: 'Unit 1',
    noteType: 'Detailed', // Detailed, Summary, Key Points, Q&A Style
    depth: 'Intermediate', // Basic, Intermediate, Advanced
    includeExamples: true,
    includeDiagramDescriptions: true
  });

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('notesHistory');
    if (savedHistory) {
      setNotesHistory(JSON.parse(savedHistory));
    }
  }, []);

  const handleSemesterChange = (sem) => {
    const firstSubject = subjectsBySemester[sem][0];
    setSettings({
      ...settings,
      semester: sem,
      subject: firstSubject.title,
      subjectCode: firstSubject.code
    });
  };

  const handleSubjectChange = (e) => {
    const selectedTitle = e.target.value;
    const selectedSubject = subjectsBySemester[settings.semester].find(s => s.title === selectedTitle);
    setSettings({
      ...settings,
      subject: selectedSubject.title,
      subjectCode: selectedSubject.code
    });
  };

  const generateNotes = async () => {
    if (settings.noteType === 'Exam Revision' && !syllabusContent.trim()) {
      alert("Please paste syllabus content (retrieved chunks) to use the Ultra-Condensed Revision mode.");
      return;
    }

    setIsGenerating(true);
    setNotes(null);

    const subjectData = questionBank[settings.subjectCode] || questionBank['DEFAULT'];
    const concepts = subjectData[settings.unit] || subjectData['Unit 1'] || ['Core Concepts'];
    const category = subjectData.category || 'DEFAULT';

    // Advanced prompt engineering for high-quality engineering notes
    let prompt = '';

    if (settings.noteType === 'Exam Revision') {
      prompt = `Task: Generate exam revision notes.

Source rule:
Use ONLY the syllabus content provided below.
Do NOT add external knowledge or information not present in the provided text.
If the provided content is insufficient to generate notes, return exactly: { "notes": [] }

Output rules:
- Bullet points only (no nested lists)
- Max 12 bullets total for the entire response
- Max 15 words per bullet point
- One concept or fact per bullet
- No headings, no subheadings, no titles
- No explanations, no descriptions, no fluff
- No examples or case studies
- No repetition of facts
- Maintain all technical terms and specific keywords

Focus Areas:
- Formal definitions
- Key architectural concepts
- Mathematical formulas (exactly as provided)
- Vital sequential steps
- High-priority keywords used in exams

Return ONLY valid JSON and nothing else:
{ "notes": [] }

Syllabus Content (Source):
${syllabusContent}`;
    } else {
      let typeSpecificInstructions = '';
      switch (settings.noteType) {
        case 'Detailed':
          typeSpecificInstructions = 'Provide an exhaustive academic breakdown. Each concept must have a detailed definition, deep technical explanation, secondary sub-topics, and logical derivations. Aim for a high word count per section to ensure no detail is missed.';
          break;
        case 'Summary':
          typeSpecificInstructions = 'Focus on the absolute essence. Provide a high-level architectural overview, the single most important "main takeaway," and an executive summary. Strictly eliminate all minor details, examples, and secondary explanations. Target a word count that is 30% of a standard detailed note.';
          break;
        case 'Key Points':
          typeSpecificInstructions = 'Generate a highly structured, hierarchical list of bullet points. Every entry MUST start with a **Bolded Technical Term**. Prioritize critical definitions, core principles, and mathematical formulas (placed in clear markdown blocks). Focus on high-yield facts that typically appear in university examinations. Avoid long paragraphs; keep each point impactful and easy to scan.';
          break;
        case 'Q&A Style':
          typeSpecificInstructions = 'Generate an "Exam Question Set" featuring a mix of Short Answer (2 Marks), Conceptual (5 Marks), and Analytical (10 Marks) questions. Each question MUST be followed by a structured "Model Answer" that includes: 1. Core Definition, 2. Key Points, and 3. Logical Conclusion/Diagram Description. Mimic the scoring schemes used by major technical universities.';
          break;
        default:
          typeSpecificInstructions = 'Provide a comprehensive academic breakdown with detailed sections, sub-sections, deep explanations, and step-by-step logic.';
      }

      if (settings.noteType === 'Q&A Style') {
        prompt = `Act as an expert Engineering University Examiner. Create a "Model Question & Answer Set" for the subject "${settings.subject}" (${settings.subjectCode}), specifically for "${settings.unit}".

        Structural Requirement: ${typeSpecificInstructions}

        Formatting Rules:
        - Use "Q1. [Question] ([Marks])" for questions.
        - Use "A1. [Answer]" for answers.
        - Bold all technical keywords.
        - Use clear Markdown for formulas and code.
        - Separate each Q&A pair with a horizontal rule (---).

        Academic Depth: ${settings.depth} Engineering Undergraduate.
        Core Topics to Cover: ${concepts.join(', ')}.
        
        Source Foundation:
        ${syllabusContent ? `HEAVILY PRIORITIZE AND USE THIS TEXT FOR ALL QUESTIONS: ${syllabusContent}` : 'Use standard engineering curricula.'}

        Tone: Official, Rigorous, and Formally Structured.`;
      } else {
        prompt = `Act as an expert Engineering Professor. Generate highly accurate, technical, and exhaustive ${settings.noteType} for "${settings.subject}" (${settings.subjectCode}), focusing on "${settings.unit}".

        Academic Depth: ${settings.depth} Engineering Undergraduate level.
        Core Topics to Expand: ${concepts.join(', ')}.
        
        Structural Requirement: ${typeSpecificInstructions}

        Instructions for Accuracy and Quality:
        1. ${category === 'MATH' ? 'Include formal definitions, theorems, mathematical proofs, and rigorous step-by-step derivations.' : ''}
        2. ${category === 'CODE' ? 'Include clean, optimized code snippets with Big-O complexity analysis and logic flow.' : ''}
        3. ${category === 'AI' ? 'Detail mathematical models (functions, gradients), architectural layers, and performance metrics.' : ''}
        4. ${category === 'SYSTEM' ? 'Specify architecture diagrams, protocols, and hardware/software interface details.' : ''}
        5. ${settings.includeExamples ? 'Integrate real-world engineering instances or case studies to illustrate concepts.' : ''}
        6. ${settings.includeDiagramDescriptions ? 'Add a "Schema/Visual Guide" for each major topic describing the exact technical diagram that should accompany this text.' : ''}
        7. Incorporate a "Common Exam Pitfalls" or "Assessor\'s Note" for each topic.
        8. If "Detailed" is selected, ensure each paragraph is substantial and covers underlying principles, not just surface-level facts.
        
        Source Authority: 
        ${syllabusContent ? `USE THE FOLLOWING SYLLABUS TEXT AS THE FOUNDATION: ${syllabusContent}. EXPAND UPON THESE TOPICS WITH EXPERT EXPLANATIONS.` : 'Use standard engineering literature and academic textbooks for these concepts.'}

        Tone: Rigorous, Professional, and Scholarly.
        Formatting: Enhanced Markdown (#, ##, ###, **, formatted blocks).`;
      }
    }

    try {
      const response = await aiService.generateNotes({
        subjectCode: settings.subjectCode,
        unit: settings.unit,
        prompt
      });
      if (response.success) {
        // Gateway wraps payload under response.data: { result, fromCache, cacheMetadata }
        let finalContent = response.data?.result;

        // If Revision Notes, extract and format the JSON
        if (settings.noteType === 'Exam Revision') {
          const jsonMatch = (finalContent || '').match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const data = JSON.parse(jsonMatch[0]);
              finalContent = data.notes.map((note, i) => `${i + 1}. ${note}`).join('\n');
            } catch (e) {
              console.error("JSON parse error for revision notes", e);
            }
          }
        }

        if (!finalContent || finalContent.trim() === '') {
          throw new Error('The AI returned an empty response. Please try again.');
        }

        const newNotes = {
          id: Date.now(),
          title: `${settings.subject} - ${settings.unit}`,
          subjectCode: settings.subjectCode,
          semester: settings.semester,
          unit: settings.unit,
          content: finalContent,
          type: settings.noteType,
          depth: settings.depth,
          generatedAt: new Date().toISOString(),
          analytics: {
            wordCount: (finalContent || '').split(/\s+/).length,
            conceptCount: concepts.length,
            readingTime: Math.ceil((finalContent || '').split(/\s+/).length / 200)
          }
        };

        setNotes(newNotes);
        const updatedHistory = [newNotes, ...notesHistory].slice(0, 10);
        setNotesHistory(updatedHistory);
        localStorage.setItem('notesHistory', JSON.stringify(updatedHistory));
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("Failed to generate notes:", error);
      const msg = error?.response?.data?.message || error?.message || 'Unknown error';
      alert(`Failed to generate notes:\n\n${msg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMockTest = async () => {
    if (!notes) return;
    setIsGeneratingMockTest(true);

    const prompt = `Based on the following notes for the subject "${notes.title}" (${notes.subjectCode}), generate a mock test consisting of 5 high-quality Multiple Choice Questions (MCQs) that are suitable for an undergraduate engineering exam.
    
    Notes Content:
    ${notes.content}
    
    Strictly format the response as a valid JSON array of objects. Each object must have:
    - "question": string
    - "options": array of 4 strings
    - "correctAnswer": integer (0, 1, 2, or 3) indicating the index of the correct option
    - "explanation": string (brief explanation of why it's correct)
    
    Return ONLY the JSON array, no other text.`;

    try {
      const response = await aiService.generateMockTestFromNotes({
        subjectCode: notes.subjectCode,
        unit: notes.unit || settings.unit,
        prompt
      });
      if (response.success) {
        // Backend already parses the JSON into mcqs array
        const mcqs = response.mcqs;
        if (Array.isArray(mcqs) && mcqs.length > 0) {
          setMockTest(mcqs);
          setShowMockTest(true);
        } else {
          // Fallback: try to parse rawResponse if mcqs was null
          try {
            const jsonMatch = (response.rawResponse || '').match(/\[[\s\S]*\]/);
            const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
            if (Array.isArray(parsed) && parsed.length > 0) {
              setMockTest(parsed);
              setShowMockTest(true);
            } else {
              throw new Error("Invalid format: Expected a non-empty array");
            }
          } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            throw new Error("Failed to parse the test format. Please try again.");
          }
        }
      } else {
        throw new Error(response.message || 'Failed to generate mock test');
      }
    } catch (error) {
      console.error("Failed to generate mock test:", error);
      const msg = error?.response?.data?.message || error?.message || 'Unknown error';
      alert(`Failed to generate mock test:\n\n${msg}`);
    } finally {
      setIsGeneratingMockTest(false);
    }
  };

  const exportAsText = () => {
    if (!notes) return;
    const textContent = `
${notes.title.toUpperCase()}
=========================================
Subject Code: ${notes.subjectCode}
Semester: ${notes.semester}
Type: ${notes.type} | Depth: ${notes.depth}
Generated At: ${new Date(notes.generatedAt).toLocaleString()}
=========================================

${notes.content}

-----------------------------------------
Generated by IntelliCampus AI Notes Generator
    `;
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${notes.title.replace(/[^a-z0-9]/gi, '_')}_Notes.txt`;
    link.click();
  };

  const saveToProjectFolder = async () => {
    if (!notes) return;
    setIsSaving(true);
    try {
      const response = await api.post('/notes/save', {
        title: notes.title,
        subjectCode: notes.subjectCode,
        content: notes.content,
        unit: notes.unit
      });
      const data = response.data;
      if (data.success) {
        alert(`Successfully saved to: ${data.path}`);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save to project folder. Make sure the backend is running.');
    } finally {
      setIsSaving(false);
    }
  };

  const fetchLibrary = async () => {
    setIsLoadingLibrary(true);
    try {
      const response = await api.get('/notes');
      const data = response.data;
      if (data.success) {
        setLibraryData(data.library || []);
      }
    } catch (error) {
      console.error('Fetch library error:', error);
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  useEffect(() => {
    if (showSavedNotes) {
      fetchLibrary();
    }
  }, [showSavedNotes]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Sparkles className="text-blue-400" size={32} />
            AI Notes Generator Pro
          </h1>
          <p className="text-slate-400 mt-2">Generate comprehensive, exam-oriented notes for any subject and unit</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${showAnalytics
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
          >
            <BarChart3 size={18} />
            Analytics
          </button>
          <button
            onClick={() => { setShowSavedNotes(!showSavedNotes); setShowHistory(false); setShowAnalytics(false); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${showSavedNotes
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
          >
            <Book size={18} />
            My Library
          </button>
          <button
            onClick={() => { setShowHistory(!showHistory); setShowSavedNotes(false); setShowAnalytics(false); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${showHistory
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
          >
            <History size={18} />
            History ({notesHistory.length})
          </button>
        </div>
      </header>

      {/* Analytics Panel */}
      {showAnalytics && notes && (
        <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-2xl p-6 animate-in slide-in-from-top-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
            <BarChart3 className="text-blue-400" size={24} />
            Content Analytics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-2 text-blue-400 mb-3">
                <FileText size={20} />
                <h3 className="font-bold text-sm">Word Count</h3>
              </div>
              <p className="text-3xl font-black text-white">{notes.analytics.wordCount}</p>
              <p className="text-xs text-slate-500 mt-1">Total words generated</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-2 text-green-400 mb-3">
                <Target size={20} />
                <h3 className="font-bold text-sm">Concepts Covered</h3>
              </div>
              <p className="text-3xl font-black text-white">{notes.analytics.conceptCount}</p>
              <p className="text-xs text-slate-500 mt-1">Key syllabus topics addressed</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-2 text-orange-400 mb-3">
                <Clock size={20} />
                <h3 className="font-bold text-sm">Reading Time</h3>
              </div>
              <p className="text-3xl font-black text-white">{notes.analytics.readingTime} <span className="text-sm text-slate-400">min</span></p>
              <p className="text-xs text-slate-500 mt-1">Estimated study duration</p>
            </div>
          </div>
        </div>
      )}

      {/* History Panel */}
      {showHistory && (
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-slate-700 rounded-2xl p-6 animate-in slide-in-from-top-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
            <History className="text-blue-400" size={24} />
            Notes History
          </h2>
          {notesHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No notes generated yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notesHistory.map((h) => (
                <div key={h.id} className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl hover:border-blue-500/50 transition-all cursor-pointer group" onClick={() => { setNotes(h); setShowHistory(false); }}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${h.type === 'Detailed' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {h.type}
                    </span>
                    <span className="text-[10px] text-slate-500">{new Date(h.generatedAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">{h.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{h.subjectCode} • {h.analytics.wordCount} words</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Library Panel (Folder View) */}
      {showSavedNotes && (
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-slate-700 rounded-2xl p-6 animate-in slide-in-from-top-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
            <BookOpen className="text-blue-400" size={24} />
            My Note Library (Subject Folders)
          </h2>
          {isLoadingLibrary ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="animate-spin text-blue-500" size={32} />
              <p className="text-slate-500 font-bold uppercase text-[10px]">Scanning Storage...</p>
            </div>
          ) : libraryData.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
              No notes saved to project folder yet. Use "Save to Folder" on any generated note.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {libraryData.map((folder) => (
                <div key={folder.subjectCode} className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl">
                    <Layout className="text-blue-400" size={20} />
                    <h3 className="font-bold text-white text-sm">{folder.subjectCode}</h3>
                    <span className="ml-auto bg-blue-600/20 text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {folder.notes.length} Files
                    </span>
                  </div>
                  <div className="space-y-2 pl-2 border-l border-slate-800 ml-5">
                    {folder.notes.map((file, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-lg hover:border-emerald-500/50 transition-all cursor-pointer group"
                        onClick={() => {
                          setNotes({
                            title: file.name.split('_').join(' ').replace('.md', ''),
                            content: file.content.split('---')[1]?.trim() || file.content,
                            subjectCode: folder.subjectCode,
                            generatedAt: file.savedAt,
                            analytics: { wordCount: file.content.split(/\s+/).length, conceptCount: 0, readingTime: 0 }
                          });
                          setShowSavedNotes(false);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-slate-500 group-hover:text-emerald-400" />
                            <span className="text-xs text-slate-300 truncate font-medium group-hover:text-white">{file.name}</span>
                          </div>
                          {file.relativeDir && file.relativeDir !== '.' && (
                            <span className="text-[8px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded uppercase font-black">
                              {file.relativeDir}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">{new Date(file.savedAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Panel */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 sticky top-8">
            <div className="flex items-center gap-2 text-white font-bold mb-2">
              <Settings2 size={20} className="text-blue-400" />
              Generation Settings
            </div>

            <div className="space-y-4">
              {/* Semester Select */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Semester</label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 4, 5, 6, 7].map((sem) => (
                    <button
                      key={sem}
                      onClick={() => handleSemesterChange(sem)}
                      className={`py-2 rounded-lg text-sm font-bold transition-all ${settings.semester == sem
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                    >
                      S{sem}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Select */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Subject</label>
                <select
                  value={settings.subject}
                  onChange={handleSubjectChange}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                >
                  {subjectsBySemester[settings.semester]?.map((sub) => (
                    <option key={sub.code} value={sub.title}>{sub.title}</option>
                  ))}
                </select>
              </div>

              {/* Unit Select */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Unit / Module</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5'].map((unit) => (
                    <button
                      key={unit}
                      onClick={() => setSettings({ ...settings, unit })}
                      className={`py-2 rounded-lg text-sm font-bold transition-all ${settings.unit === unit
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Syllabus Context Textarea */}
              <div className="space-y-2 animate-in slide-in-from-top-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={14} className="text-blue-400" />
                  Syllabus Context (Paste Here)
                </label>
                <textarea
                  value={syllabusContent}
                  onChange={(e) => setSyllabusContent(e.target.value)}
                  placeholder="Paste retrieved chunks or syllabus text to guide the AI..."
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-blue-500 h-24 resize-none scrollbar-thin scrollbar-thumb-slate-700 font-mono"
                />
              </div>

              <div className="h-px bg-slate-800 my-4"></div>

              {/* Note Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Note Type</label>
                <select
                  value={settings.noteType}
                  onChange={(e) => setSettings({ ...settings, noteType: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="Detailed">Detailed Notes</option>
                  <option value="Summary">Concise Summary</option>
                  <option value="Key Points">Key Bullet Points</option>
                  <option value="Q&A Style">Q&A Style (Exam Prep)</option>
                  <option value="Exam Revision">Ultra-Condensed Revision (Strict)</option>
                </select>
              </div>

              {settings.noteType !== 'Exam Revision' && (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                  {/* Depth */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Complexity Level</label>
                    <div className="flex gap-2">
                      {['Basic', 'Intermediate', 'Advanced'].map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => setSettings({ ...settings, depth: lvl })}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${settings.depth === lvl
                            ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Toggle Options */}
                  <div className="space-y-3 pt-2">
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-xs font-medium text-slate-400 group-hover:text-slate-300">Include Practical Examples</span>
                      <div
                        onClick={() => setSettings({ ...settings, includeExamples: !settings.includeExamples })}
                        className={`w-10 h-5 rounded-full relative transition-all ${settings.includeExamples ? 'bg-blue-600' : 'bg-slate-700'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.includeExamples ? 'right-1' : 'left-1'}`}></div>
                      </div>
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-xs font-medium text-slate-400 group-hover:text-slate-300">Description of Diagrams</span>
                      <div
                        onClick={() => setSettings({ ...settings, includeDiagramDescriptions: !settings.includeDiagramDescriptions })}
                        className={`w-10 h-5 rounded-full relative transition-all ${settings.includeDiagramDescriptions ? 'bg-blue-600' : 'bg-slate-700'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.includeDiagramDescriptions ? 'right-1' : 'left-1'}`}></div>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={generateNotes}
              disabled={isGenerating}
              className={`w-full py-4 rounded-xl font-black text-white transition-all flex items-center justify-center gap-2 mt-6 ${isGenerating
                ? 'bg-slate-800 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-500/20'
                }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  <span>Synthesizing Knowledge...</span>
                </>
              ) : (
                <>
                  <Sparkles size={24} />
                  <span>Generate AI Notes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Display */}
        <div className="lg:col-span-2">
          {isGenerating ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-6 h-full min-h-[600px]">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400" size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Generating Your Custom Notes</h3>
                <p className="text-slate-400 mt-2 max-w-sm">Our AI is analyzing the syllabus and crafting detailed, exam-oriented content just for you.</p>
              </div>
              <div className="w-full max-w-md bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full animate-[loading_2s_ease-in-out_infinite]"></div>
              </div>
            </div>
          ) : notes ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col h-full min-h-[800px] animate-in zoom-in-95 duration-500">
              <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between sticky top-0 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400">
                    <Book size={24} />
                  </div>
                  <div>
                    <h2 className="font-bold text-white tracking-tight text-lg">{notes.title}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">{notes.subjectCode} • {notes.type}</p>
                      {notes.type === 'Exam Revision' && (
                        <span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-2 py-0.5 rounded border border-emerald-500/20 font-black uppercase tracking-widest">
                          Strict Mode
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={generateMockTest}
                    disabled={isGeneratingMockTest}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border shadow-lg ${isGeneratingMockTest
                      ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-500 text-white border-purple-500 shadow-purple-500/20'
                      }`}
                  >
                    {isGeneratingMockTest ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Generating Test...
                      </>
                    ) : (
                      <>
                        <Brain size={18} />
                        Take Mock Test
                      </>
                    )}
                  </button>
                  <button
                    onClick={saveToProjectFolder}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border shadow-lg ${isSaving
                      ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-emerald-500/20'
                      }`}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FileDown size={18} />
                        Save to Folder
                      </>
                    )}
                  </button>
                  <button
                    onClick={exportAsText}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all border border-slate-700"
                  >
                    <Download size={18} />
                    Export TXT
                  </button>
                </div>
              </div>

              <div className="p-8 flex-1 overflow-y-auto">
                <div className="prose prose-invert max-w-none">
                  {/* Notes Content with simple formatting */}
                  <div className="text-slate-300 leading-relaxed whitespace-pre-wrap font-sans text-base">
                    {notes.content}
                  </div>

                  {/* Ready for Mock Test Prompt */}
                  <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-purple-500/30 flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center text-purple-400">
                      <Brain size={32} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Finished Reading?</h3>
                      <p className="text-slate-400 text-sm max-w-md">Test your knowledge with an AI-generated mock test based on these notes.</p>
                    </div>
                    <button
                      onClick={generateMockTest}
                      disabled={isGeneratingMockTest}
                      className={`flex items-center gap-3 px-8 py-4 rounded-xl font-black transition-all shadow-xl ${isGeneratingMockTest
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/40 hover:scale-105 active:scale-95'
                        }`}
                    >
                      {isGeneratingMockTest ? (
                        <>
                          <Loader2 size={24} className="animate-spin" />
                          Preparing Your Test...
                        </>
                      ) : (
                        <>
                          <Zap size={20} />
                          Take Mock Test Now
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                <div className="flex items-center gap-4">
                  <span>Words: {notes.analytics.wordCount}</span>
                  <span>Concepts: {notes.analytics.conceptCount}</span>
                  <span>Reading: ~{notes.analytics.readingTime}m</span>
                </div>
                <div>Generated on {new Date(notes.generatedAt).toLocaleDateString()}</div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border-2 border-dashed border-slate-800 rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-4 h-full min-h-[600px] text-slate-600">
              <div className="w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4">
                <FileText size={40} className="opacity-20" />
              </div>
              <h3 className="text-xl font-bold text-slate-400">Ready to Generate</h3>
              <p className="max-w-xs mx-auto">Configure your settings on the left and click "Generate AI Notes" to begin.</p>
              <div className="flex gap-4 mt-8">
                <div className="flex flex-col items-center gap-1">
                  <Zap size={20} className="text-orange-500/50" />
                  <span className="text-[10px] uppercase tracking-tighter">Fast Generation</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Target size={20} className="text-green-500/50" />
                  <span className="text-[10px] uppercase tracking-tighter">Exam Oriented</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Sparkles size={20} className="text-blue-500/50" />
                  <span className="text-[10px] uppercase tracking-tighter">AI Powered</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>



      {/* Mock Test Overlay */}
      {showMockTest && mockTest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowMockTest(false)}></div>
          <div className="relative w-full max-w-2xl my-auto">
            <MockTest
              questions={mockTest}
              subjectCode={notes?.subjectCode}
              unit={notes?.unit}
              onClose={() => setShowMockTest(false)}
              subjectTitle={notes?.title || 'Subject Test'}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesView;