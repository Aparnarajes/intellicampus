import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

async function seed() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error('MONGODB_URI missing');

        await mongoose.connect(uri);

        const facultyData = {
            name: 'Praveen Blessington',
            email: 'praveen@intellicampus.com',
            password: 'password123',
            role: 'faculty',
            handledSubjects: ['Distributed Computing System', 'Patent Filing & IPR'],
            handledBatches: ['2022', '2023']
        };

        let user = await User.findOne({ email: facultyData.email.toLowerCase() });

        if (!user) {
            user = await User.create(facultyData);
            console.log('✅ Created faculty: ' + user.name);
        } else {
            user.handledSubjects = facultyData.handledSubjects;
            user.handledBatches = facultyData.handledBatches;
            await user.save();
            console.log('ℹ️ Updated faculty: ' + user.name);
        }
    } catch (err) {
        console.error('SEED ERROR:', err);
    } finally {
        await mongoose.connection.close();
    }
}

seed();
