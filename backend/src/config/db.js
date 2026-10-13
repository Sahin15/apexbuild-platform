import mongoose from 'mongoose';

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const localUri = 'mongodb://127.0.0.1:27017/apexbuild_platform?retryWrites=false';

  try {
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('\x1b[32m[DB] Connected to MongoDB Atlas successfully!\x1b[0m');
    return conn;
  } catch (error) {
    console.warn(`\x1b[33m[DB WARN] Primary Atlas unreachable (${error.message.slice(0, 70)}...). Falling back to local MongoDB on port 27017...\x1b[0m`);
    try {
      const localConn = await mongoose.connect(localUri, {
        serverSelectionTimeoutMS: 5000
      });
      console.log('\x1b[32m[DB] Connected to local MongoDB on 127.0.0.1:27017 (Seamless Offline/Fallback Active)\x1b[0m');
      return localConn;
    } catch (localError) {
      console.error(`\x1b[31m[DB ERROR] Failed to connect to both Atlas and local MongoDB: ${localError.message}\x1b[0m`);
      process.exit(1);
    }
  }
};

export default connectDB;
