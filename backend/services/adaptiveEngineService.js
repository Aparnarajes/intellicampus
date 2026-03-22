import crypto from 'crypto';
import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';

const DEFAULT_EXCLUDE_LAST_N_PAPERS = 3;
const DEFAULT_RECENT_ATTEMPT_DAYS = 30;

const BLOOM_GROUPS = {
  RU: new Set(['REMEMBER', 'UNDERSTAND']),
  AA: new Set(['APPLY', 'ANALYZE']),
  EC: new Set(['EVALUATE', 'CREATE']),
};

function bloomGroup(bloomLevel) {
  for (const [g, set] of Object.entries(BLOOM_GROUPS)) {
    if (set.has(bloomLevel)) return g;
  }
  return 'RU';
}

function normalizeExamType(examType) {
  const v = String(examType || '').toUpperCase().trim();
  if (!v) return 'PRACTICE';
  if (v === 'INTERNAL') return 'INTERNAL';
  if (v === 'MOCK') return 'MOCK';
  if (v === 'PRACTICE') return 'PRACTICE';
  throw new Error('Invalid examType. Use: Internal / Mock / Practice.');
}

function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createRng(seedStr) {
  const seedFn = xmur3(String(seedStr));
  return mulberry32(seedFn());
}

function allocateByPercent(total, pctMap) {
  // pctMap values sum ~ 100
  const entries = Object.entries(pctMap);
  const raw = entries.map(([k, pct]) => [k, (pct / 100) * total]);
  const floor = raw.map(([k, v]) => [k, Math.floor(v)]);
  let used = floor.reduce((s, [, v]) => s + v, 0);
  let remaining = total - used;

  // Distribute remainder by largest fractional part (deterministic)
  const frac = raw
    .map(([k, v]) => [k, v - Math.floor(v)])
    .sort((a, b) => b[1] - a[1]);

  const out = Object.fromEntries(floor);
  let i = 0;
  while (remaining > 0) {
    out[frac[i % frac.length][0]] += 1;
    remaining -= 1;
    i += 1;
  }
  return out;
}

function difficultyDistribution({ adaptiveEnabled, accuracyPct }) {
  if (!adaptiveEnabled || accuracyPct == null) {
    return { EASY: 30, MEDIUM: 40, HARD: 30 };
  }
  if (accuracyPct < 50) return { EASY: 50, MEDIUM: 30, HARD: 20 };
  if (accuracyPct <= 75) return { EASY: 30, MEDIUM: 40, HARD: 30 };
  return { EASY: 20, MEDIUM: 40, HARD: 40 };
}

function bloomDistribution() {
  return { RU: 30, AA: 40, EC: 30 };
}

async function resolveStudentForUser(userId) {
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) throw new Error('Student profile not found.');
  return student;
}

async function computeSubjectAccuracyPct({ studentId, subjectId }) {
  const rows = await prisma.studentTopicPerformance.findMany({
    where: { studentId, subjectId },
    select: { accuracyPercentage: true },
  });
  if (rows.length === 0) return null;
  const avg = rows.reduce((s, r) => s + (r.accuracyPercentage || 0), 0) / rows.length;
  return Number(avg.toFixed(1));
}

async function getWeakTopics({ studentId, subjectId }) {
  const rows = await prisma.studentTopicPerformance.findMany({
    where: { studentId, subjectId },
    select: { topic: true, weakFlag: true, accuracyPercentage: true },
  });
  const weak = new Set();
  for (const r of rows) {
    if (r.weakFlag || (r.accuracyPercentage ?? 100) < 50) weak.add(r.topic);
  }
  return weak;
}

async function buildExclusionSet({ subjectId, studentId, excludeLastNPapers, recentAttemptDays }) {
  const banned = new Set();

  // 1) Questions used in last N papers (subject scoped; student scoped when available)
  const papers = await prisma.questionPaper.findMany({
    where: {
      subjectId,
      ...(studentId ? { studentId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: excludeLastNPapers,
    select: { id: true },
  });

  if (papers.length) {
    const items = await prisma.questionPaperItem.findMany({
      where: { paperId: { in: papers.map(p => p.id) } },
      select: { questionId: true },
    });
    for (const it of items) banned.add(it.questionId);
  }

  // 2) Recently attempted questions by student
  if (studentId) {
    const since = new Date(Date.now() - recentAttemptDays * 24 * 60 * 60 * 1000);
    const attempts = await prisma.studentQuestionAttempt.findMany({
      where: { studentId, attemptedAt: { gte: since } },
      select: { questionId: true },
    });
    for (const a of attempts) banned.add(a.questionId);
  }

  return banned;
}

function pickWeighted(rng, weightedItems) {
  // weightedItems: [{ item, w }]
  const total = weightedItems.reduce((s, x) => s + x.w, 0);
  if (total <= 0) return null;
  let r = rng() * total;
  for (const x of weightedItems) {
    r -= x.w;
    if (r <= 0) return x.item;
  }
  return weightedItems[weightedItems.length - 1]?.item ?? null;
}

function sha256Hex(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export async function generateQuestionPaper({
  actorUserId,
  actorRole,
  subjectCode,
  totalMarks,
  examType,
  adaptiveEnabled,
  seed,
  // If present, paper is personalized & adaptive can use performance
  targetStudentUserId,
  includeQuestionText = true,
  excludeLastNPapers = DEFAULT_EXCLUDE_LAST_N_PAPERS,
  recentAttemptDays = DEFAULT_RECENT_ATTEMPT_DAYS,
}) {
  const normalizedExamType = normalizeExamType(examType);
  const marks = Number(totalMarks);
  if (!Number.isFinite(marks) || marks <= 0) throw new Error('totalMarks must be a positive number.');

  // Security: students can only generate practice papers for themselves
  const role = String(actorRole || '').toUpperCase();
  if (role === 'STUDENT' && normalizedExamType !== 'PRACTICE') {
    throw new Error('Students can only generate Practice papers.');
  }

  const subject = await prisma.subject.findUnique({ where: { subjectCode } });
  if (!subject) throw new Error(`Subject "${subjectCode}" not found.`);

  let student = null;
  if (targetStudentUserId) {
    // Students can only target themselves; faculty/admin can target any student for personalization
    if (role === 'STUDENT' && targetStudentUserId !== actorUserId) {
      throw new Error('Students can only generate papers for themselves.');
    }
    student = await resolveStudentForUser(targetStudentUserId);
  }

  const effectiveAdaptive = Boolean(adaptiveEnabled && student);
  const accuracyPct = student ? await computeSubjectAccuracyPct({ studentId: student.id, subjectId: subject.id }) : null;
  const weakTopics = student ? await getWeakTopics({ studentId: student.id, subjectId: subject.id }) : new Set();

  const diffPct = difficultyDistribution({ adaptiveEnabled: effectiveAdaptive, accuracyPct });
  const bloomPct = bloomDistribution();

  const targetMarksByDifficulty = allocateByPercent(marks, diffPct); // {EASY, MEDIUM, HARD} in marks
  const targetMarksByBloom = allocateByPercent(marks, bloomPct); // {RU, AA, EC} in marks

  const paperSeed = seed || crypto.randomUUID();
  const rng = createRng(paperSeed);

  const bannedQuestionIds = await buildExclusionSet({
    subjectId: subject.id,
    studentId: student?.id,
    excludeLastNPapers: Math.max(0, Number(excludeLastNPapers) || 0),
    recentAttemptDays: Math.max(0, Number(recentAttemptDays) || 0),
  });

  const allQuestions = await prisma.question.findMany({
    where: {
      subjectId: subject.id,
      isActive: true,
      id: { notIn: Array.from(bannedQuestionIds) },
    },
    select: {
      id: true,
      unit: true,
      topic: true,
      questionText: true,
      questionType: true,
      difficulty: true,
      bloomLevel: true,
      marks: true,
      timesUsed: true,
      lastUsedAt: true,
    },
  });

  if (allQuestions.length === 0) {
    throw new Error('No eligible questions found for this subject (after exclusions). Populate the Question Bank first.');
  }

  // Units coverage
  const units = Array.from(new Set(allQuestions.map(q => q.unit))).sort();
  const minMarksByUnit = new Map();
  for (const u of units) {
    const min = Math.min(...allQuestions.filter(q => q.unit === u).map(q => q.marks));
    if (Number.isFinite(min)) minMarksByUnit.set(u, min);
  }

  // Selection state
  const selected = [];
  const selectedIds = new Set();

  let remaining = marks;
  const usedMarksByDifficulty = { EASY: 0, MEDIUM: 0, HARD: 0 };
  const usedMarksByBloom = { RU: 0, AA: 0, EC: 0 };
  const usedMarksByTopic = new Map();
  const coveredUnits = new Set();

  const maxTopicMarks = Math.max(1, Math.floor(marks * 0.35)); // prevent topic domination

  function deficitDifficulty(diff) {
    return Math.max(0, (targetMarksByDifficulty[diff] || 0) - (usedMarksByDifficulty[diff] || 0));
  }

  function deficitBloom(group) {
    return Math.max(0, (targetMarksByBloom[group] || 0) - (usedMarksByBloom[group] || 0));
  }

  function minNeededForUncoveredUnits(unitsToCover) {
    let s = 0;
    for (const u of unitsToCover) s += minMarksByUnit.get(u) || 0;
    return s;
  }

  function wouldBreakUnitFeasibility(nextRemaining, nextCoveredUnits) {
    const uncovered = units.filter(u => !nextCoveredUnits.has(u));
    if (uncovered.length === 0) return false;
    const minNeed = minNeededForUncoveredUnits(uncovered);
    return nextRemaining < minNeed;
  }

  function weightForQuestion(q) {
    // Higher weight => more likely.
    const g = bloomGroup(q.bloomLevel);
    const dDiff = deficitDifficulty(q.difficulty);
    const dBloom = deficitBloom(g);

    const topicMarks = usedMarksByTopic.get(q.topic) || 0;
    const isWeak = weakTopics.has(q.topic);
    const isUnitNew = !coveredUnits.has(q.unit);

    // Usage penalty (prefer less-used)
    const usageFactor = 1 / (1 + (q.timesUsed || 0));

    // Freshness penalty (prefer not used very recently, but keep it soft)
    let freshness = 1;
    if (q.lastUsedAt) {
      const daysAgo = (Date.now() - new Date(q.lastUsedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysAgo < 7) freshness = 0.4;
      else if (daysAgo < 30) freshness = 0.7;
    }

    // Deficit-driven weights (marks-based)
    const needDiff = dDiff > 0 ? 1 + Math.min(2, dDiff / Math.max(1, marks)) * 6 : 1;
    const needBloom = dBloom > 0 ? 1 + Math.min(2, dBloom / Math.max(1, marks)) * 6 : 1;
    const needUnit = isUnitNew ? 1.8 : 1;
    const needWeakTopic = isWeak ? 2.0 : 1;

    // Topic cap penalty
    const topicPenalty = topicMarks + q.marks > maxTopicMarks ? 0.05 : 1;

    return Math.max(0.0001, usageFactor * freshness * needDiff * needBloom * needUnit * needWeakTopic * topicPenalty);
  }

  // Backtracking search (depth-limited) to hit exact marks with constraints
  const blockedAtDepth = new Map(); // depth -> Set(questionId)
  const MAX_STEPS = Math.max(10, marks * 20);
  const MAX_BACKTRACKS = 5000;
  let backtracks = 0;

  function addQuestion(q) {
    selected.push(q);
    selectedIds.add(q.id);
    remaining -= q.marks;

    usedMarksByDifficulty[q.difficulty] = (usedMarksByDifficulty[q.difficulty] || 0) + q.marks;
    const g = bloomGroup(q.bloomLevel);
    usedMarksByBloom[g] = (usedMarksByBloom[g] || 0) + q.marks;

    usedMarksByTopic.set(q.topic, (usedMarksByTopic.get(q.topic) || 0) + q.marks);
    coveredUnits.add(q.unit);
  }

  function removeLastQuestion() {
    const q = selected.pop();
    if (!q) return null;
    selectedIds.delete(q.id);
    remaining += q.marks;

    usedMarksByDifficulty[q.difficulty] = (usedMarksByDifficulty[q.difficulty] || 0) - q.marks;
    const g = bloomGroup(q.bloomLevel);
    usedMarksByBloom[g] = (usedMarksByBloom[g] || 0) - q.marks;

    usedMarksByTopic.set(q.topic, (usedMarksByTopic.get(q.topic) || 0) - q.marks);
    if ((usedMarksByTopic.get(q.topic) || 0) <= 0) usedMarksByTopic.delete(q.topic);

    // recompute coveredUnits (cheap enough for typical papers)
    coveredUnits.clear();
    for (const s of selected) coveredUnits.add(s.unit);
    return q;
  }

  function depthBlockedSet(depth) {
    if (!blockedAtDepth.has(depth)) blockedAtDepth.set(depth, new Set());
    return blockedAtDepth.get(depth);
  }

  function chooseNextCandidate(depth) {
    const blocked = depthBlockedSet(depth);

    const candidates = allQuestions.filter(q =>
      !selectedIds.has(q.id) &&
      !blocked.has(q.id) &&
      q.marks <= remaining
    );

    if (candidates.length === 0) return null;

    // Enforce unit feasibility (avoid painting into a corner)
    const feasible = candidates.filter(q => {
      const nextRemaining = remaining - q.marks;
      const nextCovered = new Set(coveredUnits);
      nextCovered.add(q.unit);
      return !wouldBreakUnitFeasibility(nextRemaining, nextCovered);
    });

    const pool = feasible.length ? feasible : candidates;
    const weighted = pool
      .map(q => ({ item: q, w: weightForQuestion(q) }))
      .sort((a, b) => b.w - a.w)
      .slice(0, 60); // top-K for stability + performance

    return pickWeighted(rng, weighted);
  }

  function search(depth = 0) {
    if (remaining === 0) return true;
    if (depth >= MAX_STEPS) return false;
    if (backtracks > MAX_BACKTRACKS) return false;

    const next = chooseNextCandidate(depth);
    if (!next) return false;

    addQuestion(next);
    if (search(depth + 1)) return true;

    // Backtrack
    const removed = removeLastQuestion();
    backtracks += 1;
    if (removed) depthBlockedSet(depth).add(removed.id);
    return search(depth); // try alternative at same depth
  }

  const ok = search(0);
  if (!ok || remaining !== 0) {
    throw new Error(
      `Unable to generate an exact ${marks}-mark paper with current constraints and available question marks. ` +
      `Try adding more questions/mark-variants to the bank, or reduce exclusions.`
    );
  }

  // Build persistent paper (transaction-safe)
  const nowIso = new Date().toISOString();
  const difficultyProfileJson = JSON.stringify({ pct: diffPct, targetMarksByDifficulty, usedMarksByDifficulty });
  const bloomProfileJson = JSON.stringify({ pct: bloomPct, targetMarksByBloom, usedMarksByBloom });
  const topicProfileJson = JSON.stringify({
    weakTopics: Array.from(weakTopics),
    topicMarks: Object.fromEntries(Array.from(usedMarksByTopic.entries())),
  });

  const contentHash = sha256Hex(JSON.stringify({
    subjectCode,
    totalMarks: marks,
    seed: paperSeed,
    questions: selected.map((q, idx) => ({ id: q.id, order: idx + 1, marks: q.marks })),
  }));

  const created = await prisma.$transaction(async (tx) => {
    const paper = await tx.questionPaper.create({
      data: {
        subjectId: subject.id,
        createdByUserId: actorUserId,
        studentId: student?.id || null,
        examType: normalizedExamType,
        adaptiveEnabled: effectiveAdaptive,
        seed: paperSeed,
        totalMarks: marks,
        status: 'LOCKED',
        lockedAt: new Date(),
        difficultyProfileJson,
        bloomProfileJson,
        topicProfileJson,
        constraintsJson: JSON.stringify({
          excludeLastNPapers,
          recentAttemptDays,
          unitCoverage: true,
          noDuplicates: true,
          topicMaxMarksPct: 0.35,
        }),
        contentHash,
      }
    });

    await tx.questionPaperItem.createMany({
      data: selected.map((q, idx) => ({
        paperId: paper.id,
        questionId: q.id,
        order: idx + 1,
        marks: q.marks,
      })),
    });

    // Update usage stats
    await Promise.all(selected.map(q =>
      tx.question.update({
        where: { id: q.id },
        data: {
          timesUsed: { increment: 1 },
          lastUsedAt: new Date(),
        }
      })
    ));

    await tx.paperGenerationLog.create({
      data: {
        paperId: paper.id,
        actorUserId,
        subjectId: subject.id,
        examType: normalizedExamType,
        adaptiveEnabled: effectiveAdaptive,
        seed: paperSeed,
        requestMetaJson: JSON.stringify({
          ts: nowIso,
          subjectCode,
          totalMarks: marks,
          accuracyPct,
          diffPct,
          bloomPct,
          selectedCount: selected.length,
          backtracks,
        }),
      }
    });

    const items = await tx.questionPaperItem.findMany({
      where: { paperId: paper.id },
      orderBy: { order: 'asc' },
      include: { question: true },
    });

    return { paper, items };
  });

  return {
    exam_metadata: {
      paper_id: created.paper.id,
      subject: subject.subjectName || subjectCode,
      subject_code: subjectCode,
      total_marks: marks,
      exam_type: normalizedExamType,
      difficulty_profile: effectiveAdaptive ? 'Adaptive' : 'Fixed',
      seed: paperSeed,
      locked: created.paper.status === 'LOCKED',
      locked_at: created.paper.lockedAt,
    },
    questions: created.items.map((it) => ({
      id: it.questionId,
      type: it.question.questionType === 'SHORT_ANSWER' ? 'Short Answer' : it.question.questionType,
      difficulty: it.question.difficulty,
      bloom_level: it.question.bloomLevel,
      unit: it.question.unit,
      topic: it.question.topic,
      marks: it.marks,
      ...(includeQuestionText ? { question_text: it.question.questionText } : {}),
    })),
  };
}

