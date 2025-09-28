import mongoose, { Mongoose } from 'mongoose';

//define the connection string
const MONGODB_URI = process.env.MONGODB_URI as string;
// Check if the string exits in the environment variable

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}
//cache the mongoose instance
interface MongooseCache {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
}
// Global cache for mongos connection
declare global {
    // eslint-disable-next-line no-var
    var mongooseCache: MongooseCache;
}
// Ensure the Global variable is defined
let cache = global.mongooseCache;

//check if the cache exists,
if (!cache) {
  cache = global.mongooseCache = { conn: null, promise: null };
}

// Function to connect to thr MongoDB database
const dbConnect = async (): Promise<Mongoose> => {
    // Check if the connection is already established
    // If the connection is already established, return the cached connection
    if (cache.conn) {
        return cache.conn;
    }
    // if the connection is already in progress, wait for it to resolve
        if (!cache.promise) {
        cache.promise = mongoose.connect(MONGODB_URI, {
            dbName: 'C3-ERP',
        })
        .then((result) => {
            console.log('MongoDB connected successfully');
            return result;
        })
        .catch((error) => {
            console.error('MongoDB connection error:', error);
            throw new Error('Failed to connect to MongoDB');
        });
    }
    cache.conn = await cache.promise;
    return cache.conn;
}
export default dbConnect;