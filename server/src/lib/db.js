import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(`mongodb://localhost:27017/post-surgery`);
        console.log(`MongoDb connected: ${conn.connection.host}`)
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}; 