import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const clearUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/intellicampus');
        // Delete all except admin
        const result = await User.deleteMany({ role: { $ne: 'admin' } });
        console.log(`--- Database Cleared ---`);
        console.log(`Deleted ${result.deletedCount} non-admin users.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

clearUsers();
