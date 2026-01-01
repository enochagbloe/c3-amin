import mongoose, { Mongoose } from 'mongoose';
import logger from './logger';
import '@/database/index';

// define the uri for mongoose connection
const MONGODB_URI = process.env.MONGODB_URI as string;
// check if there is no uri defined
if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in environment variables');
}

// Disable command buffering globally
mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 30000);

// cache the mongoose instance
interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

// Global cache for mongoose connection
declare global {
  var mongooseCache: MongooseCache;
}
// Ensure global.mongooseCache is defined
let cache = global.mongooseCache

// check if the cache exits
if (!cache) {
  cache = global.mongooseCache = { conn: null, promise: null };
}

// Function to connect to MongoDB using Mongoose
const dbConnect = async (): Promise<Mongoose> => {
    // Check if already connected
    if (cache.conn && mongoose.connection.readyState === 1) {
      logger.info('Using existing mongoose connection');
        return cache.conn;
    }

    // Reset cache if connection was lost
    if (mongoose.connection.readyState === 0 && cache.conn) {
        cache.conn = null;
        cache.promise = null;
    }
    
    // If a connection promise is already in progress, wait for it to resolve
    if (!cache.promise) {
        logger.info('Creating new MongoDB connection...');
        cache.promise = mongoose.connect(MONGODB_URI, {
            dbName: "C3-ERP",
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 15000,
            maxPoolSize: 10,
            minPoolSize: 2,
        })
        .then((result) => {
            logger.info('✅ MongoDB connected successfully - ReadyState: ' + mongoose.connection.readyState);
            return result;
        }).catch((error) => {
            logger.error('❌ MongoDB connection error:', error.message);
            cache.promise = null; // Reset promise on failure so it can retry
            cache.conn = null;
            throw new Error(`Failed to connect to MongoDB: ${error.message}`);
        });
    }
    
    try {
        cache.conn = await cache.promise;
        
        // Wait for connection to be fully ready
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Connection established but not ready');
        }
        
        return cache.conn;
    } catch (error) {
        cache.promise = null;
        cache.conn = null;
        throw error;
    }
};
export default dbConnect;
