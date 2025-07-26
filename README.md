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

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Bhujal-NEW
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create `.env` file in the server directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/bhujal
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=30d
   PORT=5000
   WEATHER_API_KEY=your_openweather_api_key
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:5000
   - Frontend development server on http://localhost:3000

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
