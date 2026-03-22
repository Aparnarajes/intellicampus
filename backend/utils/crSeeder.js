import Exam from '../models/Exam.js';
import Announcement from '../models/Announcement.js';
import AcademicCalendar from '../models/AcademicCalendar.js';
import Assignment from '../models/Assignment.js';
import User from '../models/User.js';

const seedCRData = async () => {
    try {
        // Clear existing data to avoid duplicates in dev
        await Exam.deleteMany({});
        await Announcement.deleteMany({});
        await AcademicCalendar.deleteMany({});
        // We don't clear assignments as they might be tied to students

        const admin = await User.findOne({ role: 'admin' });
        const adminId = admin ? admin._id : null;

        // 1. Seed Exams
        await Exam.create([
            {
                subject: 'Advanced Neural Networks',
                subjectCode: 'ANN701',
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days later
                time: '10:00 AM - 01:00 PM',
                venue: 'Main Lab 4',
                batch: '2023-A',
                type: 'Internal'
            },
            {
                subject: 'Cloud Computing & DevOps',
                subjectCode: 'CCD702',
                date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days later
                time: '02:00 PM - 05:00 PM',
                venue: 'Block B, Hall 102',
                batch: '2023-A',
                type: 'Internal'
            }
        ]);

        // 2. Seed Announcements
        if (adminId) {
            await Announcement.create([
                {
                    title: 'Symposium Registration Open',
                    content: 'Neural-X 2026 registration is now open for all students. Last date is Friday.',
                    author: adminId,
                    targetBatch: 'All',
                    category: 'Event'
                },
                {
                    title: 'Fee Deadline Reminder',
                    content: 'Please clear your semester balance before March 1st to avoid technical block on profile.',
                    author: adminId,
                    targetBatch: '2023-A',
                    category: 'Urgent'
                }
            ]);
        }

        // 3. Seed Calendar
        await AcademicCalendar.create([
            {
                event: 'Spring Fest 2026',
                startDate: new Date('2026-03-15'),
                endDate: new Date('2026-03-18'),
                type: 'Event',
                description: 'Annual cultural extravaganza.',
                academicYear: '2025-26',
                semester: 6
            },
            {
                event: 'Mid-Term Break',
                startDate: new Date('2026-04-10'),
                endDate: new Date('2026-04-15'),
                type: 'Holiday',
                description: 'Semester break.',
                academicYear: '2025-26',
                semester: 6
            }
        ]);

        console.log('✅ AI CR Metadata seeded successfully');
    } catch (err) {
        console.error('❌ Error seeding CR data:', err.message);
    }
};

export default seedCRData;
