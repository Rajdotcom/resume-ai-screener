import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Attempt connection using the hidden URI variable
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      autoIndex: true, // Automatically builds indexes from schemas
    });
    
    console.log(`🚀 MongoDB Connected Successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Database Connection Failure: ${error.message}`);
    
    // Kill the server thread immediately if the database fails to link
    process.exit(1);
  }
};

export default connectDB;