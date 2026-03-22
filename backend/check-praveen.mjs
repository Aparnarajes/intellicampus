import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const user = await User.findOne({ name: /Praveen/i });
    console.log('USER_CHECK:' + (user ? JSON.stringify(user.handledSubjects) : 'Not Found'));
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
