// ─────────────────────────────────────────────────────────────────────────────
// VII SEM – AIML Timetable (Srinivas University, IET Mukka, Mangaluru)
// Room No.: 203  |  Wef: 07/07/2025  (2025-26 Odd Semester)
// Class Advisor: Mr. Pradeep G Shetty
//
// Faculty Abbreviations:
//   KM  → Ms. K Madhusudha           (Cloud Computing & Cloud Lab)
//   PGS → Mr. Pradeep G Shetty       (Advanced DBMS & NOSQL)
//   VPJ → Mr. Vishnu P J             (Natural Language Processing)
//   RB  → Ms. Ruksana Banu           (Social and Web Analytics + Self-Motivated Programme-3)
//   PBM → Dr. Praveen Blessington    (Patent Filing & IPR + Distributed Computing Systems)
//   MVB → Mr. Mahesh Kumar V B       (Major Project Phase-1)
//   JS  → Ms. Jayashree              (Internship-3)
//   AU  → Prof. Anand Uppar          (Class Advisor support)
//
// Period Timings:
//   P1 : 09:00 – 09:55
//   P2 : 09:55 – 10:50
//   P3 : 11:05 – 12:00
//   P4 : 12:00 – 12:55
//   BREAK: 12:55 – 13:40
//   P5 : 13:40 – 14:35
//   P6 : 14:40 – 15:35
//   P7 : 15:35 – 16:30
// ─────────────────────────────────────────────────────────────────────────────

export const fullTimetable = {
    // ──────────────── MONDAY ────────────────────────────────────────────────
    // P1: Distributed Computing Systems (5)
    // P2: Library Hour (LH)
    // P3–P4: Lab – Cloud (B1) / Advanced DBMS (B2) [←1(B1)/2(B2)→]
    // P5–P7: Internship-3 (9) [←9→]
    'MON': [
        {
            start: '09:00', end: '09:55',
            subjectCode: '23SAL075',
            title: 'Distributed Computing Systems',
            faculty: 'PBM'   // Dr. Praveen Blessington
        },
        {
            start: '09:55', end: '10:50',
            title: 'Library Hour (LH)',
            isSpecial: true
        },
        {
            // Lab spans P3 + P4 (11:05–12:55)
            start: '11:05', end: '12:55',
            title: 'Lab: Cloud Computing (B1) / Advanced DBMS (B2)',
            isLab: true,
            batchSessions: [
                { batch: 'B1', subjectCode: '23SAL071L', title: 'Cloud Computing Lab', faculty: 'KM' },
                { batch: 'B2', subjectCode: '23SAL072L', title: 'Advanced DBMS & NOSQL Lab', faculty: 'PGS' }
            ]
        },
        {
            // Internship spans P5–P7 (13:40–16:30)
            start: '13:40', end: '16:30',
            subjectCode: '23SIP078',
            title: 'Internship-3',
            faculty: 'JS',
            isOpenHour: true
        }
    ],

    // ──────────────── TUESDAY ───────────────────────────────────────────────
    // P1–P2: NLP double period (3)
    // P3: Cloud Computing (1)
    // P5–P7: Self-Motivated Programme-3 (6)
    'TUE': [
        {
            // NLP spans P1 + P2 (09:00–10:50) – double period
            start: '09:00', end: '10:50',
            subjectCode: '23SAL073',
            title: 'Natural Language Processing',
            faculty: 'VPJ'
        },
        {
            start: '11:05', end: '12:00',
            subjectCode: '23SAL071',
            title: 'Cloud Computing',
            faculty: 'KM'
        },
        {
            // SMP-3 spans P5–P7 (13:40–16:30)
            start: '13:40', end: '16:30',
            subjectCode: '23SAL076',
            title: 'Self-Motivated Programme-3',
            faculty: 'RB',   // Ms. Ruksana Banu
            isOpenHour: true
        }
    ],

    // ──────────────── WEDNESDAY ─────────────────────────────────────────────
    // P1: Advanced DBMS (2)
    // P2: Mentoring Hour (MH)
    // P3: NLP (3)
    // P4: Cloud Computing (1)
    // P5–P7: Lab – Advanced DBMS (B2) / Cloud (B1) [←(B2)/2(B1)→]
    'WED': [
        {
            start: '09:00', end: '09:55',
            subjectCode: '23SAL072',
            title: 'Advanced DBMS & NOSQL Databases',
            faculty: 'PGS'
        },
        {
            start: '09:55', end: '10:50',
            title: 'Mentoring Hour (MH)',
            isSpecial: true
        },
        {
            start: '11:05', end: '12:00',
            subjectCode: '23SAL073',
            title: 'Natural Language Processing',
            faculty: 'VPJ'
        },
        {
            start: '12:00', end: '12:55',
            subjectCode: '23SAL071',
            title: 'Cloud Computing',
            faculty: 'KM'
        },
        {
            // Lab spans P5–P7 (13:40–16:30) – B1 and B2 swapped from Monday
            start: '13:40', end: '16:30',
            title: 'Lab: Advanced DBMS (B1) / Cloud Computing (B2)',
            isLab: true,
            batchSessions: [
                { batch: 'B1', subjectCode: '23SAL072L', title: 'Advanced DBMS & NOSQL Lab', faculty: 'PGS' },
                { batch: 'B2', subjectCode: '23SAL071L', title: 'Cloud Computing Lab', faculty: 'KM' }
            ]
        }
    ],

    // ──────────────── THURSDAY ──────────────────────────────────────────────
    // P1: Distributed Computing Systems (5)
    // P2: Advanced DBMS (2)
    // P3: Social and Web Analytics (4)
    // P5–P7: Major Project Phase-1 (7) [←7→]
    'THU': [
        {
            start: '09:00', end: '09:55',
            subjectCode: '23SAL075',
            title: 'Distributed Computing Systems',
            faculty: 'PBM'   // Dr. Praveen Blessington
        },
        {
            start: '09:55', end: '10:50',
            subjectCode: '23SAL072',
            title: 'Advanced DBMS & NOSQL Databases',
            faculty: 'PGS'
        },
        {
            start: '11:05', end: '12:00',
            subjectCode: '23SAL074',
            title: 'Social and Web Analytics',
            faculty: 'RB'
        },
        {
            // Major Project spans P5–P7 (13:40–16:30)
            start: '13:40', end: '16:30',
            subjectCode: '23SAL077',
            title: 'Major Project Phase-1',
            faculty: 'MVB',
            isOpenHour: true
        }
    ],

    // ──────────────── FRIDAY ────────────────────────────────────────────────
    // P1–P2: Social and Web Analytics double period (4)
    // P3: NLP (3)
    // P5–P7: Patent Filing & IPR (8) [←8→]
    'FRI': [
        {
            // SWA spans P1 + P2 (09:00–10:50) – double period
            start: '09:00', end: '10:50',
            subjectCode: '23SAL074',
            title: 'Social and Web Analytics',
            faculty: 'RB'
        },
        {
            start: '11:05', end: '12:00',
            subjectCode: '23SAL073',
            title: 'Natural Language Processing',
            faculty: 'VPJ'
        },
        {
            // Patent spans P5–P7 (13:40–16:30)
            start: '13:40', end: '16:30',
            subjectCode: '23SIP079',
            title: 'Patent Filing & IPR',
            faculty: 'PBM',
            isOpenHour: true
        }
    ],

    // ──────────────── SATURDAY ──────────────────────────────────────────────
    // P1: Cloud Computing (1)
    // P2: Advanced DBMS (2)
    // P3: Social and Web Analytics (4)
    'SAT': [
        {
            start: '09:00', end: '09:55',
            subjectCode: '23SAL071',
            title: 'Cloud Computing',
            faculty: 'KM'
        },
        {
            start: '09:55', end: '10:50',
            subjectCode: '23SAL072',
            title: 'Advanced DBMS & NOSQL Databases',
            faculty: 'PGS'
        },
        {
            start: '11:05', end: '12:00',
            subjectCode: '23SAL074',
            title: 'Social and Web Analytics',
            faculty: 'RB'
        }
    ]
};

// ─── Faculty full name lookup ────────────────────────────────────────────────
export const facultyNames = {
    KM: 'Ms. K Madhusudha',            // Cloud Computing & Cloud Lab
    PGS: 'Mr. Pradeep G Shetty',        // Advanced DBMS & NOSQL
    VPJ: 'Mr. Vishnu P J',              // Natural Language Processing
    RB: 'Ms. Ruksana Banu',            // Social & Web Analytics + SMP-3
    PBM: 'Dr. Praveen Blessington',     // Patent Filing & IPR + Distributed CS
    MVB: 'Mr. Mahesh Kumar V B',        // Major Project Phase-1
    JS: 'Ms. Jayashree',               // Internship-3
    AU: 'Prof. Anand Uppar'            // Class Advisor
};

// ─── Subject number → code mapping (as printed in timetable) ─────────────────
export const subjectNumberMap = {
    1: '23SAL071', // Cloud Computing
    2: '23SAL072', // Advanced DBMS & NOSQL Databases
    3: '23SAL073', // Natural Language Processing
    4: '23SAL074', // Social and Web Analytics
    5: '23SAL075', // Distributed Computing Systems
    6: '23SAL076', // Self-Motivated Programme-3
    7: '23SAL077', // Major Project Phase-1
    8: '23SIP079', // Patent Filing & IPR
    9: '23SIP078', // Internship-3
};

// ─── getCurrentLesson ────────────────────────────────────────────────────────
// Returns the current lesson for the faculty's attendance session.
// For lab slots, returns the lab session object (with batchSessions array).
// For special slots (LH, MH), returns null so faculty isn't prompted.
// ─────────────────────────────────────────────────────────────────────────────
export const getCurrentLesson = () => {
    const now = new Date();
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const currentDay = days[now.getDay()];
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const daySchedule = fullTimetable[currentDay];
    if (!daySchedule) return null;

    const lesson = daySchedule.find(slot => {
        const [startH, startM] = slot.start.split(':').map(Number);
        const [endH, endM] = slot.end.split(':').map(Number);
        const startTime = startH * 60 + startM;
        const endTime = endH * 60 + endM;
        return currentTime >= startTime && currentTime <= endTime;
    });

    // Don't return LH / MH as a lesson for attendance
    if (lesson?.isSpecial) return null;
    return lesson || null;
};

// ─── getUpcomingLesson ───────────────────────────────────────────────────────
// Returns the next scheduled lesson after now (useful for faculty planning).
// ─────────────────────────────────────────────────────────────────────────────
export const getUpcomingLesson = () => {
    const now = new Date();
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const currentDay = days[now.getDay()];
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const daySchedule = fullTimetable[currentDay];
    if (!daySchedule) return null;

    return daySchedule.find(slot => {
        if (slot.isSpecial) return false;
        const [startH, startM] = slot.start.split(':').map(Number);
        const startTime = startH * 60 + startM;
        return startTime > currentTime;
    }) || null;
};

// ─── getTodaySchedule ────────────────────────────────────────────────────────
// Returns every slot for today in order — useful for a "Today's Classes" panel.
// ─────────────────────────────────────────────────────────────────────────────
export const getTodaySchedule = (date = new Date()) => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const currentDay = days[date.getDay()];
    return fullTimetable[currentDay] || [];
};
