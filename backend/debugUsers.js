import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/intellicampus');
        const users = await User.find({}, 'name email role');
        console.log('--- Current Registered Users ---');
        users.forEach(u => console.log(`${u.role}: ${u.name} (${u.email})`));
        console.log('-------------------------------');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

listUsers();
