import mongoose from 'mongoose';
import { AppError } from '../../shared/errors/AppError';

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;

  private constructor() { }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(uri?: string): Promise<void> {
    if (this.isConnected) {
      return;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this._connect(uri);

    try {
      await this.connectionPromise;
      this.isConnected = true;
      console.log('✅ MongoDB connected successfully');
    } catch (error) {
      this.connectionPromise = null;
      throw error;
    }
  }

  private async _connect(uri?: string): Promise<void> {
    const mongoUri = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-content-analytics';

    try {
      await mongoose.connect(mongoUri, {
        // Connection pooling settings
        maxPoolSize: 10, // Maximum number of connections in the connection pool
        minPoolSize: 2,  // Minimum number of connections in the connection pool
        maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        bufferCommands: true, // Enable mongoose buffering to handle async operations

        // Retry settings
        retryWrites: true,
        retryReads: true,

        // Authentication (optional - remove if using local MongoDB without auth)
        // authSource: 'admin',
        // authMechanism: 'SCRAM-SHA-256',
      });

      // Connection event listeners
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error.message || error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️  MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnected');
        this.isConnected = true;
      });

      mongoose.connection.on('connected', () => {
        console.log('✅ MongoDB connected successfully');
        this.isConnected = true;
      });

    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      throw new AppError('Database connection failed', 500);
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      console.log('✅ MongoDB disconnected successfully');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
      throw new AppError('Database disconnection failed', 500);
    }
  }

  public getConnectionState(): string {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
      99: 'uninitialized'
    };
    return states[mongoose.connection.readyState as keyof typeof states] || 'unknown';
  }

  public isHealthy(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public async ping(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      await mongoose.connection.db!.admin().ping();
      return true;
    } catch (error) {
      console.error('❌ MongoDB ping failed:', error);
      return false;
    }
  }

  public getConnectionStats() {
    return {
      state: this.getConnectionState(),
      isConnected: this.isConnected,
      isHealthy: this.isHealthy(),
      poolSize: mongoose.connection.db ? 'available' : 'not available',
      database: mongoose.connection.db ? mongoose.connection.db.databaseName : null,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
    };
  }
}

export const databaseConnection = DatabaseConnection.getInstance();