import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  Handle, 
  Position, 
  MarkerType,
  applyNodeChanges,
  applyEdgeChanges,
  BaseEdge,
  getBezierPath
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  GitBranch, Target, Layers, ArrowRight, CheckCircle2, 
  AlertCircle, Sparkles, BookOpen, BrainCircuit, Activity,
  TrendingUp, Zap, Hexagon, Maximize2, RefreshCw, BarChart3,
  Clock, Award, Info, XCircle, Search, Settings, ShieldCheck,
  ChevronRight, Cpu, Network
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip as RechartsTooltip, BarChart, Bar, Cell
} from 'recharts';
import academicService from '../../services/academicService';

// ── CUSTOM NEURAL EDGE ──────────────────────────────────────────────────────
const NeuralEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, strokeWidth: 3, strokeOpacity: 0.6 }} />
      <circle r="3" fill={style.stroke || '#6366f1'}>
        <animateMotion dur="2.5s" repeatCount="indefinite" path={edgePath} />
      </circle>
    </>
  );
};

// ── PREMIUM TOPIC NODE ──────────────────────────────────────────────────────
const TopicNode = ({ data }) => {
  const statusConfig = {
    completed: { color: '#10b981', icon: CheckCircle2, shadow: '0 0 30px rgba(16,185,129,0.15)' },
    weak: { color: '#ef4444', icon: AlertCircle, shadow: '0 0 30px rgba(239,68,68,0.15)' },
    active: { color: '#6366f1', icon: BrainCircuit, shadow: '0 0 30px rgba(99,102,241,0.2)' },
    locked: { color: '#475569', icon: Clock, shadow: 'none' }
  };

  const config = statusConfig[data.status] || statusConfig.active;

  return (
    <div className={`relative group p-8 rounded-[2.5rem] bg-slate-900/60 backdrop-blur-2xl border border-white/10 hover:border-${config.color === '#6366f1' ? 'indigo' : config.color === '#10b981' ? 'emerald' : 'rose'}-500/50 transition-all duration-500 hover:scale-[1.05] min-w-[280px] shadow-2xl overflow-hidden`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-700" />
      
      <Handle type="target" position={Position.Left} style={{ visibility: 'hidden' }} />
      
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner ${data.status === 'active' ? 'bg-indigo-500 text-white' : 'bg-slate-800/80 text-slate-500'}`} style={{ boxShadow: data.status === 'active' ? config.shadow : 'none' }}>
              <config.icon size={20} className={data.status === 'active' ? 'animate-pulse' : ''} />
           </div>
           <div className="text-right">
              <p className="text-[7px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono">{data.subjectCode}</p>
              <div className={`text-[9px] font-black uppercase tracking-wider py-0.5 px-2 rounded-md mt-1 ${data.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : data.status === 'weak' ? 'bg-rose-500/10 text-rose-500' : 'bg-indigo-500/10 text-indigo-400'}`}>
                {data.status}
              </div>
           </div>
        </div>

        <div>
          <h4 className="text-lg font-black text-white italic truncate uppercase tracking-tight group-hover:text-indigo-400 transition-colors leading-tight mb-2">{data.label}</h4>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none truncate">{data.subject}</p>
        </div>

        <div className="pt-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mastery Sync</span>
                <span className={`text-xs font-black ${data.mastery > 75 ? 'text-emerald-500' : 'text-indigo-400'}`}>{data.mastery}%</span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${data.mastery}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`h-full ${data.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'} relative`}
                >
                   <div className="absolute top-0 right-0 h-full w-2 bg-white/40 blur-[1px]" />
                </motion.div>
            </div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} style={{ visibility: 'hidden' }} />
    </div>
  );
};

// ── MAIN NEURAL INTERFACE ───────────────────────────────────────────────────
const PersonalLearningRoadmap = () => {
  const [roadmapData, setRoadmapData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [viewMode, setViewMode] = useState('neural');
  const [searchQuery, setSearchQuery] = useState('');

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const nodeTypes = useMemo(() => ({ topicNode: TopicNode }), []);
  const edgeTypes = useMemo(() => ({ neural: NeuralEdge }), []);

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roadmapRes, analyticsRes, progressRes] = await Promise.all([
        academicService.getStudentRoadmap(),
        academicService.getStudentAnalytics(),
        academicService.getStudentProgress()
      ]);

      if (roadmapRes.success) {
        setRoadmapData(roadmapRes.data);
        const mappedNodes = (roadmapRes.data.graph?.nodes || []).map(n => ({
            ...n,
            style: { width: 240 }
        }));
        setNodes(mappedNodes);
        
        const mappedEdges = (roadmapRes.data.graph?.edges || []).map(e => ({
            ...e,
            type: 'neural',
            animated: true,
            style: { stroke: e.style?.stroke || '#6366f1', strokeWidth: 2 }
        }));
        setEdges(mappedEdges);
      }
      if (analyticsRes.success) setAnalytics(analyticsRes.data);
      if (progressRes.success) setProgress(progressRes.data);

    } catch (err) {
      setError('Intelligence handshake failed. Retrying neural synchronization...');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onNodeClick = (event, node) => setSelectedNode(node.data);

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-10">
      <div className="relative">
        <div className="w-40 h-40 border-[2px] border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
            <Cpu className="text-indigo-500 animate-pulse" size={48} />
        </div>
        <div className="absolute -inset-4 border border-white/5 rounded-full animate-reverse-spin" />
      </div>
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">IntelliCampus v4.0 Engaged</h2>
        <p className="text-slate-500 font-bold uppercase tracking-[0.5em] text-[10px] animate-pulse">Re-routing Pedagogical Vectors...</p>
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-[#020617] text-slate-100 overflow-hidden font-inter selection:bg-indigo-500/30 selection:text-white">
      
      {/* ── GLOBAL INTERFACE HEADER ────────────────────────────────────────────── */}
      <header className="h-20 flex items-center justify-between px-10 bg-slate-900/40 border-b border-white/5 backdrop-blur-3xl z-40 relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        
        <div className="flex items-center gap-8 relative z-10">
          <div className="flex flex-col">
             <div className="flex items-center gap-3">
                 <h1 className="text-4xl font-black italic uppercase tracking-tighter flex items-center mr-8">
                   <Network size={40} className="text-indigo-500 mr-4" />
                   Neural <span className="text-indigo-500 text-shadow-glow ml-2">Roadmap</span>
                 </h1>
                 <div className="hidden xl:flex items-center gap-3 px-6 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-full">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400">Stability Locked: 98.4%</span>
                 </div>
             </div>
             <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2 ml-14 italic">End-to-End Pedagogical Encryption Pulse</p>
          </div>
        </div>

        <div className="flex items-center gap-8 relative z-10">
           {/* Global Telemetry HUD */}
           <div className="hidden lg:grid grid-cols-3 gap-10 bg-slate-950/40 px-10 py-4 rounded-[2rem] border border-white/5 shadow-inner">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Mastery Substrate</span>
                <span className="text-2xl font-black italic">{analytics?.kpis?.avgScore}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Cognitive Flow</span>
                <div className="flex items-center gap-2 text-indigo-400">
                   <Zap size={14} />
                   <span className="text-xs font-black uppercase tracking-tight">{roadmapData?.difficultyProfile?.velocity || 'OPTIMAL'}</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Semesters Active</span>
                <span className="text-2xl font-black italic text-slate-400">0{analytics?.student?.semester}</span>
              </div>
           </div>

           <div className="h-10 w-px bg-white/5" />

           <div className="flex gap-3">
             <div className="relative group/search">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/search:text-indigo-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Scan Nodes..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-800/50 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-xs font-bold focus:outline-none focus:border-indigo-500/50 w-48 focus:w-64 transition-all duration-500"
                />
             </div>
             <button onClick={fetchData} className="p-3 bg-slate-800/50 text-slate-500 rounded-2xl hover:text-indigo-400 transition-all border border-white/5 hover:border-indigo-500/30">
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
             </button>
           </div>
        </div>
      </header>

      {/* ── MAIN INTELLIGENCE WORKSPACE ────────────────────────────────────────── */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left: View Mode Toggle Vertical Bar */}
        <nav className="w-20 bg-slate-950 border-r border-white/5 flex flex-col items-center py-10 gap-8 z-40">
           <button onClick={() => setViewMode('neural')} className={`p-4 rounded-2xl transition-all duration-300 relative group ${viewMode === 'neural' ? 'bg-indigo-500 text-white shadow-2xl shadow-indigo-500/40' : 'text-slate-600 hover:text-slate-300'}`}>
              <Network size={24} />
              <div className="absolute left-full ml-4 px-2 py-1 bg-indigo-600 text-[8px] font-black uppercase rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">Map View</div>
           </button>
           <button onClick={() => setViewMode('stats')} className={`p-4 rounded-2xl transition-all duration-300 relative group ${viewMode === 'stats' ? 'bg-indigo-500 text-white shadow-2xl shadow-indigo-500/40' : 'text-slate-600 hover:text-slate-300'}`}>
              <BarChart3 size={24} />
               <div className="absolute left-full ml-4 px-2 py-1 bg-indigo-600 text-[8px] font-black uppercase rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">Deep Stats</div>
           </button>
           <div className="mt-auto flex flex-col items-center gap-6">
              <button className="p-4 text-slate-700 hover:text-slate-300 transition-colors"><Settings size={24} /></button>
           </div>
        </nav>

        {/* Center: Interactive Canvas / Analytics */}
        <div className="flex-1 relative bg-[#020617] overflow-hidden">
          <AnimatePresence mode="wait">
            {viewMode === 'neural' ? (
              <motion.div 
                key="neural-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.5 }}
                className="w-full h-full"
              >
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onNodeClick={onNodeClick}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  fitView
                  minZoom={0.1}
                  maxZoom={2}
                >
                  <Background color="#1e293b" gap={40} size={1} />
                  <Controls className="!bg-slate-900 !border-white/10 !rounded-2xl !shadow-2xl overflow-hidden !m-8" />
                  <MiniMap 
                    nodeColor={(n) => n.data.status === 'completed' ? '#10b981' : n.data.status === 'active' ? '#6366f1' : '#1e293b'}
                    bgcolor="#080c1d"
                    maskColor="rgba(0, 0, 0, 0.6)"
                    className="!bg-slate-950/80 !border-white/10 !rounded-[2rem] !m-8 !right-8 !bottom-8"
                  />
                </ReactFlow>

                {/* Tactical Status Toast (Repositioned for better UX) */}
                <div className="absolute bottom-32 left-8 p-6 bg-slate-950/90 border border-indigo-500/20 rounded-[2rem] backdrop-blur-3xl z-10 pointer-events-none max-w-sm space-y-4 shadow-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/40">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black text-white uppercase italic tracking-widest leading-none">Path Logic Synchronized</h3>
                      <p className="text-[8px] text-indigo-400 font-bold uppercase tracking-wider mt-1">Difficulty: {roadmapData?.masteryLevel} Protocol</p>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-500 font-medium leading-relaxed uppercase tracking-tight">
                    Current trajectory is optimized for SEM {analytics?.student?.semester} endpoints. AI-re-routing engaged to bypass deficit nodes.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="stats-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full h-full p-10 overflow-y-auto scrollbar-hide bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent)]"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Detailed Performance Matrix */}
                  <div className="lg:col-span-8 bg-slate-900/30 border border-white/5 rounded-[3rem] p-12 space-y-10 shadow-2xl">
                    <div className="flex items-center justify-between">
                       <h3 className="text-2xl font-black text-white uppercase italic flex items-center gap-4">
                         <Layers size={28} className="text-indigo-500" /> Mastery Profile
                       </h3>
                       <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Global Avg: {analytics?.kpis?.avgScore}%</span>
                          <button className="p-2 bg-slate-800 rounded-lg text-slate-500 hover:text-white"><Maximize2 size={14} /></button>
                       </div>
                    </div>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={progress}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                            <XAxis dataKey="subject" stroke="#475569" fontSize={10} fontWeight="black" tickLine={false} axisLine={false} />
                            <YAxis domain={[0, 100]} stroke="#475569" fontSize={10} fontWeight="black" tickLine={false} axisLine={false} />
                            <RechartsTooltip 
                               contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '1.5rem', padding: '16px' }}
                               itemStyle={{ color: '#6366f1', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                            />
                            <Bar dataKey="percentage" radius={[12, 12, 0, 0]} barSize={40}>
                               {progress.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={entry.percentage > 75 ? '#10b981' : entry.percentage > 40 ? '#6366f1' : '#ef4444'} />
                               ))}
                            </Bar>
                         </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Stability Indicator */}
                  <div className="lg:col-span-4 bg-slate-900/30 border border-white/5 rounded-[3rem] p-12 flex flex-col items-center justify-center gap-10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent" />
                    <h3 className="text-xl font-black text-white uppercase italic flex items-center gap-4 relative z-10">
                      <Activity className="text-indigo-500" /> Sync Health
                    </h3>
                    <div className="relative w-56 h-56 group-hover:scale-105 transition-transform duration-700 relative z-10">
                       <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="6" />
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#6366f1" strokeWidth="6" strokeDasharray={`${analytics?.kpis?.attendanceStability * 2.8}, 282.6`} strokeLinecap="round" className="transition-all duration-1000 shadow-glow" />
                       </svg>
                       <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-4xl font-black text-white italic tracking-tighter">{analytics?.kpis?.attendanceStability}%</span>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Stability</span>
                       </div>
                    </div>
                    <div className="text-center space-y-2 relative z-10">
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                           <ShieldCheck size={14} /> Protocol Secure
                        </p>
                        <p className="text-[9px] text-slate-500 max-w-[180px] leading-tight font-bold uppercase italic tracking-wide">Retention metrics stable. High probability of endpoint clearance.</p>
                    </div>
                  </div>

                  {/* Future Achievement Curve */}
                  <div className="lg:col-span-12 bg-slate-900/30 border border-white/5 rounded-[3rem] p-12 space-y-10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-20 -bottom-20 p-20 opacity-[0.02] rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                       <TrendingUp size={400} />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase italic flex items-center gap-4 relative z-10">
                      <TrendingUp className="text-indigo-500" /> Achievement Trajectory Prediction
                    </h3>
                    <div className="h-[350px] relative z-10">
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={analytics?.visuals?.prediction?.currentTrend}>
                            <defs>
                              <linearGradient id="colorCurve" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                            <XAxis dataKey="x" stroke="#475569" fontSize={10} fontWeight="black" tickLine={false} axisLine={false} />
                            <YAxis domain={[0, 100]} stroke="#475569" fontSize={10} fontWeight="black" tickLine={false} axisLine={false} />
                            <RechartsTooltip 
                               contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '1.5rem', padding: '16px' }}
                            />
                            <Area type="monotone" dataKey="y" stroke="#6366f1" strokeWidth={5} fillOpacity={1} fill="url(#colorCurve)" />
                         </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Neural Intelligence Panel */}
        <aside className="w-80 bg-slate-950 border-l border-white/5 flex flex-col overflow-y-auto scrollbar-hide z-50 transition-all duration-300">
          
          <div className="p-8 space-y-10">
            
            {/* Identity Terminal */}
            <div className="flex items-center gap-6 p-6 bg-slate-900/40 rounded-[2.5rem] border border-white/5 relative group">
               <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />
               <div className="w-20 h-20 rounded-[1.5rem] bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 relative shadow-inner overflow-hidden">
                  <div className="absolute inset-0 opacity-20"><BrainCircuit size={60} /></div>
                  <span className="text-3xl font-black text-indigo-400 italic relative z-10">
                    {analytics?.student?.name[0]}
                  </span>
               </div>
               <div className="truncate relative z-10">
                 <h3 className="text-xl font-black text-white italic truncate uppercase tracking-tighter">{analytics?.student?.name}</h3>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none mt-2">
                   SEM {analytics?.student?.semester} · {analytics?.student?.section} · {roadmapData?.difficultyProfile?.currentLevel}
                 </p>
                 <div className="flex items-center gap-2 mt-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[8px] font-black text-emerald-500/80 uppercase tracking-widest">Neural Link SECURE</span>
                 </div>
               </div>
            </div>

            {/* AI Directives Hud */}
            <section className="space-y-8">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] flex items-center gap-2">
                  <Cpu size={14} className="text-indigo-500" /> AI Executive Directives
                </h4>
                <div className="flex gap-1">
                   <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
                   <div className="w-1 h-1 rounded-full bg-indigo-500/60 animate-pulse delay-75" />
                   <div className="w-1 h-1 rounded-full bg-indigo-500/30 animate-pulse delay-150" />
                </div>
              </div>
              <div className="space-y-6">
                 {roadmapData?.recommendations?.map((rec, i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ x: 8 }}
                      className="p-6 bg-slate-900/40 rounded-[2rem] border border-white/5 hover:border-indigo-500/20 transition-all flex items-start gap-5 relative group shadow-lg"
                    >
                      <div className={`p-3 rounded-2xl shrink-0 ${rec.priority === 'High' ? 'bg-rose-500/10 text-rose-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                        {rec.type === 'remediation' ? <AlertCircle size={20} /> : <Target size={20} />}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg ${rec.priority === 'High' ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                            {rec.priority} PRIORITY
                          </span>
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">RE-ROUTE REQUIRED</span>
                        </div>
                        <p className="text-xs font-bold text-slate-300 leading-relaxed uppercase tracking-tight">{rec.message}</p>
                        <button className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-2 flex items-center gap-2 hover:gap-3 transition-all">
                           Synchronize Now <ChevronRight size={10} />
                        </button>
                      </div>
                    </motion.div>
                 ))}
              </div>
            </section>

            {/* Achievement Vectors */}
            <section className="space-y-8">
               <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] border-b border-white/5 pb-4">
                  Neural Performance HUD
               </h4>
               <div className="grid grid-cols-2 gap-6">
                  {[
                    { icon: CheckCircle2, label: 'Mastered', value: roadmapData?.summary?.completedNodes || 0, color: 'emerald' },
                    { icon: Activity, label: 'In Progress', value: roadmapData?.summary?.activeNodes || 0, color: 'indigo' },
                    { icon: AlertCircle, label: 'Critical Gaps', value: roadmapData?.summary?.weakNodes || 0, color: 'rose' },
                    { icon: Award, label: 'Credits', value: '124', color: 'slate' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-slate-900/30 p-8 rounded-[2rem] border border-white/5 text-center group hover:bg-slate-900 transition-all">
                       <stat.icon size={20} className={`mx-auto mb-3 text-${stat.color}-500 group-hover:scale-110 transition-transform`} />
                       <p className="text-3xl font-black text-white italic tracking-tighter leading-none">{stat.value}</p>
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-3">{stat.label}</p>
                    </div>
                  ))}
               </div>
            </section>

            {/* Advanced Context Panel */}
            <AnimatePresence>
               {selectedNode && (
                 <motion.section 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-10 bg-indigo-600 rounded-[3rem] text-white shadow-[0_30px_60px_rgba(79,70,229,0.3)] relative overflow-hidden ring-4 ring-white/10"
                 >
                    <Hexagon className="absolute -right-10 -bottom-10 w-56 h-56 text-white/5 rotate-12" />
                    <div className="relative z-10 space-y-8">
                      <div className="flex items-center justify-between opacity-60">
                        <span className="text-[9px] font-black uppercase tracking-[0.4em]">Node Telemetry</span>
                        <button onClick={() => setSelectedNode(null)} className="hover:scale-110 transition-transform"><XCircle size={20} /></button>
                      </div>
                      <div>
                        <h4 className="text-3xl font-black italic tracking-tighter uppercase leading-none mb-2">{selectedNode.label}</h4>
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-emerald-400" />
                           <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">{selectedNode.subject}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-8">
                         <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">Protocol St.</p>
                            <p className="text-sm font-black uppercase italic">{selectedNode.status}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">Mastery %</p>
                            <p className="text-xl font-black italic">{selectedNode.mastery}%</p>
                         </div>
                      </div>

                      <div className="pt-6 flex gap-3">
                        <button className="flex-1 py-4 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.03] active:scale-95 transition-all shadow-xl">Launch Drill Protocol</button>
                        <button className="p-4 bg-indigo-500/40 text-white rounded-2xl hover:bg-indigo-500 transition-all border border-indigo-400/50"><BookOpen size={20} /></button>
                      </div>
                    </div>
                 </motion.section>
               )}
            </AnimatePresence>
          </div>

          <div className="mt-auto px-12 py-8 bg-slate-900/30 border-t border-white/5">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <ShieldCheck className="text-indigo-500" size={16} />
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">End-to-End Encryption Pulse</span>
                </div>
                <div className="flex gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/20" />
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40" />
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                </div>
             </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default PersonalLearningRoadmap;
