import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;
    // For local standalone mongo, retryWrites=false avoids replica set errors.
    // For Atlas (mongodb+srv://) or when retryWrites is already specified, preserve Atlas options.
    if (uri && !uri.startsWith('mongodb+srv://') && !uri.includes('retryWrites=')) {
      uri += (uri.includes('?') ? '&' : '?') + 'retryWrites=false';
    }
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}, Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
