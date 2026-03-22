import React, { useState } from 'react';
import {
    CheckCircle2, XCircle, ChevronRight, RefreshCw,
    Trophy, BookOpen, AlertCircle, ArrowRight, Brain, FileDown
} from 'lucide-react';
import api from '../../services/api';

const MockTest = ({ questions, onClose, subjectTitle, subjectCode, unit }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [wrongAnswers, setWrongAnswers] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    const currentQuestion = questions[currentIndex];

    const handleAnswerSelect = (index) => {
        if (showFeedback) return;
        setSelectedAnswer(index);
        setShowFeedback(true);

        const isCorrect = index === Number(currentQuestion.correctAnswer);

        if (isCorrect) {
            setScore(score + 1);
        } else {
            setWrongAnswers([...wrongAnswers, {
                question: currentQuestion.question,
                selected: currentQuestion.options[index],
                correct: currentQuestion.options[Number(currentQuestion.correctAnswer)],
                explanation: currentQuestion.explanation
            }]);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setSelectedAnswer(null);
            setShowFeedback(false);
        } else {
            setIsFinished(true);
        }
    };

    const resetTest = () => {
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setShowFeedback(false);
        setScore(0);
        setIsFinished(false);
        setWrongAnswers([]);
    };

    if (isFinished) {
        const percentage = (score / questions.length) * 100;
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-2xl w-full mx-auto animate-in zoom-in-95 duration-300">
                <div className="text-center space-y-6">
                    <div className="relative inline-block">
                        <div className="w-24 h-24 rounded-full border-4 border-blue-500/20 flex items-center justify-center mx-auto">
                            <Trophy className="text-yellow-500" size={48} />
                        </div>
                        {percentage >= 70 && (
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white p-1 rounded-full">
                                <CheckCircle2 size={20} />
                            </div>
                        )}
                    </div>

                    <div>
                        <h2 className="text-3xl font-black text-white">Test Completed!</h2>
                        <p className="text-slate-400 mt-2">You scored {score} out of {questions.length}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Accuracy</p>
                            <p className="text-2xl font-black text-white">{percentage}%</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Questions</p>
                            <p className="text-2xl font-black text-white">{questions.length}</p>
                        </div>
                    </div>

                    {wrongAnswers.length > 0 && (
                        <div className="text-left space-y-4 pt-4">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                <AlertCircle size={16} className="text-orange-500" />
                                Review Areas to Improve
                            </h3>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {wrongAnswers.map((w, i) => (
                                    <div key={i} className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-xl space-y-2">
                                        <p className="text-sm font-medium text-white">{w.question}</p>
                                        <p className="text-xs text-red-400">Your answer: {w.selected}</p>
                                        <p className="text-xs text-green-400">Correct answer: {w.correct}</p>
                                        <p className="text-xs text-slate-500 italic mt-2 border-t border-slate-700/50 pt-2">{w.explanation}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 pt-4">
                        <div className="flex gap-3">
                            <button
                                onClick={resetTest}
                                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all border border-slate-700"
                            >
                                <RefreshCw size={18} />
                                Retake Test
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20"
                            >
                                Back to Notes
                                <ChevronRight size={18} />
                            </button>
                        </div>
                        <button
                            onClick={async () => {
                                setIsSaving(true);
                                try {
                                    const response = await api.post('/notes/save', {
                                        title: subjectTitle,
                                        subjectCode: subjectCode || 'General',
                                        unit: unit || 'Common',
                                        type: 'Test',
                                        results: {
                                            score,
                                            total: questions.length,
                                            percentage: percentage,
                                            wrongAnswers
                                        }
                                    });
                                    const data = response.data;
                                    if (data.success) alert('Test results saved to folder!');
                                } catch (e) {
                                    alert('Failed to save test results.');
                                } finally {
                                    setIsSaving(false);
                                }
                            }}
                            disabled={isSaving}
                            className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition-all border ${isSaving
                                ? 'bg-slate-800 text-slate-500 border-slate-700'
                                : 'bg-emerald-600/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/20'
                                }`}
                        >
                            {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <FileDown size={18} />}
                            {isSaving ? 'Saving Results...' : 'Save Result to Project Folder'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden max-w-2xl w-full mx-auto animate-in slide-in-from-bottom-8 duration-500 shadow-2xl">
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center text-purple-400">
                        <Brain size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">Mock Test: {subjectTitle}</h3>
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Question {currentIndex + 1} of {questions.length}</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                    <XCircle size={24} />
                </button>
            </div>

            <div className="p-8 space-y-8 overflow-y-visible">
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white leading-tight">
                        {currentQuestion.question}
                    </h2>
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <div className="grid gap-3">
                    {currentQuestion.options.map((option, index) => {
                        const isSelected = selectedAnswer === index;
                        const isCorrect = index === Number(currentQuestion.correctAnswer);

                        let btnClass = "w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between group ";
                        if (!showFeedback) {
                            btnClass += "bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-blue-500/50 text-slate-300";
                        } else if (isCorrect) {
                            btnClass += "bg-green-500/10 border-green-500 text-green-400";
                        } else if (isSelected && !isCorrect) {
                            btnClass += "bg-red-500/10 border-red-500 text-red-400";
                        } else {
                            btnClass += "bg-slate-900/30 border-slate-800 text-slate-600 opacity-50";
                        }

                        return (
                            <button
                                key={index}
                                onClick={() => handleAnswerSelect(index)}
                                disabled={showFeedback}
                                className={btnClass}
                            >
                                <span className="font-medium">{option}</span>
                                {showFeedback && isCorrect && <CheckCircle2 size={18} />}
                                {showFeedback && isSelected && !isCorrect && <XCircle size={18} />}
                                {!showFeedback && <div className="w-5 h-5 rounded-full border border-slate-700 group-hover:border-blue-500 transition-colors"></div>}
                            </button>
                        );
                    })}
                </div>

                {showFeedback && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl">
                            <div className="flex items-start gap-3">
                                <div className={`mt-0.5 ${selectedAnswer === Number(currentQuestion.correctAnswer) ? 'text-green-500' : 'text-red-500'}`}>
                                    {selectedAnswer === Number(currentQuestion.correctAnswer) ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-white text-sm">
                                        {selectedAnswer === Number(currentQuestion.correctAnswer) ? 'Excellent!' : 'Not quite right'}
                                    </p>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        {currentQuestion.explanation}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleNext}
                            className="w-full mt-6 bg-white text-slate-900 font-black py-4 rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 group"
                        >
                            {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Test'}
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MockTest;
