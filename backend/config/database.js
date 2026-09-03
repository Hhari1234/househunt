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
      
      // Safe diagnostics (do NOT print secrets)
      const hasEnvUri = !!process.env.MONGODB_URI;
      const uriScheme = hasEnvUri && process.env.MONGODB_URI.startsWith('mongodb+srv://')
        ? 'mongodb+srv'
        : (hasEnvUri && process.env.MONGODB_URI.startsWith('mongodb://') ? 'mongodb' : 'unknown');
      console.log('MongoDB connection attempt started', { hasEnvUri, uriScheme });

      await mongoose.connect(uri, options);

      console.log('MongoDB connection succeeded');
      
      // Handle connection events for better monitoring
      mongoose.connection.on('error', (error) => {
        // Log sanitized event — do not leak connection strings or credentials
        console.error('MongoDB connection error:', { name: error.name, message: error.message });
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
      });
      
      return true;
    } catch (error) {
      // Sanitize error classification
      const msg = String(error && error.message ? error.message : error);
      let reason = 'unknown';
      if (/Authentication failed|auth/i.test(msg)) reason = 'authentication';
      else if (/ENOTFOUND|getaddrinfo/i.test(msg)) reason = 'dns';
      else if (/timeout|timed out|server selection/i.test(msg)) reason = 'timeout/network';
      else if (/ECONNREFUSED|connection refused/i.test(msg)) reason = 'connection_refused';

      console.error('Failed to connect to MongoDB (sanitized):', { reason, message: msg });
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