# 🚀 Bhujal Installation Guide

## Quick Start (One Command Setup)

```bash
# Install all dependencies and setup the project
npm run setup
```

## Manual Installation Steps

### 1. Prerequisites
Make sure you have the following installed:
- **Node.js** v16.0.0 or higher
- **NPM** v8.0.0 or higher  
- **MongoDB** (local installation or MongoDB Atlas account)

Check your versions:
```bash
npm run check
```

### 2. Install Dependencies
```bash
# Install all required packages
npm install

# Or use the alias
npm run install-deps
```

### 3. Environment Setup
```bash
# Copy the environment template
cp .env.example .env

# Edit the .env file with your configuration
# Required: MONGODB_URI, SESSION_SECRET
# Optional: WEATHER_API_KEY, PORT
```

### 4. Database Setup
```bash
# Option A: Local MongoDB
# Make sure MongoDB is running on your system
# Default connection: mongodb://localhost:27017/bhujal

# Option B: MongoDB Atlas (Cloud)
# 1. Create account at https://cloud.mongodb.com/
# 2. Create a cluster
# 3. Get connection string
# 4. Update MONGODB_URI in .env file
```

### 5. Start the Application
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### 6. Access the Application
Open your browser and go to:
- **Local:** http://localhost:3000
- **Custom Port:** http://localhost:[YOUR_PORT]

## Dependencies Installed

### Production Dependencies:
- **express@^4.18.2** - Web application framework
- **mongoose@^7.5.0** - MongoDB object modeling
- **bcryptjs@^2.4.3** - Password hashing
- **express-session@^1.17.3** - Session management
- **express-validator@^7.0.1** - Input validation and sanitization
- **connect-flash@^0.1.1** - Flash message middleware
- **method-override@^3.0.0** - HTTP verb override
- **helmet@^7.0.0** - Security middleware
- **ejs@^3.1.9** - Embedded JavaScript templating
- **axios@^1.11.0** - HTTP client for API requests
- **dotenv@^16.3.1** - Environment variable management

### Development Dependencies:
- **nodemon@^3.0.1** - Auto-restart development server

## Environment Variables

Create a `.env` file in the root directory:

```env
# Required
MONGODB_URI=mongodb://localhost:27017/bhujal
SESSION_SECRET=your-super-secret-key

# Optional
PORT=3000
NODE_ENV=development
WEATHER_API_KEY=your-openweather-api-key
```

## Available Scripts

```bash
npm start         # Start production server
npm run dev       # Start development server with auto-reload
npm run setup     # Install dependencies and show setup message
npm run check     # Check Node.js and NPM versions
npm install       # Install all dependencies
```

## Troubleshooting

### Common Issues:

1. **Port already in use**
   ```bash
   # Change PORT in .env file or kill existing process
   lsof -ti:3000 | xargs kill -9  # macOS/Linux
   netstat -ano | findstr :3000   # Windows
   ```

2. **MongoDB connection failed**
   ```bash
   # Check if MongoDB is running
   # Local: brew services start mongodb-community  # macOS
   # Local: sudo systemctl start mongod           # Linux
   # Cloud: Check MongoDB Atlas connection string
   ```

3. **Missing dependencies**
   ```bash
   # Clear cache and reinstall
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Permission errors**
   ```bash
   # Use npm with correct permissions
   sudo npm install    # Linux/macOS
   # Or run as administrator on Windows
   ```

## Database Schema

The application will automatically create these collections:
- **users** - User accounts and profiles
- **borewells** - Borewell registration data

## Features Included

✅ User Authentication (Register/Login/Logout)
✅ Interactive Map with Leaflet.js
✅ Borewell Registration and Management
✅ Weather Data Integration
✅ Dashboard with Analytics
✅ Reports and Data Export
✅ Profile Management
✅ Responsive Design

## API Endpoints

- `GET /` - Home page
- `GET /login` - Login page
- `POST /login` - User authentication
- `GET /register` - Registration page
- `POST /register` - User registration
- `GET /dashboard` - User dashboard
- `GET /map` - Interactive map
- `GET /profile` - User profile
- `GET /reports` - Analytics and reports
- `POST /api/borewells` - Create borewell
- `GET /api/weather` - Weather data

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in .env
2. Use PM2 or similar process manager
3. Set up reverse proxy (nginx)
4. Use HTTPS
5. Configure proper MongoDB security
6. Set strong SESSION_SECRET

## Support

For issues and questions:
- GitHub Issues: https://github.com/DMegatron/bhujal/issues
- Documentation: See README.md

---

**Ready to manage groundwater data efficiently!** 💧
