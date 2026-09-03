const mongoose = require('mongoose');

const databaseConfig = {
  // MongoDB connection URI
  // Supports both standard MongoDB URI and environment-specific configurations
  getMongoUri: () => {
    // Priority 1: Use custom MongoDB URI from environment
    if (process.env.MONGODB_URI) {
      return process.env.MONGODB_URI;
    }
    
    // Priority 2: Build URI from individual components.
    // Credentials are only embedded when MONGODB_USER is explicitly supplied;
    // no hardcoded username/password defaults.
    const dbUser = process.env.MONGODB_USER;
    const dbPass = process.env.MONGODB_PASS || '';
    const dbHost = process.env.MONGODB_HOST || 'localhost';
    const dbPort = process.env.MONGODB_PORT || '27017';
    const dbName = process.env.MONGODB_DB || 'househunt';

    if (!dbUser) {
      return `mongodb://${dbHost}:${dbPort}/${dbName}`;
    }
    return `mongodb://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}?authSource=admin`;
  },

  // Connection options for MongoDB
  getConnectionOptions: () => {
    const options = {
      // Connection pool configuration
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      
      // Index optimization for better query performance
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    
    return options;
  },

  // Connect to MongoDB
  connect: async () => {
    try {
      const uri = databaseConfig.getMongoUri();
      const options = databaseConfig.getConnectionOptions();
      
      console.log('Attempting to connect to MongoDB...');
      
      await mongoose.connect(uri, options);
      
      console.log('Connected to MongoDB successfully');
      
      // Handle connection events for better monitoring
      mongoose.connection.on('error', (error) => {
        console.error('MongoDB connection error:', error);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
      });
      
      return true;
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error.message);
      throw error;
    }
  },

  // Disconnect from MongoDB
  disconnect: async () => {
    try {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
      return true;
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error.message);
      throw error;
    }
  }
};

module.exports = databaseConfig;