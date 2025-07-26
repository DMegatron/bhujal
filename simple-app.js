const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', './views');

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'bhujal-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

app.use(flash());

// Global middleware for flash messages and user
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.session.user;
  next();
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bhujal', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected successfully');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

// Borewell Schema
const borewellSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  wellType: {
    type: String,
    required: true,
    enum: ['dug-well', 'drilled-well', 'tube-well', 'hand-pump', 'other']
  },
  depthType: {
    type: String,
    required: true
  },
  exactDepth: {
    type: Number,
    required: true
  },
  motorOperated: {
    type: Boolean,
    default: false
  },
  authoritiesAware: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  description: String
}, {
  timestamps: true
});

const Borewell = mongoose.model('Borewell', borewellSchema);

// Helper function to calculate monthly activity
async function calculateMonthlyActivity(userId) {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const months = [];
    const data = [];
    const labels = [];

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      // Count borewells created in this month
      const count = await Borewell.countDocuments({
        customer: userId,
        createdAt: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      });

      labels.push(monthName);
      data.push(count);
    }

    return { labels, data };
  } catch (error) {
    console.error('Error calculating monthly activity:', error);
    // Return default data if error
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      data: [0, 0, 0, 0, 0, 0]
    };
  }
}

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    req.flash('error_msg', 'Please log in to access this page');
    res.redirect('/login');
  }
};

// Routes

// Home page
app.get('/', (req, res) => {
  res.render('index', { title: 'Bhujal - Groundwater Management' });
});

// Register page
app.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('register', { title: 'Register - Bhujal' });
});

// Register POST
app.post('/register', [
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Name must be between 2 and 120 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('phoneNumber').isMobilePhone().withMessage('Please enter a valid phone number'),
  body('address').trim().isLength({ min: 5, max: 200 }).withMessage('Address must be between 5 and 200 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error_msg', errors.array()[0].msg);
      return res.redirect('/register');
    }

    const { name, email, phoneNumber, address, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phoneNumber }]
    });

    if (existingUser) {
      req.flash('error_msg', 'User already exists with this email or phone number');
      return res.redirect('/register');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const user = new User({
      name,
      email,
      phoneNumber,
      address,
      password: hashedPassword
    });

    await user.save();

    req.flash('success_msg', 'Registration successful! Please log in.');
    res.redirect('/login');

  } catch (error) {
    console.error('Registration error:', error);
    req.flash('error_msg', 'Server error during registration');
    res.redirect('/register');
  }
});

// Login page
app.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('login', { title: 'Login - Bhujal' });
});

// Login POST
app.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error_msg', errors.array()[0].msg);
      return res.redirect('/login');
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/login');
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/login');
    }

    // Set session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      address: user.address
    };

    req.flash('success_msg', 'Login successful!');
    res.redirect('/dashboard');

  } catch (error) {
    console.error('Login error:', error);
    req.flash('error_msg', 'Server error during login');
    res.redirect('/login');
  }
});

// Dashboard
app.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const borewells = await Borewell.find({ customer: req.session.user.id });
    const totalBorewells = borewells.length;
    const activeBorewells = borewells.filter(b => b.status === 'active').length;
    
    // Calculate monthly activity data
    const monthlyActivity = await calculateMonthlyActivity(req.session.user.id);
    
    res.render('dashboard', {
      title: 'Dashboard - Bhujal',
      borewells,
      stats: {
        total: totalBorewells,
        active: activeBorewells,
        inactive: totalBorewells - activeBorewells
      },
      monthlyActivity: JSON.stringify(monthlyActivity)
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    req.flash('error_msg', 'Error loading dashboard');
    res.redirect('/');
  }
});

// Map page
app.get('/map', requireAuth, async (req, res) => {
  try {
    const borewells = await Borewell.find({ isPublic: true }).populate('customer', 'name phoneNumber');
    res.render('map', {
      title: 'Map - Bhujal',
      borewells: borewells
    });
  } catch (error) {
    console.error('Map error:', error);
    req.flash('error_msg', 'Error loading map');
    res.redirect('/dashboard');
  }
});

// Add borewell
app.post('/borewells', requireAuth, [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('wellType').isIn(['dug-well', 'drilled-well', 'tube-well', 'hand-pump', 'other']).withMessage('Invalid well type'),
  body('depthType').trim().notEmpty().withMessage('Depth type is required'),
  body('exactDepth').isFloat({ min: 0 }).withMessage('Depth must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error_msg', errors.array()[0].msg);
      return res.redirect('/map');
    }

    const borewellData = {
      ...req.body,
      customer: req.session.user.id,
      location: {
        latitude: parseFloat(req.body.latitude),
        longitude: parseFloat(req.body.longitude)
      },
      exactDepth: parseFloat(req.body.exactDepth),
      motorOperated: req.body.motorOperated === 'on',
      authoritiesAware: req.body.authoritiesAware === 'on',
      isPublic: req.body.isPublic === 'on'
    };

    const borewell = new Borewell(borewellData);
    await borewell.save();

    req.flash('success_msg', 'Borewell registered successfully!');
    res.redirect('/map');

  } catch (error) {
    console.error('Borewell registration error:', error);
    req.flash('error_msg', 'Error registering borewell');
    res.redirect('/map');
  }
});

// Profile page
app.get('/profile', requireAuth, (req, res) => {
  res.render('profile', { title: 'Profile - Bhujal' });
});

// Update profile
app.put('/profile', requireAuth, [
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Name must be between 2 and 120 characters'),
  body('phoneNumber').isMobilePhone().withMessage('Please enter a valid phone number'),
  body('address').trim().isLength({ min: 5, max: 200 }).withMessage('Address must be between 5 and 200 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error_msg', errors.array()[0].msg);
      return res.redirect('/profile');
    }

    const { name, phoneNumber, address } = req.body;

    await User.findByIdAndUpdate(req.session.user.id, {
      name,
      phoneNumber,
      address
    });

    // Update session
    req.session.user.name = name;
    req.session.user.phoneNumber = phoneNumber;
    req.session.user.address = address;

    req.flash('success_msg', 'Profile updated successfully!');
    res.redirect('/profile');

  } catch (error) {
    console.error('Profile update error:', error);
    req.flash('error_msg', 'Error updating profile');
    res.redirect('/profile');
  }
});

// Reports page
app.get('/reports', requireAuth, async (req, res) => {
  try {
    const borewells = await Borewell.find({ customer: req.session.user.id });
    
    // Calculate various statistics for reports
    const reportData = await generateReportData(req.session.user.id);
    
    res.render('reports', {
      title: 'Reports - Bhujal',
      reportData
    });
  } catch (error) {
    console.error('Reports error:', error);
    req.flash('error_msg', 'Error loading reports');
    res.redirect('/dashboard');
  }
});

// Generate report data helper function
async function generateReportData(userId) {
  try {
    const borewells = await Borewell.find({ customer: userId });
    
    // Basic statistics
    const totalBorewells = borewells.length;
    const activeBorewells = borewells.filter(b => b.status === 'active').length;
    const inactiveBorewells = borewells.filter(b => b.status === 'inactive').length;
    const maintenanceBorewells = borewells.filter(b => b.status === 'maintenance').length;
    
    // Well type distribution
    const wellTypes = {
      'dug-well': borewells.filter(b => b.wellType === 'dug-well').length,
      'drilled-well': borewells.filter(b => b.wellType === 'drilled-well').length,
      'tube-well': borewells.filter(b => b.wellType === 'tube-well').length,
      'hand-pump': borewells.filter(b => b.wellType === 'hand-pump').length,
      'other': borewells.filter(b => b.wellType === 'other').length
    };
    
    // Depth analysis
    const depths = borewells.map(b => b.exactDepth).filter(d => d > 0);
    const avgDepth = depths.length > 0 ? depths.reduce((a, b) => a + b, 0) / depths.length : 0;
    const minDepth = depths.length > 0 ? Math.min(...depths) : 0;
    const maxDepth = depths.length > 0 ? Math.max(...depths) : 0;
    
    // Depth categories
    const depthCategories = {
      shallow: borewells.filter(b => b.depthType === 'shallow').length,
      medium: borewells.filter(b => b.depthType === 'medium').length,
      deep: borewells.filter(b => b.depthType === 'deep').length
    };
    
    // Motor operated vs manual
    const motorOperated = borewells.filter(b => b.motorOperated).length;
    const manualOperated = totalBorewells - motorOperated;
    
    // Authorities awareness
    const authoritiesAware = borewells.filter(b => b.authoritiesAware).length;
    const authoritiesNotAware = totalBorewells - authoritiesAware;
    
    // Public vs private
    const publicWells = borewells.filter(b => b.isPublic).length;
    const privateWells = totalBorewells - publicWells;
    
    // Monthly registration data (last 12 months)
    const monthlyData = await calculateMonthlyRegistrations(userId, 12);
    
    return {
      summary: {
        total: totalBorewells,
        active: activeBorewells,
        inactive: inactiveBorewells,
        maintenance: maintenanceBorewells
      },
      wellTypes,
      depthAnalysis: {
        average: Math.round(avgDepth * 100) / 100,
        minimum: minDepth,
        maximum: maxDepth,
        categories: depthCategories
      },
      operations: {
        motorOperated,
        manualOperated,
        authoritiesAware,
        authoritiesNotAware,
        publicWells,
        privateWells
      },
      monthlyData,
      borewells: borewells.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    };
  } catch (error) {
    console.error('Error generating report data:', error);
    return {
      summary: { total: 0, active: 0, inactive: 0, maintenance: 0 },
      wellTypes: {},
      depthAnalysis: {},
      operations: {},
      monthlyData: { labels: [], data: [] },
      borewells: []
    };
  }
}

// Calculate monthly registrations for reports
async function calculateMonthlyRegistrations(userId, months = 12) {
  try {
    const currentDate = new Date();
    const labels = [];
    const data = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const count = await Borewell.countDocuments({
        customer: userId,
        createdAt: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      });

      labels.push(monthName);
      data.push(count);
    }

    return { labels, data };
  } catch (error) {
    console.error('Error calculating monthly registrations:', error);
    return { labels: [], data: [] };
  }
}

// Export report data as JSON
app.get('/api/reports/export/:format', requireAuth, async (req, res) => {
  try {
    const format = req.params.format;
    const reportData = await generateReportData(req.session.user.id);
    
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=bhujal-report.json');
      res.json(reportData);
    } else if (format === 'csv') {
      // Generate CSV format
      const csv = generateCSVReport(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=bhujal-report.csv');
      res.send(csv);
    } else {
      res.status(400).json({ error: 'Invalid format. Use json or csv.' });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Error exporting report data' });
  }
});

// Generate CSV report
function generateCSVReport(reportData) {
  const headers = [
    'ID', 'Well Type', 'Latitude', 'Longitude', 'Depth (m)', 
    'Depth Category', 'Status', 'Motor Operated', 'Authorities Aware', 
    'Public', 'Description', 'Created Date'
  ];
  
  const rows = reportData.borewells.map((borewell, index) => [
    index + 1,
    borewell.wellType.replace('-', ' ').toUpperCase(),
    borewell.location.latitude,
    borewell.location.longitude,
    borewell.exactDepth,
    borewell.depthType,
    borewell.status,
    borewell.motorOperated ? 'Yes' : 'No',
    borewell.authoritiesAware ? 'Yes' : 'No',
    borewell.isPublic ? 'Yes' : 'No',
    borewell.description || 'N/A',
    new Date(borewell.createdAt).toLocaleDateString()
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
    
  return csvContent;
}

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
});

// Weather API (simplified)
app.get('/api/weather/:lat/:lng', async (req, res) => {
  try {
    // Simulated weather data - replace with actual API call
    const weatherData = {
      temperature: Math.round(Math.random() * 20 + 15), // 15-35°C
      humidity: Math.round(Math.random() * 40 + 40), // 40-80%
      pressure: Math.round(Math.random() * 50 + 1000), // 1000-1050 hPa
      windSpeed: Math.round(Math.random() * 20 + 5), // 5-25 km/h
      description: ['Clear sky', 'Partly cloudy', 'Cloudy', 'Light rain'][Math.floor(Math.random() * 4)]
    };
    
    res.json(weatherData);
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(500).json({ error: 'Weather data unavailable' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
