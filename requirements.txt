# Bhujal - Node.js Groundwater Management System

## System Requirements

### Software Requirements
- Node.js v16.x or higher
- MongoDB 4.4 or higher (local or cloud instance)
- NPM v8.x or higher

## Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory with the following variables:
```
MONGODB_URI=mongodb://localhost:27017/bhujal
SESSION_SECRET=your-secret-key-here
PORT=3000
NODE_ENV=development
```

### 3. Start the Application
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

## Dependencies

### Production Dependencies
- express@^4.18.2 - Web application framework
- mongoose@^7.5.0 - MongoDB object modeling
- express-session@^1.17.3 - Session middleware
- bcryptjs@^2.4.3 - Password hashing
- express-validator@^7.0.1 - Input validation
- connect-flash@^0.1.1 - Flash messages
- method-override@^3.0.0 - HTTP method override
- helmet@^7.0.0 - Security middleware
- ejs@^3.1.9 - Template engine
- dotenv@^16.3.1 - Environment variable management

### Development Dependencies
- nodemon@^3.0.1 - Development server with auto-restart

## Project Structure
```
bhujal/
├── package.json          # Node.js dependencies and scripts
├── simple-app.js         # Main application file
├── views/                # EJS templates
├── server/               # Server-side components
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   └── middleware/      # Custom middleware
└── client/              # Frontend React application
```
