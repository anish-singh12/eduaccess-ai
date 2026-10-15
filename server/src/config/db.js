import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

/**
 * Connect to MongoDB Atlas cluster
 */
export async function connectDB() {
  if (!env.MONGODB_URI) {
    console.warn('[DATABASE] Warning: MONGODB_URI is not configured in .env file.');
    console.warn('[DATABASE] Please set MONGODB_URI to your MongoDB Atlas connection string (Cluster0/eduaccess).');
    return false;
  }

  try {
    mongoose.set('strictQuery', true);

    console.log('[DATABASE] Connecting to MongoDB Atlas...');
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      autoIndex: env.NODE_ENV !== 'production'
    });

    isConnected = true;
    console.log(`[DATABASE] MongoDB Atlas connected successfully: host=${conn.connection.host}, database=${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error('[DATABASE] MongoDB connection error:', err.message);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[DATABASE] MongoDB disconnected. Attempting reconnection...');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[DATABASE] MongoDB reconnected successfully.');
      isConnected = true;
    });

    return true;
  } catch (error) {
    isConnected = false;
    console.error('[DATABASE] Failed to connect to MongoDB Atlas:');
    console.error(`  Error message: ${error.message}`);
    console.warn('[DATABASE] Check that your MongoDB Atlas IP Access List allows connections from your current IP.');
    return false;
  }
}

/**
 * Checks if the database is currently connected
 */
export function isDatabaseConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

/**
 * Closes the database connection cleanly (for testing or shutdown)
 */
export async function disconnectDB() {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
    console.log('[DATABASE] MongoDB connection closed.');
  }
}