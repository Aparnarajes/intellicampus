import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, FileDown, Settings2, HelpCircle, Layout, ChevronRight, Loader2, Brain, Clock, Target, History, Share2, BarChart3, Download, FileText, FileJson, Lightbulb, CheckCircle2, TrendingUp, Zap, ShieldCheck, AlertTriangle } from 'lucide-react';
import { subjectsBySemester } from '../../utils/subjectData';
import { questionBank } from '../../utils/questionBank';
import aiService from '../../services/aiService';
import api from '../../services/api';

const QuestionPaper = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [paper, setPaper] = useState(null);
  const [paperHistory, setPaperHistory] = useState([]);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [auditResults, setAuditResults] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [generationMode, setGenerationMode] = useState('Manual'); // 'Manual', 'AI', 'Practice', 'Adaptive'
  const [syllabusContent, setSyllabusContent] = useState('');
  const [weakTopics, setWeakTopics] = useState('');
  const [strongTopics, setStrongTopics] = useState('');

  // ── Adaptive mode state ──
  const [adaptiveProfile, setAdaptiveProfile] = useState(null);
  const [adaptiveDistPreview, setAdaptiveDistPreview] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [adaptationFlags, setAdaptationFlags] = useState([]);
  const [adaptationSummary, setAdaptationSummary] = useState('');
  const [adaptiveSettings, setAdaptiveSettings] = useState({
    totalQuestions: 15,
    marksPattern: '5-3-2',   // 5×2m, 3×5m, 2×10m
    forceRefresh: false,
  });
  const [practiceSettings, setPracticeSettings] = useState({
    totalQuestions: 10,
    marksPattern: 'Mixed (2, 5, 10)'
  });
  const [settings, setSettings] = useState({
    semester: '5',
    subject: subjectsBySemester[5][0].title,
    subjectCode: subjectsBySemester[5][0].code,
    unit: 'Unit 1',
    difficulty: 'Medium',
    count2m: 5,
    count5m: 3,
    count10m: 1,
    easyCount: 4,
    mediumCount: 3,
    hardCount: 2,
    includeAnswerKey: true,
    bloomsLevel: 'Mixed', // Remember, Understand, Apply, Analyze, Evaluate, Create
    timeEstimation: true
  });

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('questionPaperHistory');
    if (savedHistory) {
      setPaperHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Auto-load profile when Adaptive mode is selected
  useEffect(() => {
    if (generationMode === 'Adaptive' && !adaptiveProfile) {
      fetchAdaptiveProfile();
    }
  }, [generationMode]);

  // Auto-refresh distribution preview when subject or question count changes
  useEffect(() => {
    if (generationMode === 'Adaptive' && adaptiveProfile) {
      fetchDistributionPreview();
    }
  }, [settings.subject, settings.unit, adaptiveSettings.totalQuestions, generationMode]);

  const fetchAdaptiveProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/adaptive/profile');
      const data = res.data;
      if (data.success) {
        setAdaptiveProfile(data.profile);
        setAdaptiveDistPreview(data.defaultDistribution);
        setAdaptationFlags(data.adaptationFlags || []);
        setAdaptationSummary(data.adaptationSummary || '');
      }
    } catch (e) {
      console.error('Profile fetch error:', e);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const fetchDistributionPreview = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        subjectTitle: settings.subject,
        totalQuestions: adaptiveSettings.totalQuestions,
      });
      const res = await api.get(`/adaptive/distribution-preview?${params}`);
      const data = res.data;
      if (data.success) {
        setAdaptiveDistPreview(data.distribution);
        setAdaptationFlags(data.adaptationFlags || []);
        setAdaptationSummary(data.adaptationSummary || '');
      }
    } catch (e) { /* non-critical, ignore */ }
  };

  // Bloom's Taxonomy mapping
  const bloomsLevels = {
    'Remember': { color: 'bg-blue-500', description: 'Recall facts and basic concepts' },
    'Understand': { color: 'bg-green-500', description: 'Explain ideas or concepts' },
    'Apply': { color: 'bg-yellow-500', description: 'Use information in new situations' },
    'Analyze': { color: 'bg-orange-500', description: 'Draw connections among ideas' },
    'Evaluate': { color: 'bg-red-500', description: 'Justify a decision or course of action' },
    'Create': { color: 'bg-purple-500', description: 'Produce new or original work' }
  };

  // Difficulty-Aware Question Templates
  // Each category has Easy, Medium, Hard variations for each mark type
  const getDifficultyTemplates = (category, marks, difficulty) => {
    const templates = {
      CODE: {
        '2': {
          Easy: [
            'Define [CONCEPT].',
            'What is [CONCEPT]?',
            'List two features of [CONCEPT].',
            'Give an example of [CONCEPT].',
            'State the purpose of [CONCEPT].',
            'What is the syntax for [CONCEPT]?',
            'Name the package containing [CONCEPT].',
            'What is the return type of [CONCEPT]?',
            'List the parameters of [CONCEPT].',
            'What does [CONCEPT] do?'
          ],
          Medium: [
            'Explain the working of [CONCEPT].',
            'What is the difference between [CONCEPT] and its alternative?',
            'When should you use [CONCEPT]?',
            'What exception does [CONCEPT] throw?',
            'Is [CONCEPT] thread-safe? Justify.',
            'What is the time complexity of [CONCEPT]?',
            'Compare [CONCEPT] with its counterpart.',
            'What are the advantages of [CONCEPT]?',
            'How does [CONCEPT] handle errors?',
            'What interface does [CONCEPT] implement?'
          ],
          'Very Hard': [
            'Propose a novel optimization for [CONCEPT] that addresses edge cases in low-level memory management.',
            'Formally verify the safety and liveness properties of [CONCEPT] in a concurrent system.',
            'Analyze the micro-architectural impact of [CONCEPT] on modern CPU caches.',
            'Justify the use of [CONCEPT] over low-level alternatives in performance-critical kernels.',
            'Critically assess the architectural debt introduced by [CONCEPT] in large-scale legacy systems.',
            'Design a zero-copy implementation of [CONCEPT] for high-throughput I/O.',
            'Compare the implementation of [CONCEPT] across multiple VM specifications (HotSpot, OpenJ9, Graal).',
            'Develop a mathematical model for the time complexity of [CONCEPT] under worst-case hardware contention.',
            'Propose a strategy to mitigate the security vulnerabilities inherent in [CONCEPT]\'s design.',
            'Evaluate the impact of [CONCEPT] on JIT compilation and speculative execution.'
          ]
        },
        '5': {
          Easy: [
            'Write a simple program to demonstrate [CONCEPT].',
            'Explain [CONCEPT] with a basic example.',
            'Show the syntax of [CONCEPT] with code.',
            'Illustrate [CONCEPT] with a diagram.',
            'Demonstrate [CONCEPT] with sample input/output.',
            'Write code to implement [CONCEPT].',
            'Explain the basic working of [CONCEPT].',
            'Show how to use [CONCEPT] in a program.',
            'Demonstrate [CONCEPT] with a flowchart.',
            'Write a program using [CONCEPT].'
          ],
          Medium: [
            'Implement [CONCEPT] using inheritance.',
            'Demonstrate [CONCEPT] with exception handling.',
            'Write code to show [CONCEPT] in multithreading.',
            'Compare [CONCEPT] with traditional approaches.',
            'Illustrate [CONCEPT] using collections framework.',
            'Show how [CONCEPT] improves code reusability.',
            'Explain [CONCEPT] with real-world scenarios.',
            'Implement [CONCEPT] using design patterns.',
            'Demonstrate error handling in [CONCEPT].',
            'Write a program showing [CONCEPT] with generics.'
          ],
          'Very Hard': [
            'Design and implement a thread-safe, non-blocking version of [CONCEPT].',
            'Develop a production-grade implementation of [CONCEPT] with full observability and fault recovery.',
            'Propose and implement a novel extension to [CONCEPT] that solves a known industry-standard limitation.',
            'Create a high-performance implementation of [CONCEPT] following the Clean Architecture and SOLID principles.',
            'Implement [CONCEPT] using advanced metaprogramming or bytecode manipulation techniques.',
            'Design a distributed version of [CONCEPT] that maintains eventual consistency.',
            'Develop [CONCEPT] with comprehensive property-based testing and formal specifications.',
            'Implement [CONCEPT] for an environment with extreme resource constraints (RTOS/Embedded).',
            'Create a polyglot implementation of [CONCEPT] that bridges two different runtime environments.',
            'Design and benchmark an implementation of [CONCEPT] that outperforms standard library equivalents.'
          ]
        },
        '10': {
          Easy: [
            'Design a simple system using [CONCEPT].',
            'Explain the architecture of [CONCEPT] with diagrams.',
            'Develop a basic application demonstrating [CONCEPT].',
            'Describe the complete workflow of [CONCEPT].',
            'Create a simple framework using [CONCEPT].',
            'Explain [CONCEPT] with multiple examples.',
            'Design a basic solution implementing [CONCEPT].',
            'Develop a prototype using [CONCEPT].',
            'Explain the lifecycle of [CONCEPT] in detail.',
            'Create a simple application with [CONCEPT].'
          ],
          Medium: [
            'Design a complete system using [CONCEPT] and explain the logic.',
            'Develop a full application demonstrating [CONCEPT] with best practices.',
            'Analyze the architectural implications of [CONCEPT] in enterprise systems.',
            'Design a scalable solution using [CONCEPT] for high-traffic scenarios.',
            'Implement [CONCEPT] with comprehensive error handling.',
            'Develop a microservices architecture using [CONCEPT].',
            'Design [CONCEPT] with database integration.',
            'Create a RESTful API using [CONCEPT].',
            'Implement [CONCEPT] in a distributed system.',
            'Design [CONCEPT] with security considerations.'
          ],
          'Very Hard': [
            'Architect a global-scale, fault-tolerant system using [CONCEPT] that handles millions of concurrent requests.',
            'Critically analyze and propose a replacement for [CONCEPT] in next-generation decentralized systems.',
            'Develop an enterprise-grade framework from scratch utilizing [CONCEPT] with zero external dependencies.',
            'Design a mission-critical system using [CONCEPT] that adheres to DO-178C or equivalent safety standards.',
            'Architect a cloud-native platform that leverages [CONCEPT] for extreme elasticity and sub-second scaling.',
            'Perform a deep-dive analysis into the kernel-level implementation of [CONCEPT] and propose a performance patch.',
            'Design a secure-by-design architecture that utilizes [CONCEPT] to mitigate advanced persistent threats (APT).',
            'Architect a high-availability cluster using [CONCEPT] with automated disaster recovery and data integrity checks.',
            'Develop a novel compiler optimization or runtime enhancement that specifically targets [CONCEPT].',
            'Design a real-time, low-latency trading engine using [CONCEPT] with deterministic execution times.'
          ]
        }
      },
      MATH: {
        '2': {
          Easy: [
            'Define [CONCEPT].',
            'State the formula for [CONCEPT].',
            'Give an example of [CONCEPT].',
            'What is [CONCEPT]?',
            'List two properties of [CONCEPT].',
            'State the principle of [CONCEPT].',
            'What is the notation for [CONCEPT]?',
            'Give the definition of [CONCEPT].',
            'State the theorem of [CONCEPT].',
            'What is the axiom of [CONCEPT]?'
          ],
          Medium: [
            'Explain the theorem of [CONCEPT].',
            'What are the conditions for [CONCEPT]?',
            'Compare [CONCEPT] with its alternative.',
            'What is the significance of [CONCEPT]?',
            'Explain the relationship between [CONCEPT] and related concepts.',
            'What are the applications of [CONCEPT]?',
            'State and explain the lemma of [CONCEPT].',
            'What is the inverse of [CONCEPT]?',
            'Explain the domain and range of [CONCEPT].',
            'What is the cardinality of [CONCEPT]?'
          ],
          'Very Hard': [
            'Analyze the computational complexity of [CONCEPT].',
            'Critically evaluate the limitations of [CONCEPT].',
            'What are the edge cases in [CONCEPT]?',
            'Compare [CONCEPT] in different mathematical contexts.',
            'Justify the necessity of [CONCEPT] in proofs.',
            'What are the implications of [CONCEPT] in advanced topics?',
            'Analyze the relationship between [CONCEPT] and number theory.',
            'Evaluate the efficiency of [CONCEPT] in algorithms.',
            'What are the counterexamples to [CONCEPT]?',
            'Critically assess the proof of [CONCEPT].'
          ]
        },
        '5': {
          Easy: [
            'Prove [CONCEPT] with a simple example.',
            'Solve a basic problem involving [CONCEPT].',
            'Illustrate [CONCEPT] with a diagram.',
            'Demonstrate [CONCEPT] with numerical examples.',
            'Explain [CONCEPT] step by step.',
            'Show the working of [CONCEPT] with an example.',
            'Verify [CONCEPT] with a simple case.',
            'Prove [CONCEPT] using direct method.',
            'Solve an equation using [CONCEPT].',
            'Demonstrate [CONCEPT] with a truth table.'
          ],
          Medium: [
            'Prove [CONCEPT] using mathematical induction.',
            'Solve a problem involving [CONCEPT] with detailed steps.',
            'Explain the theorem of [CONCEPT] with a proof.',
            'Derive the formula for [CONCEPT].',
            'Prove the uniqueness of [CONCEPT].',
            'Demonstrate [CONCEPT] with Venn diagrams.',
            'Solve a recurrence relation using [CONCEPT].',
            'Prove [CONCEPT] using contrapositive method.',
            'Apply [CONCEPT] to solve a real-world problem.',
            'Construct a proof by contradiction for [CONCEPT].'
          ],
          'Very Hard': [
            'Prove [CONCEPT] using advanced proof techniques.',
            'Derive and prove all corollaries related to [CONCEPT].',
            'Analyze [CONCEPT] in the context of combinatorial optimization.',
            'Prove the fundamental theorem of [CONCEPT] rigorously.',
            'Develop a comprehensive proof of [CONCEPT] using multiple methods.',
            'Analyze the algorithmic aspects of [CONCEPT].',
            'Prove [CONCEPT] and discuss its implications in discrete structures.',
            'Derive the mathematical foundation of [CONCEPT] in detail.',
            'Prove [CONCEPT] in the general case.',
            'Analyze the complexity bounds of [CONCEPT].'
          ]
        },
        '10': {
          Easy: [
            'Explain [CONCEPT] with multiple examples.',
            'Derive the basic formula for [CONCEPT].',
            'Prove [CONCEPT] and give applications.',
            'Explain the complete theory of [CONCEPT].',
            'Demonstrate [CONCEPT] with various cases.',
            'Derive and explain [CONCEPT] in detail.',
            'Prove [CONCEPT] with clear steps.',
            'Explain [CONCEPT] and its uses.',
            'Derive [CONCEPT] from first principles.',
            'Prove and illustrate [CONCEPT].'
          ],
          Medium: [
            'Derive the mathematical foundation of [CONCEPT] in detail.',
            'Prove the fundamental theorem of [CONCEPT] with complete derivation.',
            'Analyze the computational complexity of [CONCEPT].',
            'Discuss the historical development and modern applications of [CONCEPT].',
            'Prove [CONCEPT] and discuss its implications.',
            'Develop a complete mathematical model using [CONCEPT].',
            'Analyze [CONCEPT] in graph theory applications.',
            'Derive all related theorems of [CONCEPT].',
            'Prove [CONCEPT] using multiple approaches.',
            'Explain the relationship between [CONCEPT] and other functions.'
          ],
          'Very Hard': [
            'Critically analyze the application of [CONCEPT] in complex graph theory.',
            'Develop a comprehensive proof of [CONCEPT] with all edge cases.',
            'Analyze [CONCEPT] in cryptographic applications.',
            'Prove [CONCEPT] and extend it to the general case.',
            'Critically evaluate the efficiency of [CONCEPT] in algorithms.',
            'Develop novel applications of [CONCEPT] in modern computing.',
            'Analyze the theoretical limits of [CONCEPT].',
            'Prove [CONCEPT] and discuss open problems.',
            'Develop an optimized algorithm based on [CONCEPT].',
            'Critically assess [CONCEPT] in computational complexity theory.'
          ]
        }
      },
      SYSTEM: {
        '2': {
          Easy: [
            'What is [CONCEPT]?',
            'Define [CONCEPT].',
            'List two components of [CONCEPT].',
            'State the function of [CONCEPT].',
            'What are the types of [CONCEPT]?',
            'Give an example of [CONCEPT].',
            'What is the purpose of [CONCEPT]?',
            'List the features of [CONCEPT].',
            'What is the role of [CONCEPT]?',
            'Name two algorithms used in [CONCEPT].'
          ],
          Medium: [
            'Explain the working of [CONCEPT].',
            'What is the difference between [CONCEPT] types?',
            'Compare [CONCEPT] approaches.',
            'What are the advantages of [CONCEPT]?',
            'How does [CONCEPT] handle concurrency?',
            'What metrics measure [CONCEPT]?',
            'Explain the lifecycle of [CONCEPT].',
            'What is the overhead of [CONCEPT]?',
            'Compare [CONCEPT] in different OS.',
            'What are the scheduling policies for [CONCEPT]?'
          ],
          'Very Hard': [
            'Analyze the performance implications of [CONCEPT].',
            'Critically evaluate [CONCEPT] in distributed systems.',
            'What are the security vulnerabilities in [CONCEPT]?',
            'Analyze the trade-offs in [CONCEPT] design.',
            'What are the scalability challenges of [CONCEPT]?',
            'Evaluate [CONCEPT] in real-time systems.',
            'What are the fault tolerance mechanisms in [CONCEPT]?',
            'Analyze [CONCEPT] in cloud environments.',
            'What are the optimization strategies for [CONCEPT]?',
            'Critically assess [CONCEPT] in modern architectures.'
          ]
        },
        '5': {
          Easy: [
            'Explain [CONCEPT] with a diagram.',
            'Illustrate the architecture of [CONCEPT].',
            'Describe the working of [CONCEPT].',
            'Explain [CONCEPT] with an example.',
            'Show the structure of [CONCEPT].',
            'Demonstrate [CONCEPT] with a flowchart.',
            'Explain the basic implementation of [CONCEPT].',
            'Illustrate [CONCEPT] with state diagrams.',
            'Describe the components of [CONCEPT].',
            'Explain [CONCEPT] step by step.'
          ],
          Medium: [
            'Explain the internal working of [CONCEPT] in the kernel.',
            'Discuss the efficiency of [CONCEPT] in resource management.',
            'Compare different approaches to [CONCEPT].',
            'Explain [CONCEPT] with state transition diagrams.',
            'Discuss the implementation of [CONCEPT] in modern OS.',
            'Analyze the performance of [CONCEPT].',
            'Explain the scheduling algorithm for [CONCEPT].',
            'Discuss the synchronization mechanisms in [CONCEPT].',
            'Compare [CONCEPT] in Windows vs Linux.',
            'Explain [CONCEPT] in virtualized environments.'
          ],
          'Very Hard': [
            'Analyze the impact of [CONCEPT] on system performance.',
            'Design an optimized [CONCEPT] for embedded systems.',
            'Discuss [CONCEPT] in multi-core processor architectures.',
            'Analyze [CONCEPT] with benchmark results.',
            'Design a hybrid approach combining multiple [CONCEPT] strategies.',
            'Critically evaluate [CONCEPT] in containerized environments.',
            'Analyze the security implications of [CONCEPT].',
            'Design a fault-tolerant architecture using [CONCEPT].',
            'Discuss [CONCEPT] in real-time operating systems.',
            'Analyze [CONCEPT] in cloud computing environments.'
          ]
        },
        '10': {
          Easy: [
            'Design a basic framework for [CONCEPT].',
            'Explain [CONCEPT] with complete architecture.',
            'Develop a simple solution using [CONCEPT].',
            'Describe the complete implementation of [CONCEPT].',
            'Design [CONCEPT] with diagrams.',
            'Explain [CONCEPT] in distributed systems.',
            'Develop a prototype using [CONCEPT].',
            'Design [CONCEPT] for a simple application.',
            'Explain the evolution of [CONCEPT].',
            'Develop a basic implementation of [CONCEPT].'
          ],
          Medium: [
            'Design a technical framework for [CONCEPT] in a distributed environment.',
            'Develop a comprehensive solution for [CONCEPT] with performance analysis.',
            'Design a scalable implementation of [CONCEPT] for enterprise systems.',
            'Analyze [CONCEPT] in cloud computing environments.',
            'Design [CONCEPT] with fault tolerance mechanisms.',
            'Develop [CONCEPT] with security considerations.',
            'Design a complete architecture using [CONCEPT].',
            'Implement [CONCEPT] with load balancing.',
            'Design [CONCEPT] for microservices.',
            'Develop [CONCEPT] with monitoring capabilities.'
          ],
          'Very Hard': [
            'Explain the security implications and fault tolerance of [CONCEPT].',
            'Discuss the evolutionary changes in [CONCEPT] from traditional to modern systems.',
            'Design a fault-tolerant architecture using [CONCEPT] with formal verification.',
            'Analyze the security vulnerabilities in [CONCEPT] and propose solutions.',
            'Design [CONCEPT] for extreme scalability and performance.',
            'Develop [CONCEPT] with advanced optimization techniques.',
            'Critically evaluate [CONCEPT] in mission-critical systems.',
            'Design [CONCEPT] with comprehensive disaster recovery.',
            'Analyze [CONCEPT] in edge computing scenarios.',
            'Design a next-generation [CONCEPT] architecture.'
          ]
        }
      },
      AI: {
        '2': {
          Easy: [
            'Define [CONCEPT].',
            'What is [CONCEPT]?',
            'Give an application of [CONCEPT].',
            'List the components of [CONCEPT].',
            'State the algorithm for [CONCEPT].',
            'What is the purpose of [CONCEPT]?',
            'Name the types of [CONCEPT].',
            'What is the objective function in [CONCEPT]?',
            'Give an example of [CONCEPT].',
            'What is the heuristic for [CONCEPT]?'
          ],
          Medium: [
            'Explain the working of [CONCEPT].',
            'What are the limitations of [CONCEPT]?',
            'Compare [CONCEPT] with alternatives.',
            'What is the complexity of [CONCEPT]?',
            'Explain the evaluation metric for [CONCEPT].',
            'What are the assumptions of [CONCEPT]?',
            'Compare supervised vs unsupervised [CONCEPT].',
            'What is the learning rate in [CONCEPT]?',
            'Explain the convergence criterion for [CONCEPT].',
            'What are the hyperparameters of [CONCEPT]?'
          ],
          'Very Hard': [
            'Analyze the interpretability challenges in [CONCEPT].',
            'Critically evaluate the performance of [CONCEPT].',
            'What are the bias and fairness issues in [CONCEPT]?',
            'Analyze the scalability of [CONCEPT] for big data.',
            'Evaluate [CONCEPT] in adversarial scenarios.',
            'What are the theoretical limits of [CONCEPT]?',
            'Critically assess [CONCEPT] in production systems.',
            'Analyze the robustness of [CONCEPT].',
            'What are the ethical implications of [CONCEPT]?',
            'Evaluate [CONCEPT] in edge AI applications.'
          ]
        },
        '5': {
          Easy: [
            'Explain [CONCEPT] with a simple example.',
            'Illustrate [CONCEPT] with a flowchart.',
            'Demonstrate [CONCEPT] with basic steps.',
            'Explain the training process of [CONCEPT].',
            'Show how [CONCEPT] works with diagrams.',
            'Explain [CONCEPT] algorithm step by step.',
            'Demonstrate [CONCEPT] with a simple dataset.',
            'Illustrate [CONCEPT] with decision trees.',
            'Explain [CONCEPT] with mathematical notation.',
            'Show the basic implementation of [CONCEPT].'
          ],
          Medium: [
            'Explain the [CONCEPT] algorithm with a step-by-step example.',
            'Discuss the relevance of [CONCEPT] in cognitive modeling.',
            'Compare [CONCEPT] with other learning paradigms.',
            'Explain [CONCEPT] with mathematical formulation.',
            'Discuss the optimization techniques in [CONCEPT].',
            'Explain the backpropagation in [CONCEPT].',
            'Discuss the regularization methods for [CONCEPT].',
            'Compare [CONCEPT] with traditional ML approaches.',
            'Explain [CONCEPT] in computer vision.',
            'Discuss the evaluation metrics for [CONCEPT].'
          ],
          'Very Hard': [
            'Analyze [CONCEPT] in the context of AGI development.',
            'Design a hybrid model combining [CONCEPT] with other techniques.',
            'Discuss [CONCEPT] in adversarial machine learning.',
            'Analyze the interpretability challenges in [CONCEPT].',
            'Design an end-to-end pipeline using [CONCEPT].',
            'Discuss [CONCEPT] in transfer learning scenarios.',
            'Analyze the bias and fairness issues in [CONCEPT].',
            'Design a real-time system implementing [CONCEPT].',
            'Discuss [CONCEPT] in autonomous systems.',
            'Analyze the scalability of [CONCEPT] for big data.'
          ]
        },
        '10': {
          Easy: [
            'Explain [CONCEPT] with multiple examples.',
            'Design a simple AI system using [CONCEPT].',
            'Explain the complete workflow of [CONCEPT].',
            'Develop a basic model using [CONCEPT].',
            'Explain [CONCEPT] in detail with diagrams.',
            'Design a simple application using [CONCEPT].',
            'Explain the theory and practice of [CONCEPT].',
            'Develop a prototype using [CONCEPT].',
            'Explain [CONCEPT] and its applications.',
            'Design a basic neural network using [CONCEPT].'
          ],
          Medium: [
            'Critically evaluate the performance of [CONCEPT] in neural networks.',
            'Propose a novel improvement for the [CONCEPT] model in deep learning.',
            'Design a complete AI system using [CONCEPT].',
            'Analyze [CONCEPT] in the context of modern AI.',
            'Develop a hybrid model combining [CONCEPT].',
            'Design an end-to-end pipeline using [CONCEPT].',
            'Discuss [CONCEPT] in transfer learning.',
            'Analyze [CONCEPT] for real-world applications.',
            'Design [CONCEPT] with performance optimization.',
            'Develop [CONCEPT] with comprehensive evaluation.'
          ],
          'Very Hard': [
            'Discuss the ethical and philosophical implications of [CONCEPT] in robotics.',
            'Analyze [CONCEPT] in the context of AGI development.',
            'Design a state-of-the-art system using [CONCEPT].',
            'Critically evaluate [CONCEPT] in production AI systems.',
            'Develop novel applications of [CONCEPT] in emerging domains.',
            'Analyze the theoretical foundations of [CONCEPT].',
            'Design [CONCEPT] for extreme-scale applications.',
            'Critically assess [CONCEPT] in safety-critical systems.',
            'Develop [CONCEPT] with formal verification.',
            'Analyze [CONCEPT] in the context of AI alignment.'
          ]
        }
      },
      DEFAULT: {
        '2': {
          Easy: ['Define [CONCEPT].', 'What is [CONCEPT]?', 'List features of [CONCEPT].', 'Give an example of [CONCEPT].', 'State the purpose of [CONCEPT].'],
          Medium: ['Explain [CONCEPT].', 'Compare [CONCEPT] with alternatives.', 'What are the advantages of [CONCEPT]?', 'Discuss the importance of [CONCEPT].', 'Analyze [CONCEPT].'],
          'Very Hard': ['Critically evaluate [CONCEPT].', 'Analyze the limitations of [CONCEPT].', 'Assess [CONCEPT] in modern context.', 'Evaluate the impact of [CONCEPT].', 'Justify the use of [CONCEPT].']
        },
        '5': {
          Easy: ['Explain [CONCEPT] with a diagram.', 'Illustrate [CONCEPT].', 'Describe [CONCEPT].', 'Show [CONCEPT] with examples.', 'Demonstrate [CONCEPT].'],
          Medium: ['Discuss [CONCEPT] in detail.', 'Compare different approaches to [CONCEPT].', 'Analyze the implementation of [CONCEPT].', 'Explain the methodology of [CONCEPT].', 'Discuss applications of [CONCEPT].'],
          'Very Hard': ['Critically analyze [CONCEPT].', 'Design an innovative approach to [CONCEPT].', 'Evaluate [CONCEPT] in complex scenarios.', 'Develop advanced solutions using [CONCEPT].', 'Assess [CONCEPT] with empirical evidence.']
        },
        '10': {
          Easy: ['Explain [CONCEPT] comprehensively.', 'Design a basic framework for [CONCEPT].', 'Develop a solution using [CONCEPT].', 'Explain [CONCEPT] with multiple examples.', 'Describe [CONCEPT] in detail.'],
          Medium: ['Design a framework for [CONCEPT].', 'Develop a complete solution using [CONCEPT].', 'Analyze [CONCEPT] in modern context.', 'Discuss [CONCEPT] with industry examples.', 'Design a comprehensive model of [CONCEPT].'],
          'Very Hard': ['Critically evaluate [CONCEPT].', 'Design an innovative approach to [CONCEPT].', 'Analyze the theoretical foundations of [CONCEPT].', 'Develop novel applications of [CONCEPT].', 'Critically assess [CONCEPT] with research perspective.']
        }
      }
    };

    return templates[category]?.[marks]?.[difficulty] || templates['DEFAULT'][marks][difficulty];
  };

  const getRandomQuestions = (subjectCode, unit, difficulty, marks, count) => {
    // Fisher-Yates shuffle for true randomization
    const fisherYatesShuffle = (array) => {
      if (!array || !Array.isArray(array)) return [];
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const subjectData = questionBank[subjectCode] || questionBank['DEFAULT'];
    const category = subjectData.category || 'DEFAULT';
    const concepts = subjectData[unit] || subjectData['Unit 1'] || ['Relevant Concept'];

    // Pick templates based on category and difficulty
    const templates = getDifficultyTemplates(category, marks, difficulty);

    // Bloom's taxonomy assignment based on marks
    const bloomsMapping = {
      '2': ['Remember', 'Understand'],
      '5': ['Understand', 'Apply', 'Analyze'],
      '10': ['Analyze', 'Evaluate', 'Create']
    };

    // Time estimation (minutes per mark + complexity factor)
    const timePerMark = {
      'Easy': 1.5,
      'Medium': 2,
      'Very Hard': 3.0
    };

    // Enhanced entropy: Shuffle concepts and templates individually before building the pool
    const shuffledConcepts = fisherYatesShuffle(concepts);
    const shuffledTemplates = fisherYatesShuffle(templates);

    const rawPool = [];
    shuffledConcepts.forEach(concept => {
      shuffledTemplates.forEach(template => {
        const questionText = template.replace('[CONCEPT]', concept);
        const bloomsOptions = bloomsMapping[marks];
        const bloomsLevel = bloomsOptions[Math.floor(Math.random() * bloomsOptions.length)];
        const estimatedTime = Math.ceil(parseInt(marks) * timePerMark[difficulty]);

        // Generate answer key hint
        const answerHint = generateAnswerHint(questionText, concept, marks, category);

        rawPool.push({
          text: questionText,
          concept: concept,
          bloomsLevel: bloomsLevel,
          estimatedTime: estimatedTime,
          answerHint: answerHint
        });
      });
    });

    // Triple shuffle for maximum entropy and variety
    let shuffled = fisherYatesShuffle(rawPool);
    shuffled = fisherYatesShuffle(shuffled);
    shuffled = fisherYatesShuffle(shuffled);

    // Select unique questions
    const selected = [];
    const usedTexts = new Set();

    for (let i = 0; i < shuffled.length && selected.length < count; i++) {
      const item = shuffled[i];
      // Ensure uniqueness by checking question text
      if (!usedTexts.has(item.text)) {
        selected.push(item);
        usedTexts.add(item.text);
      }
    }

    // Fill remaining slots if needed with randomized fallbacks
    while (selected.length < count) {
      const fallbackBlooms = bloomsMapping[marks];
      const randomConcept = concepts[Math.floor(Math.random() * concepts.length)];
      selected.push({
        text: `Analyze the high-level technical implications and practical use-cases of ${randomConcept} in modern engineering contexts.`,
        concept: randomConcept,
        bloomsLevel: fallbackBlooms[Math.floor(Math.random() * fallbackBlooms.length)],
        estimatedTime: Math.ceil(parseInt(marks) * timePerMark[difficulty]),
        answerHint: `Discuss the architecture, implementation challenges, and strategic importance of ${randomConcept}.`
      });
    }

    return selected.map(item => ({
      ...item,
      marks: parseInt(marks)
    }));
  };

  // Generate answer key hints
  const generateAnswerHint = (question, concept, marks, category) => {
    const lowerQ = question.toLowerCase();

    if (lowerQ.includes('define') || lowerQ.includes('what is')) {
      return `Provide a clear definition of ${concept}, including key characteristics and context.`;
    } else if (lowerQ.includes('explain') || lowerQ.includes('describe')) {
      return `Explain ${concept} with detailed description, examples, and diagrams where applicable.`;
    } else if (lowerQ.includes('differentiate') || lowerQ.includes('compare')) {
      return `Create a comparison table highlighting key differences and similarities.`;
    } else if (lowerQ.includes('program') || lowerQ.includes('code')) {
      return `Write clean, well-commented code demonstrating ${concept}. Include input/output examples.`;
    } else if (lowerQ.includes('prove') || lowerQ.includes('derive')) {
      return `Provide step-by-step mathematical proof with clear logical progression.`;
    } else if (lowerQ.includes('design') || lowerQ.includes('create')) {
      return `Design a comprehensive solution with architecture diagrams, algorithms, and implementation details.`;
    } else if (lowerQ.includes('analyze') || lowerQ.includes('evaluate')) {
      return `Critically analyze ${concept}, discussing advantages, disadvantages, and real-world applications.`;
    } else {
      return `Provide a comprehensive answer covering theory, examples, and practical applications of ${concept}.`;
    }
  };


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

  const generatePaper = async () => {
    setIsGenerating(true);
    setAuditResults(null);
    setShowAudit(false);
    try {
      let allQuestions = [];
      let paperDifficulty = settings.difficulty;

      let prompt = '';
      if (generationMode === 'Adaptive') {
        // ── Adaptive mode: let the backend do everything ──
        const token = localStorage.getItem('token');
        const res = await api.post('/adaptive/generate', {
          subjectCode: settings.subjectCode,
          unit: settings.unit,
          totalQuestions: adaptiveSettings.totalQuestions,
          marksPattern: adaptiveSettings.marksPattern,
          syllabusContext,
          forceRefresh: adaptiveSettings.forceRefresh,
        });
        const data = res.data;
        if (!data.success) throw new Error(data.error || 'Adaptive generation failed');

        const p = data.paper;
        // Normalise field names so the existing renderer works
        allQuestions = (p.questions || []).map(q => ({
          text: q.question,
          concept: q.topic,
          marks: q.marks,
          difficulty: q.difficulty,
          bloomsLevel: q.bloomsLevel || 'Apply',
          estimatedTime: q.estimatedTime || q.marks * 2,
          answerHint: q.answerHint || '',
        }));
        paperDifficulty = 'Adaptive';

        // Update the live distribution preview with actual values
        if (data.difficultyProfile) setAdaptiveDistPreview(data.difficultyProfile);
        if (data.adaptationFlags) setAdaptationFlags(data.adaptationFlags);
        if (data.adaptationSummary) setAdaptationSummary(data.adaptationSummary);

      } else if (generationMode === 'AI') {
        prompt = `Using ONLY the syllabus content below, generate a question paper.

Syllabus Content:
${syllabusContent || "General engineering knowledge"}

Requirements:
- Subject: ${settings.subject}
- Topics: ${settings.unit}
- Total Marks: ${(settings.count2m * 2) + (settings.count5m * 5) + (settings.count10m * 10)}
- Difficulty Distribution:
  Easy: ${settings.easyCount}
  Medium: ${settings.mediumCount}
  Hard: ${settings.hardCount}

Question Types:
- 2 marks → definitions / short answers
- 5 marks → conceptual explanations
- 10 marks → analytical questions

Output format (JSON):
[
  {
    "question": "string",
    "marks": number,
    "difficulty": "Easy|Medium|Hard",
    "topic": "string"
  }
]

IMPORTANT: Return ONLY the JSON array. Ensure the distribution matches the requirements as closely as possible.`;
      } else if (generationMode === 'Practice') {
        prompt = `Generate a focused practice test for the subject "${settings.subject}" based on these requirements:

A student is weak in the following topics:
${weakTopics}

Moderate/Strong topics for confidence:
${strongTopics || "Related prerequisite concepts"}

The test must:
- Prioritizes weak topics (70%)
- Includes some strong topics (30%) for confidence
- Uses medium difficulty primarily
- Includes at least one hard analytical question

Total Questions: ${practiceSettings.totalQuestions}
Marks Pattern: ${practiceSettings.marksPattern}

Output format (JSON):
[
  {
    "question": "string",
    "marks": number,
    "difficulty": "Easy|Medium|Hard",
    "topic": "string"
  }
]

IMPORTANT: Return ONLY the JSON array. Output JSON with topic and difficulty tags as specified.`;
      }

      if (generationMode === 'AI' || generationMode === 'Practice') {
        const response = await aiService.chat(prompt, []);
        if (response.success) {
          // Extract JSON from response (sometimes AI wraps or adds text)
          const jsonMatch = response.message.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const aiQuestions = JSON.parse(jsonMatch[0]);

            // Map AI questions to app format
            allQuestions = aiQuestions.map(q => {
              const difficultyLvl = q.difficulty || 'Medium';
              const timePerMark = { 'Easy': 1.5, 'Medium': 2, 'Hard': 3.0, 'Very Hard': 3.0 };
              const marks = parseInt(q.marks) || 2;

              // Map Blooms based on marks if not provided
              const bloomsMapping = {
                '2': ['Remember', 'Understand'],
                '5': ['Understand', 'Apply', 'Analyze'],
                '10': ['Analyze', 'Evaluate', 'Create']
              };
              const bloomsOptions = bloomsMapping[marks.toString()] || ['Apply'];
              const bloomsLevel = bloomsOptions[Math.floor(Math.random() * bloomsOptions.length)];

              return {
                text: q.question,
                concept: q.topic,
                marks: marks,
                difficulty: difficultyLvl,
                bloomsLevel: bloomsLevel,
                estimatedTime: Math.ceil(marks * (timePerMark[difficultyLvl] || 2)),
                answerHint: generateAnswerHint(q.question, q.topic, marks, 'DEFAULT')
              };
            });
            paperDifficulty = generationMode === 'Practice' ? 'Focused Practice' : 'AI Generated';
          } else {
            throw new Error("AI response did not contain valid JSON");
          }
        } else {
          throw new Error(response.message);
        }
      } else {
        // Local Generation
        const q2 = getRandomQuestions(settings.subjectCode, settings.unit, settings.difficulty, '2', settings.count2m);
        const q5 = getRandomQuestions(settings.subjectCode, settings.unit, settings.difficulty, '5', settings.count5m);
        const q10 = getRandomQuestions(settings.subjectCode, settings.unit, settings.difficulty, '10', settings.count10m);
        allQuestions = [...q2, ...q5, ...q10];
      }

      // Calculate analytics
      const totalTime = allQuestions.reduce((sum, q) => sum + (q.estimatedTime || 0), 0);
      const bloomsDistribution = {};
      const topicCoverage = {};

      allQuestions.forEach(q => {
        bloomsDistribution[q.bloomsLevel] = (bloomsDistribution[q.bloomsLevel] || 0) + 1;
        topicCoverage[q.concept] = (topicCoverage[q.concept] || 0) + 1;
      });

      const newPaper = {
        id: Date.now(),
        title: `${settings.subject} (${settings.subjectCode})`,
        semester: settings.semester,
        unit: settings.unit,
        difficulty: paperDifficulty,
        questions: allQuestions,
        maxMarks: allQuestions.reduce((sum, q) => sum + q.marks, 0),
        generatedAt: new Date().toISOString(),
        analytics: {
          totalTime: totalTime,
          bloomsDistribution: bloomsDistribution,
          topicCoverage: topicCoverage,
          questionCount: allQuestions.length
        }
      };

      setPaper(newPaper);

      // Save to history
      const updatedHistory = [newPaper, ...paperHistory].slice(0, 10);
      setPaperHistory(updatedHistory);
      localStorage.setItem('questionPaperHistory', JSON.stringify(updatedHistory));

    } catch (error) {
      console.error("Failed to generate paper:", error);
      alert("An error occurred during paper generation: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const auditPaper = async () => {
    if (!paper || !syllabusContent) {
      alert("Please ensure you have generated a paper and provided syllabus content for auditing.");
      return;
    }
    setIsAuditing(true);
    setShowAudit(true);
    try {
      const evaluationPrompt = `Evaluate the following question paper based on:

1. Relevance to syllabus (0–5)
2. Topic coverage (percentage)
3. Difficulty match (Easy/Medium/Hard accuracy)
4. Repetition check
5. Hallucination risk (Yes/No)

Syllabus Content:
${syllabusContent}

Question Paper:
${JSON.stringify(paper.questions.map(q => ({ q: q.text, m: q.marks, d: q.difficulty, t: q.concept })))}

Output JSON ONLY:
{
  "relevance_score": "number 0-5",
  "coverage_percentage": "string",
  "difficulty_match": "string",
  "repetition": "string",
  "hallucination_flag": "Yes/No"
}

IMPORTANT: Return ONLY the raw JSON object.`;

      const response = await aiService.chat(evaluationPrompt, []);
      if (response.success) {
        const jsonMatch = response.message.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          setAuditResults(JSON.parse(jsonMatch[0]));
        }
      }
    } catch (error) {
      console.error("Audit failed:", error);
    } finally {
      setIsAuditing(false);
    }
  };

  // Export functions
  const exportAsJSON = () => {
    if (!paper) return;
    const dataStr = JSON.stringify(paper, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${paper.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`;
    link.click();
  };

  const exportAsText = () => {
    if (!paper) return;
    let textContent = `${paper.title}\n`;
    textContent += `${'='.repeat(paper.title.length)}\n\n`;
    textContent += `Semester: ${paper.semester} | Unit: ${paper.unit} | Difficulty: ${paper.difficulty}\n`;
    textContent += `Max Marks: ${paper.maxMarks} | Estimated Time: ${paper.analytics.totalTime} minutes\n\n`;

    textContent += `PART A - Short Answer Questions\n${'-'.repeat(40)}\n`;
    paper.questions.filter(q => q.marks === 2).forEach((q, i) => {
      textContent += `${i + 1}. ${q.text} [${q.marks}M]\n`;
      textContent += `   Bloom's Level: ${q.bloomsLevel} | Time: ${q.estimatedTime} min\n\n`;
    });

    textContent += `\nPART B - Descriptive Questions\n${'-'.repeat(40)}\n`;
    const shortCount = paper.questions.filter(q => q.marks === 2).length;
    paper.questions.filter(q => q.marks > 2).forEach((q, i) => {
      textContent += `${shortCount + i + 1}. ${q.text} [${q.marks}M]\n`;
      textContent += `   Bloom's Level: ${q.bloomsLevel} | Time: ${q.estimatedTime} min\n`;
      if (showAnswerKey) {
        textContent += `   Answer Hint: ${q.answerHint}\n`;
      }
      textContent += `\n`;
    });

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${paper.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.txt`;
    link.click();
  };


  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 print:space-y-0">
      <style>{`
        @media print {
          @page { margin: 1cm; }
          body { background: white !important; }
          nav, aside, header:not(.paper-header), .no-print { display: none !important; }
          .max-w-7xl { max-width: none !important; width: 100% !important; margin: 0 !important; }
          .animate-in { animation: none !important; transform: none !important; }
        }
      `}</style>
      <header className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BookOpen className="text-purple-400" size={32} />
            AI Question Generator Pro
          </h1>
          <p className="text-slate-400 mt-2">Advanced exam preparation with Bloom's Taxonomy & Answer Keys</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${showAnalytics
              ? 'bg-purple-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
          >
            <BarChart3 size={18} />
            Analytics
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${showHistory
              ? 'bg-purple-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
          >
            <History size={18} />
            History ({paperHistory.length})
          </button>
          {paper && (
            <button
              onClick={() => setShowAnswerKey(!showAnswerKey)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${showAnswerKey
                ? 'bg-green-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
            >
              <Lightbulb size={18} />
              {showAnswerKey ? 'Hide' : 'Show'} Hints
            </button>
          )}
        </div>
      </header>

      {/* Audit Panel */}
      {showAudit && (
        <div className="bg-gradient-to-br from-indigo-900/20 to-emerald-900/20 border border-indigo-500/30 rounded-2xl p-6 animate-in slide-in-from-top-4 print:hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="text-emerald-400" size={24} />
              AI Quality Audit Report
            </h2>
            <button onClick={() => setShowAudit(false)} className="text-slate-500 hover:text-white text-xs font-bold uppercase transition-all">Dismiss</button>
          </div>

          {isAuditing ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] animate-pulse">Running Deep Verification...</p>
            </div>
          ) : auditResults ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Relevance</p>
                <p className="text-3xl font-black text-white">{auditResults.relevance_score}<span className="text-sm text-slate-500">/5</span></p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Coverage</p>
                <p className="text-2xl font-black text-emerald-400 uppercase">{auditResults.coverage_percentage}</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Diff Match</p>
                <p className="text-sm font-bold text-blue-400 leading-tight">{auditResults.difficulty_match}</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Duplicates</p>
                <p className={`text-sm font-bold leading-tight ${auditResults.repetition?.toLowerCase().includes('no') ? 'text-green-400' : 'text-orange-400'}`}>
                  {auditResults.repetition}
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Hallucination</p>
                <div className="flex items-center justify-center gap-1.5">
                  <span className={`text-xl font-black uppercase ${auditResults.hallucination_flag?.toLowerCase() === 'no' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {auditResults.hallucination_flag}
                  </span>
                  {auditResults.hallucination_flag?.toLowerCase() !== 'no' && <AlertTriangle size={16} className="text-rose-400" />}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">Failed to retrieve audit data. Please try again.</div>
          )}
        </div>
      )}

      {/* Analytics Panel */}
      {showAnalytics && paper && (
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-2xl p-6 animate-in slide-in-from-top-4 print:hidden">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
            <BarChart3 className="text-purple-400" size={24} />
            Paper Analytics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Time Estimation */}
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-2 text-blue-400 mb-3">
                <Clock size={20} />
                <h3 className="font-bold text-sm">Time Estimation</h3>
              </div>
              <p className="text-3xl font-black text-white">{paper.analytics.totalTime} <span className="text-sm text-slate-400">min</span></p>
              <p className="text-xs text-slate-500 mt-1">Recommended completion time</p>
            </div>

            {/* Question Distribution */}
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-2 text-green-400 mb-3">
                <Target size={20} />
                <h3 className="font-bold text-sm">Questions</h3>
              </div>
              <p className="text-3xl font-black text-white">{paper.analytics.questionCount}</p>
              <p className="text-xs text-slate-500 mt-1">Total questions • {paper.maxMarks} marks</p>
            </div>

            {/* Difficulty Level */}
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-2 text-orange-400 mb-3">
                <Zap size={20} />
                <h3 className="font-bold text-sm">Difficulty</h3>
              </div>
              <p className="text-3xl font-black text-white">{paper.difficulty}</p>
              <p className="text-xs text-slate-500 mt-1">Cognitive complexity level</p>
            </div>
          </div>

          {/* Bloom's Taxonomy Distribution */}
          <div className="mt-6 bg-slate-900/50 rounded-xl p-4 border border-slate-700">
            <h3 className="font-bold text-white flex items-center gap-2 mb-4">
              <Brain className="text-purple-400" size={20} />
              Bloom's Taxonomy Distribution
            </h3>
            <div className="space-y-2">
              {Object.entries(paper.analytics.bloomsDistribution).map(([level, count]) => (
                <div key={level} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${bloomsLevels[level]?.color || 'bg-gray-500'}`}></div>
                  <span className="text-sm text-slate-300 w-24">{level}</span>
                  <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${bloomsLevels[level]?.color || 'bg-gray-500'}`}
                      style={{ width: `${(count / paper.analytics.questionCount) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-slate-400 w-12 text-right">{count} Qs</span>
                </div>
              ))}
            </div>
          </div>

          {/* Topic Coverage */}
          <div className="mt-6 bg-slate-900/50 rounded-xl p-4 border border-slate-700">
            <h3 className="font-bold text-white flex items-center gap-2 mb-4">
              <TrendingUp className="text-green-400" size={20} />
              Topic Coverage
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(paper.analytics.topicCoverage).map(([topic, count]) => (
                <div key={topic} className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                  <span className="text-sm text-slate-300">{topic}</span>
                  <span className="ml-2 text-xs text-purple-400 font-bold">×{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* History Panel */}
      {showHistory && (
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-slate-700 rounded-2xl p-6 animate-in slide-in-from-top-4 print:hidden">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
            <History className="text-blue-400" size={24} />
            Paper History
          </h2>
          {paperHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No papers generated yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paperHistory.map((h) => (
                <div key={h.id} className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl hover:border-purple-500/50 transition-all cursor-pointer group" onClick={() => { setPaper(h); setShowHistory(false); }}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-[10px] font-bold uppercase">{h.difficulty}</span>
                    <span className="text-[10px] text-slate-500">{new Date(h.generatedAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-1">{h.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{h.unit} • {h.maxMarks} Marks</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block">
        {/* Settings Panel */}
        <div className="space-y-6 print:hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between gap-2 text-white font-bold mb-2">
              <div className="flex items-center gap-2">
                <Settings2 size={20} className="text-purple-400" />
                Paper Configuration
              </div>
              <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                <button
                  onClick={() => setGenerationMode('Manual')}
                  className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all ${generationMode === 'Manual' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Manual
                </button>
                <button
                  onClick={() => setGenerationMode('AI')}
                  className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all ${generationMode === 'AI' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  AI Mode
                </button>
                <button
                  onClick={() => setGenerationMode('Practice')}
                  className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all ${generationMode === 'Practice' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Practice
                </button>
                <button
                  onClick={() => setGenerationMode('Adaptive')}
                  className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all ${generationMode === 'Adaptive' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Adaptive
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Syllabus Content (Visible for AI/Practice or Audit) */}
              {(generationMode === 'AI' || generationMode === 'Practice' || (paper && !isGenerating)) && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Brain size={14} className="text-indigo-400" />
                    Syllabus / Reference Content
                  </label>
                  <textarea
                    value={syllabusContent}
                    onChange={(e) => setSyllabusContent(e.target.value)}
                    placeholder="Paste syllabus chunks, textbooks, or notes for AI generation and Quality Audit..."
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-indigo-500 h-32 resize-none scrollbar-thin scrollbar-thumb-slate-700"
                  />
                  {paper && !syllabusContent && (
                    <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded flex gap-2 items-start">
                      <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-400 leading-tight">Paste syllabus chunks above to enable the AI Quality Audit for this paper.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Practice Test Inputs (Practice Mode only) */}
              {generationMode === 'Practice' && (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Target size={14} className="text-emerald-400" />
                      Weak Topics
                    </label>
                    <textarea
                      value={weakTopics}
                      onChange={(e) => setWeakTopics(e.target.value)}
                      placeholder="e.g. Backpropagation, CNN Architecture..."
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-emerald-500 h-20 resize-none scrollbar-thin scrollbar-thumb-slate-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-blue-400" />
                      Strong Topics (Optional)
                    </label>
                    <textarea
                      value={strongTopics}
                      onChange={(e) => setStrongTopics(e.target.value)}
                      placeholder="e.g. Linear Regression, Perceptrons..."
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-blue-500 h-20 resize-none scrollbar-thin scrollbar-thumb-slate-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Qs</label>
                      <input
                        type="number"
                        value={practiceSettings.totalQuestions}
                        onChange={(e) => setPracticeSettings({ ...practiceSettings, totalQuestions: parseInt(e.target.value) })}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pattern</label>
                      <input
                        type="text"
                        value={practiceSettings.marksPattern}
                        onChange={(e) => setPracticeSettings({ ...practiceSettings, marksPattern: e.target.value })}
                        placeholder="Mixed..."
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Adaptive Mode Inputs */}
              {generationMode === 'Adaptive' && (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                  {/* Performance Insight Card */}
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp size={12} className="text-orange-400" />
                      Student Performance Insight
                    </h4>

                    {isLoadingProfile ? (
                      <div className="flex items-center gap-2 py-2">
                        <Loader2 size={12} className="animate-spin text-orange-400" />
                        <span className="text-[10px] text-slate-400 italic">Analysing your academic history...</span>
                      </div>
                    ) : adaptiveProfile ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/30">
                          <p className="text-[9px] text-slate-500 uppercase">Overall Avg</p>
                          <p className="text-lg font-black text-white">{adaptiveProfile.overallAvgPct}%</p>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/30">
                          <p className="text-[9px] text-slate-500 uppercase">Attendance</p>
                          <p className="text-lg font-black text-white">{adaptiveProfile.attendanceRate}%</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-500 italic">No performance data found yet.</p>
                    )}

                    {adaptationSummary && (
                      <div className="mt-2 text-[10px] leading-relaxed text-slate-400 bg-orange-500/5 p-2 rounded border border-orange-500/10">
                        <span className="font-bold text-orange-400">Adaptation: </span>
                        {adaptationSummary}
                      </div>
                    )}
                  </div>

                  {/* Adaptive Distribution Preview */}
                  {adaptiveDistPreview && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Calculated Distribution</label>
                      <div className="h-4 w-full bg-slate-800 rounded-full flex overflow-hidden border border-slate-700">
                        <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${adaptiveDistPreview.easyPct}%` }} title={`Easy: ${adaptiveDistPreview.easyPct}%`}></div>
                        <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${adaptiveDistPreview.mediumPct}%` }} title={`Medium: ${adaptiveDistPreview.mediumPct}%`}></div>
                        <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${adaptiveDistPreview.hardPct}%` }} title={`Hard: ${adaptiveDistPreview.hardPct}%`}></div>
                      </div>
                      <div className="flex justify-between text-[9px] font-bold text-slate-500 px-1">
                        <span className="text-emerald-400">Easy {adaptiveDistPreview.easyCount}</span>
                        <span className="text-blue-400">Medium {adaptiveDistPreview.mediumCount}</span>
                        <span className="text-rose-400">Hard {adaptiveDistPreview.hardCount}</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Qs</label>
                      <input
                        type="number"
                        min="5"
                        max="30"
                        value={adaptiveSettings.totalQuestions}
                        onChange={(e) => setAdaptiveSettings({ ...adaptiveSettings, totalQuestions: parseInt(e.target.value) || 15 })}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        Pattern <HelpCircle size={10} className="text-slate-600" title="2m-5m-10m counts" />
                      </label>
                      <input
                        type="text"
                        value={adaptiveSettings.marksPattern}
                        onChange={(e) => setAdaptiveSettings({ ...adaptiveSettings, marksPattern: e.target.value })}
                        placeholder="5-3-2"
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500 text-center"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={adaptiveSettings.forceRefresh}
                      onChange={(e) => setAdaptiveSettings({ ...adaptiveSettings, forceRefresh: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-800 text-orange-500 focus:ring-orange-500/20"
                    />
                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-300 transition-colors uppercase">Force Re-generate</span>
                  </label>
                </div>
              )}
              {/* Semester Select */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Semester</label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 4, 5, 6, 7].map((sem) => (
                    <button
                      key={sem}
                      onClick={() => handleSemesterChange(sem)}
                      className={`py-2 rounded-lg text-sm font-bold transition-all ${settings.semester == sem
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
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
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
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
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-slate-800 my-4"></div>

              {/* Counts */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">2 Marks</label>
                  <input
                    type="number"
                    value={settings.count2m}
                    onChange={(e) => setSettings({ ...settings, count2m: parseInt(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">5 Marks</label>
                  <input
                    type="number"
                    value={settings.count5m}
                    onChange={(e) => setSettings({ ...settings, count5m: parseInt(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">10 Marks</label>
                  <input
                    type="number"
                    value={settings.count10m}
                    onChange={(e) => setSettings({ ...settings, count10m: parseInt(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                  {generationMode === 'AI' ? 'Difficulty Distribution' : 'Target Difficulty'}
                  {generationMode === 'AI' && (
                    <span className="text-[10px] text-blue-400 normal-case font-medium">Total Qs: {settings.easyCount + settings.mediumCount + settings.hardCount}</span>
                  )}
                </label>
                {generationMode === 'AI' ? (
                  <div className="grid grid-cols-3 gap-2 animate-in slide-in-from-top-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-600 uppercase text-center block">Easy</label>
                      <input
                        type="number"
                        value={settings.easyCount}
                        onChange={(e) => setSettings({ ...settings, easyCount: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-600 uppercase text-center block">Medium</label>
                      <input
                        type="number"
                        value={settings.mediumCount}
                        onChange={(e) => setSettings({ ...settings, mediumCount: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-600 uppercase text-center block">Hard</label>
                      <input
                        type="number"
                        value={settings.hardCount}
                        onChange={(e) => setSettings({ ...settings, hardCount: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {['Easy', 'Medium', 'Very Hard'].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setSettings({ ...settings, difficulty: lvl })}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${settings.difficulty === lvl
                          ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={generatePaper}
              disabled={isGenerating}
              className={`w-full py-4 rounded-xl font-black text-white transition-all flex items-center justify-center gap-2 mt-6 ${isGenerating
                ? 'bg-slate-800 cursor-not-allowed'
                : generationMode === 'Practice'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-xl shadow-emerald-500/20'
                  : generationMode === 'AI'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-500/20'
                    : generationMode === 'Adaptive'
                      ? 'bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-500 hover:to-rose-500 shadow-xl shadow-orange-500/20'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-xl shadow-purple-500/20'
                }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  <span>{generationMode === 'AI' ? 'AI is Thinking...' : generationMode === 'Practice' ? 'AI Customizing Test...' : generationMode === 'Adaptive' ? 'AI Adapting to Performance...' : 'Processing...'}</span>
                </>
              ) : (
                <>
                  {generationMode === 'Practice' ? <Target size={24} /> : generationMode === 'AI' ? <Sparkles size={24} /> : generationMode === 'Adaptive' ? <Brain size={24} /> : <Zap size={24} />}
                  <span>{generationMode === 'Practice' ? 'Generate Focused Practice Test' : generationMode === 'AI' ? 'Generate AI Question Paper' : generationMode === 'Adaptive' ? 'Generate Adaptive Paper' : 'Generate Question Paper'}</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Lightbulb size={18} className="text-yellow-400" />
              Teacher Tips
            </h3>
            <ul className="space-y-3">
              <li className="flex gap-3 text-xs text-slate-400">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1 shrink-0"></div>
                Mix difficulty levels for better student assessment.
              </li>
              <li className="flex gap-3 text-xs text-slate-400">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1 shrink-0"></div>
                Answer keys provide points of evaluation for grading.
              </li>
              <li className="flex gap-3 text-xs text-slate-400">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1 shrink-0"></div>
                Export as JSON to save and share with other faculty.
              </li>
            </ul>
          </div>
        </div>

        {/* Paper Display */}
        <div className="lg:col-span-2 print:w-full">
          {isGenerating ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-6 h-full min-h-[600px]">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-400" size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Generating Paper</h3>
                <p className="text-slate-400 mt-2 max-w-sm">Applying Bloom's Taxonomy and selecting unique questions from the syllabus...</p>
              </div>
            </div>
          ) : paper ? (
            <div className="bg-white text-slate-900 rounded-3xl overflow-hidden flex flex-col h-full min-h-[800px] shadow-2xl animate-in zoom-in-95 duration-500 print:shadow-none print:rounded-none">
              <div className="p-8 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <h2 className="font-black text-2xl tracking-tight">{paper.title}</h2>
                  <p className="text-sm text-slate-500 font-bold mt-1">
                    Semester: {paper.semester} • {paper.unit} • Max Marks: {paper.maxMarks}
                  </p>
                </div>
                <div className="flex gap-2 print:hidden">
                  <button
                    onClick={auditPaper}
                    disabled={isAuditing}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg ${isAuditing
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500'
                      }`}
                  >
                    {isAuditing ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
                    {isAuditing ? 'Auditing...' : 'Quality Audit'}
                  </button>
                  <button onClick={exportAsJSON} className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                    <FileJson size={20} />
                  </button>
                  <button onClick={exportAsText} className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                    <FileText size={20} />
                  </button>
                  <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg">
                    <Download size={20} />
                    Download PDF
                  </button>
                </div>
              </div>

              <div className="p-10 flex-1 overflow-y-auto print:overflow-visible">
                <div className="space-y-12 max-w-3xl mx-auto">
                  {/* PART A */}
                  <section>
                    <div className="flex justify-between items-end border-b-2 border-slate-900 pb-2 mb-6">
                      <h3 className="font-black text-lg uppercase tracking-wider">Part A — Knowledge & Recall</h3>
                      <span className="text-sm font-bold text-slate-500">Short Answer Questions</span>
                    </div>
                    <div className="space-y-8">
                      {paper.questions.filter(q => q.marks === 2).map((q, i) => (
                        <div key={i} className="group relative">
                          <div className="flex justify-between gap-4">
                            <p className="font-bold leading-relaxed">
                              <span className="text-slate-400 mr-4 font-black">{i + 1}.</span>
                              {q.text}
                            </p>
                            <span className="font-black text-sm shrink-0 mt-1">[2]</span>
                          </div>
                          <div className="mt-3 flex gap-4 text-[10px] items-center">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-white ${bloomsLevels[q.bloomsLevel]?.color}`}>
                              Bloom: {q.bloomsLevel}
                            </span>
                            <span className="font-bold text-slate-400 flex items-center gap-1">
                              <Clock size={12} /> {q.estimatedTime} min
                            </span>
                          </div>
                          {showAnswerKey && (
                            <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100 animate-in slide-in-from-left-2 transition-all">
                              <p className="text-xs font-bold text-green-800 flex items-center gap-2 mb-1">
                                <CheckCircle2 size={12} /> Evaluation Hint:
                              </p>
                              <p className="text-xs text-green-700 italic leading-relaxed">{q.answerHint}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* PART B */}
                  <section>
                    <div className="flex justify-between items-end border-b-2 border-slate-900 pb-2 mb-6">
                      <h3 className="font-black text-lg uppercase tracking-wider">Part B — Application & Analysis</h3>
                      <span className="text-sm font-bold text-slate-500">Descriptive Studies</span>
                    </div>
                    <div className="space-y-10">
                      {paper.questions.filter(q => q.marks > 2).map((q, i) => (
                        <div key={i} className="group relative">
                          <div className="flex justify-between gap-4">
                            <p className="font-black text-lg leading-snug">
                              <span className="text-slate-300 mr-4 font-black">{paper.questions.filter(f => f.marks === 2).length + i + 1}.</span>
                              {q.text}
                            </p>
                            <span className="font-black text-lg shrink-0">[{q.marks}]</span>
                          </div>
                          <div className="mt-4 flex gap-6 text-[11px] items-center">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-sm ${bloomsLevels[q.bloomsLevel]?.color}`}></div>
                              <span className="font-black text-slate-500 uppercase">Level: {q.bloomsLevel}</span>
                            </div>
                            <span className="font-black text-slate-400 flex items-center gap-1 uppercase tracking-tighter">
                              <Clock size={14} /> Est. Time: {q.estimatedTime} Minutes
                            </span>
                          </div>
                          {showAnswerKey && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 animate-in slide-in-from-left-2 transition-all">
                              <p className="text-xs font-black text-blue-800 flex items-center gap-2 mb-2">
                                <Zap size={14} /> Instructor Answer Guidelines:
                              </p>
                              <p className="text-sm text-blue-700 leading-relaxed font-medium">{q.answerHint}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50 flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                Strictly confidential • Generated via IntelliCampus AI Engine
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border-2 border-dashed border-slate-800 rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-4 h-full min-h-[600px] text-slate-600">
              <div className="w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4">
                <FileText size={40} className="opacity-20" />
              </div>
              <h3 className="text-xl font-bold text-slate-400">Preview Area</h3>
              <p className="max-w-xs mx-auto">Set your configuration and click "Generate Question Paper" to see the output here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionPaper;