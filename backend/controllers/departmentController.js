import Department from '../models/Department.js';
import User from '../models/User.js';

// @desc    Get all departments with student counts
// @route   GET /api/departments
// @access  Private
export const getDepartments = async (req, res) => {
    try {
        const depts = await Department.find();

        // Get dynamic student counts from User model
        const studentCounts = await User.aggregate([
            { $match: { role: 'student' } },
            { $group: { _id: '$department', count: { $sum: 1 } } }
        ]);

        const countsMap = studentCounts.reduce((acc, curr) => {
            if (curr._id) acc[curr._id] = curr.count;
            return acc;
        }, {});

        const data = depts.map(dept => ({
            ...dept._doc,
            students: countsMap[dept.code] || 0
        }));

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Update department metadata
// @route   PUT /api/departments/:id
// @access  Private/Admin
export const updateDepartment = async (req, res) => {
    try {
        const dept = await Department.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!dept) {
            return res.status(404).json({
                success: false,
                error: 'Department not found'
            });
        }

        res.status(200).json({
            success: true,
            data: dept
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Create new department
// @route   POST /api/departments
// @access  Private/Admin
export const createDepartment = async (req, res) => {
    try {
        const dept = await Department.create(req.body);
        res.status(201).json({
            success: true,
            data: dept
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Seed initial departments if none exist
// @route   POST /api/departments/seed
// @access  Private/Admin
export const seedDepartments = async (req, res) => {
    try {
        const count = await Department.countDocuments();
        if (count > 0) {
            return res.status(400).json({ success: false, error: 'Departments already seeded' });
        }

        const initialDepts = [
            {
                name: 'Artificial Intelligence & Machine Learning',
                code: 'AIML',
                hod: 'Dr. Priya Sharma',
                facultyCount: 8,
                subjectCount: 12,
                established: 2020,
                description: 'Focuses on intelligent systems, deep learning, NLP, and computer vision.',
                facultyMembers: [
                    'Ms. K Madhusudha',
                    'Mr. Pradeep G Shetty',
                    'Mr. Vishnu P J',
                    'Ms. Ruksana Banu',
                    'Dr. Praveen Blessington',
                    'Mr. Mahesh Kumar V B',
                    'Ms. Jayashree',
                    'Prof. Anand Uppar'
                ]
            },
            { name: 'Computer Science & Engineering', code: 'CSE', hod: 'Dr. Rajesh Kumar', facultyCount: 14, subjectCount: 18, established: 2005, description: 'Core CS fundamentals, software engineering, and full-stack development.', facultyMembers: [] },
            { name: 'Electronics & Communication', code: 'EC', hod: 'Dr. Anitha Rao', facultyCount: 11, subjectCount: 15, established: 2005, description: 'Signal processing, embedded systems, and wireless communication.', facultyMembers: [] },
            { name: 'Cybersecurity', code: 'Cybersecurity', hod: 'Dr. Kiran Mehta', facultyCount: 6, subjectCount: 10, established: 2021, description: 'Network security, ethical hacking, and digital forensics.', facultyMembers: [] },
            { name: 'Electrical & Electronics', code: 'EEE', hod: 'Dr. Sanjay Hegde', facultyCount: 9, subjectCount: 13, established: 2010, description: 'Power systems, microcontrollers, and electrical machines.', facultyMembers: [] },
            { name: 'Mechanical Engineering', code: 'MECH', hod: 'Dr. Suresh Patil', facultyCount: 10, subjectCount: 14, established: 2005, description: 'Thermodynamics, CAD/CAM, and industrial automation.', facultyMembers: [] }
        ];

        await Department.insertMany(initialDepts);

        res.status(201).json({
            success: true,
            message: 'Departments seeded successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};
