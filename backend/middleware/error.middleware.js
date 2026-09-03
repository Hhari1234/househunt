const express = require('express');

const errorMiddleware = {
  // General error handler
  general: (err, req, res, next) => {
    console.error(err.stack);

    // Handle MongoDB duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_KEY',
          message: `Duplicate value for field: ${field}`
        }
      });
    }

    // Handle validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors
        }
      });
    }

    // Default error response
    res.status(err.status || 500).json({
      success: false,
      error: {
        code: err.code || 'INTERNAL_SERVER_ERROR',
        message: err.message || 'Internal server error'
      }
    });
  }
};

module.exports = errorMiddleware;