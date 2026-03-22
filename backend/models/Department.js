import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a department name'],
        unique: true
    },
    code: {
        type: String,
        required: [true, 'Please add a department code'],
        unique: true
    },
    hod: {
        type: String,
        default: 'Not Assigned'
    },
    facultyCount: {
        type: Number,
        default: 0
    },
    subjectCount: {
        type: Number,
        default: 0
    },
    facultyMembers: [String], // List of faculty names from timetable
    established: {
        type: Number,
        default: new Date().getFullYear()
    },
    description: {
        type: String,
        default: ''
    }
}, { timestamps: true });

export default mongoose.model('Department', departmentSchema);
