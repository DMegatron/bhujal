# Bhujal - Groundwater Management System

A full-stack web application for groundwater monitoring and borewell management, built with Node.js, React, and MongoDB.

## 🌟 Features

- **User Authentication**: Secure registration and login system
- **Interactive Map**: Register and view borewells on an interactive map using Leaflet
- **Dashboard**: Comprehensive overview of borewell statistics and weather data
- **Weather Integration**: Real-time weather data with water level predictions
- **Profile Management**: User profile and account settings
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express Validator** for input validation

### Frontend
- **React** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Leaflet** for interactive maps
- **Axios** for API calls
- **React Hot Toast** for notifications

## 📁 Project Structure

```
Bhujal-NEW/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service functions
│   │   ├── types/          # TypeScript type definitions
│   │   └── App.tsx
│   ├── public/
│   └── package.json
├── server/                 # Node.js backend
│   ├── models/             # MongoDB models
│   ├── routes/             # Express routes
│   ├── middleware/         # Custom middleware
│   ├── config/             # Configuration files
│   └── server.js
└── package.json           # Root package.json
```

## 🚀 Getting Started

### Quick Installation (Recommended)

**Option 1: One-Command Setup**
```bash
npm run setup
```

**Option 2: Automated Script**
```bash
# Windows
./setup.bat

# macOS/Linux
chmod +x setup.sh && ./setup.sh
```

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm (v8 or higher)

### Manual Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DMegatron/bhujal.git
   cd Bhujal-NEW
   ```

2. **Install all dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your configuration
   # Required: MONGODB_URI, SESSION_SECRET
   # Optional: WEATHER_API_KEY, PORT
   ```

4. **Start the application**
   ```bash
   # Development mode (recommended)
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Access the application**
   - Open http://localhost:3000 in your browser
   - Register a new account or login

### Environment Configuration

Create a `.env` file in the root directory:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/bhujal

# Security
SESSION_SECRET=your-super-secret-session-key

# Optional
PORT=3000
NODE_ENV=development
WEATHER_API_KEY=your-openweather-api-key
```

### Available Scripts

```bash
npm start         # Start production server
npm run dev       # Start development server with auto-reload
npm run setup     # Install dependencies and setup guide
npm run check     # Check Node.js and NPM versions
npm install       # Install all dependencies
```

## 📱 Usage

1. **Register/Login**: Create an account or log in with existing credentials
2. **Dashboard**: View your borewell statistics and current weather
3. **Map**: Click anywhere on the map to register a new borewell
4. **Profile**: Manage your account information and settings

## 🗺️ API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Borewells
- `GET /api/borewells` - Get all borewells
- `POST /api/borewells` - Register new borewell
- `GET /api/borewells/:id` - Get specific borewell
- `PUT /api/borewells/:id` - Update borewell
- `DELETE /api/borewells/:id` - Delete borewell

### Weather
- `GET /api/weather/current/:lat/:lng` - Get current weather for location

## 🔧 Development

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run server` - Start only the backend server
- `npm run client` - Start only the frontend development server
- `npm run build` - Build the frontend for production

### Code Structure

- **Frontend**: React components with TypeScript, following modern React patterns
- **Backend**: RESTful API with Express.js, following MVC architecture
- **Database**: MongoDB with Mongoose for data modeling

## 📊 Features in Detail

### Interactive Map
- Click-to-register borewells
- Real-time location detection
- Marker clustering for better performance
- Popup details for each borewell

### Weather Integration
- Current weather conditions
- Water level predictions based on weather patterns
- Historical weather data integration

### User Management
- Secure authentication with JWT
- Profile customization
- Password management
- Account settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email your-email@example.com or create an issue in the repository.

## 🙏 Acknowledgments

- OpenWeatherMap for weather data
- OpenStreetMap for map tiles
- Leaflet for interactive mapping
- Tailwind CSS for styling framework
