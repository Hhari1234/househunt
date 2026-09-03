# HouseHunt Backend API

## Overview

This is the backend API server for HouseHunt, a real estate platform. It provides RESTful API endpoints for property management, user authentication, bookings, favorites, and more.

## Architecture

The backend follows a layered architecture:

- **Routes** (`backend/routes/`) - HTTP request handling
- **Controllers** (`backend/controllers/`) - Business logic implementation
- **Services** (`backend/services/`) - Service layer for data operations
- **Models** (`backend/models/`) - MongoDB data schemas
- **Middleware** (`backend/middleware/`) - Request processing and security

## Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (locally or cloud)
- Environment variables

### Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

## API Routes

The API is organized under the `/api/v1` prefix:

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user profile
- `PUT /api/v1/auth/me` - Update user profile
- `DELETE /api/v1/auth/me` - Delete user account

### Users
- `GET /api/v1/users/me` - Get current user (user-specific)
- `PATCH /api/v1/users/me` - Update current user (user-specific)
- `DELETE /api/v1/users/me` - Delete current user (user-specific)

### Properties
- `GET /api/v1/properties` - List properties with pagination and filtering
- `GET /api/v1/properties/:id` - Get property by ID
- `POST /api/v1/properties` - Create new property
- `PATCH /api/v1/properties/:id` - Update property
- `DELETE /api/v1/properties/:id` - Delete property

### Favorites
- `GET /api/v1/favorites` - Get user's favorite properties
- `POST /api/v1/favorites/:propertyId` - Add property to favorites
- `DELETE /api/v1/favorites/:propertyId` - Remove property from favorites

### Bookings
- `GET /api/v1/bookings` - List user bookings
- `GET /api/v1/bookings/:id` - Get booking by ID
- `POST /api/v1/bookings` - Create new booking
- `PATCH /api/v1/bookings/:id` - Update booking
- `DELETE /api/v1/bookings/:id` - Cancel booking

### Admin
- `GET /api/v1/admin/dashboard` - Admin dashboard statistics
- `GET /api/v1/admin/users` - List all users
- `GET /api/v1/admin/properties` - List all properties
- `GET /api/v1/admin/bookings` - List all bookings

## Models

The backend uses MongoDB with the following models:

### User
- `email` (unique, required)
- `password` (hashed, required)
- `role` (user, agent, admin)

### Property
- `title` (required)
- `description` (required)
- `propertyType` (enum)
- `listingType` (Rent/Sale)
- `price` (number)
- `currency` (default: USD)
- `bedrooms` (number)
- `bathrooms` (number)
- `area` (number)
- `amenities` (array)
- `owner` (reference to User)
- `status` (draft, published, rejected, sold, rented, archived)

### Booking
- `customerId` (reference to User)
- `hostId` (reference to User)
- `listingId` (reference to Property)
- `startDate` (required)
- `endDate` (required)
- `totalPrice` (number)
- `status` (pending, confirmed, rejected, cancelled, completed)

### Favorite
- `user` (reference to User)
- `property` (reference to Property)
- Compound unique index prevents duplicates

## Security

The backend implements comprehensive security measures:

- **Authentication**: JWT-based token authentication
- **Authorization**: Role-based access control (user, agent, admin)
- **Validation**: Input validation using express-validator
- **Rate Limiting**: Express rate limiting to prevent abuse
- **Helmet**: Security headers
- **CORS**: Configured for specific frontend origins
- **Password Hashing**: bcryptjs for secure password storage

## Error Handling

The backend provides detailed error responses:

- **400**: Bad Request / Validation errors
- **401**: Unauthorized / Authentication errors
- **403**: Forbidden / Authorization errors

## Testing

To test the API:

1. Start the server with `npm run dev`
2. Use tools like Postman or curl to test endpoints
3. Run automated tests with `npm test` (if test files exist)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Node environment | development |
| PORT | Server port | 3001 |
| MONGODB_URI | MongoDB connection URI | mongodb://localhost:27017/househunt |
| JWT_SECRET | JWT signing secret | (required) |
| FRONTEND_URL | Allowed frontend origin | http://localhost:5173 |

## Deployment Notes

- In production, ensure proper environment variable configuration
- Use a production MongoDB instance
- Configure CORS for your production frontend domain
- Set up monitoring and logging
- Use HTTPS in production