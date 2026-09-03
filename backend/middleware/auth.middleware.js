const jwt = require('jsonwebtoken');

const authMiddleware = {
  // Middleware to authenticate JWT token
  authenticate: (req, res, next) => {
    try {
      // Get token from header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'No authorization token provided'
          }
        });
      }

      const token = authHeader.split(' ')[1];
      
      // Verify token — no hardcoded fallback; a missing JWT_SECRET fails closed
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.userId = decoded.userId;
      req.userRole = decoded.role;
      
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token'
        }
      });
    }
  },

  // Best-effort auth for public routes: attaches the user when a valid
  // token is present, otherwise continues as anonymous.
  optionalAuth: (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.userRole = decoded.role;
      }
    } catch {
      // Invalid token — treat as anonymous
    }
    next();
  },

  // Middleware to check user roles
  authorize: (...roles) => {
    return (req, res, next) => {
      try {
        if (!req.userRole) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required'
            }
          });
        }

        if (!roles.includes(req.userRole)) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient permissions'
            }
          });
        }

        next();
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Authorization check failed'
          }
        });
      }
    };
  }
};

module.exports = authMiddleware;