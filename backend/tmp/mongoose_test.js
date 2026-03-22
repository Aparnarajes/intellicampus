import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ email: 'aparnarajeshapzz@gmail.com' });
  
  if (user) {
    console.log('--- MONGOOSE DOCUMENT TEST ---');
    user.prismaId = 'TEST_ID_123';
    console.log('Assigned value:', user.prismaId);
    
    const plainReqUser = user;
    console.log('Accessing from "req.user":', plainReqUser.prismaId);
    
    // Check if it's visible in JSON
    console.log('JSON stringify:', JSON.stringify(plainReqUser));
    
    // Check if it's visible in the underlying map
    console.log('Is in doc.prismaId?', plainReqUser.get ? plainReqUser.get('prismaId') : 'no-get');
  }
  
  await mongoose.disconnect();
}

main().catch(err => console.error(err));
