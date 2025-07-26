const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Borewell = require('../models/Borewell');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/borewell/register
// @desc    Register a new borewell
// @access  Private
router.post('/register', auth, [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('wellType')
    .isIn(['dug-well', 'drilled-well', 'tube-well', 'other'])
    .withMessage('Invalid well type'),
  body('depthType')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Depth type must be between 1 and 100 characters'),
  body('exactDepth')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Exact depth must be a positive number'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      latitude,
      longitude,
      address,
      wellType,
      depthType,
      wallType,
      supplySystem,
      exactDepth,
      motorOperated,
      authoritiesAware,
      description,
      isPublic
    } = req.body;

    // Check if borewell already exists at this location for this user
    const existingBorewell = await Borewell.findOne({
      customer: req.user.userId,
      'location.latitude': { $gte: latitude - 0.001, $lte: latitude + 0.001 },
      'location.longitude': { $gte: longitude - 0.001, $lte: longitude + 0.001 }
    });

    if (existingBorewell) {
      return res.status(400).json({
        success: false,
        message: 'A borewell already exists at this location'
      });
    }

    // Create new borewell
    const borewell = new Borewell({
      customer: req.user.userId,
      location: {
        latitude,
        longitude,
        address: address || ''
      },
      wellType,
      depthType,
      wallType: wallType || '',
      supplySystem: supplySystem || '',
      exactDepth: exactDepth || 0,
      motorOperated: Boolean(motorOperated),
      authoritiesAware: Boolean(authoritiesAware),
      description: description || '',
      isPublic: isPublic !== undefined ? Boolean(isPublic) : true
    });

    await borewell.save();

    // Populate customer data for response
    await borewell.populate('customer', 'name phoneNumber email');

    res.status(201).json({
      success: true,
      message: 'Borewell registered successfully',
      borewell: {
        id: borewell._id,
        location: borewell.location,
        wellType: borewell.wellType,
        customer: {
          name: borewell.customer.name,
          phoneNumber: borewell.customer.phoneNumber,
          email: borewell.customer.email
        }
      }
    });

  } catch (error) {
    console.error('Borewell registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during borewell registration'
    });
  }
});

// @route   GET /api/borewell/my-borewells
// @desc    Get all borewells for the logged-in user
// @access  Private
router.get('/my-borewells', auth, async (req, res) => {
  try {
    const borewells = await Borewell.find({ customer: req.user.userId })
      .populate('customer', 'name phoneNumber email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: borewells.length,
      borewells
    });

  } catch (error) {
    console.error('Get user borewells error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/borewell/all
// @desc    Get all public borewells
// @access  Public
router.get('/all', [
  query('lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  query('lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  query('radius')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Radius must be a positive number'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { lat, lng, radius, limit = 100 } = req.query;
    let query = { isPublic: true, status: 'active' };

    // If coordinates and radius provided, filter by location
    if (lat && lng && radius) {
      const latRange = parseFloat(radius) / 111; // Approximate km to degrees
      const lngRange = parseFloat(radius) / (111 * Math.cos(parseFloat(lat) * Math.PI / 180));

      query['location.latitude'] = {
        $gte: parseFloat(lat) - latRange,
        $lte: parseFloat(lat) + latRange
      };
      query['location.longitude'] = {
        $gte: parseFloat(lng) - lngRange,
        $lte: parseFloat(lng) + lngRange
      };
    }

    const borewells = await Borewell.find(query)
      .populate('customer', 'name phoneNumber address email')
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Format response for map display
    const borewellData = borewells.map(borewell => ({
      id: borewell._id,
      latitude: borewell.location.latitude,
      longitude: borewell.location.longitude,
      address: borewell.location.address,
      wellType: borewell.wellType,
      exactDepth: borewell.exactDepth,
      waterLevel: borewell.waterLevel,
      status: borewell.status,
      customer: {
        name: borewell.customer.name,
        phoneNumber: borewell.customer.phoneNumber,
        address: borewell.customer.address,
        email: borewell.customer.email
      },
      createdAt: borewell.createdAt
    }));

    res.json({
      success: true,
      count: borewellData.length,
      borewells: borewellData
    });

  } catch (error) {
    console.error('Get all borewells error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/borewell/owners
// @desc    Get borewell owners in a specific area
// @access  Public
router.get('/owners', [
  query('lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  query('lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  query('radius')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Radius must be a positive number')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { lat, lng, radius } = req.query;
    let query = { isPublic: true, status: 'active' };

    // If coordinates and radius provided, filter by location
    if (lat && lng && radius) {
      const latRange = parseFloat(radius) / 111; // Approximate km to degrees
      const lngRange = parseFloat(radius) / (111 * Math.cos(parseFloat(lat) * Math.PI / 180));

      query['location.latitude'] = {
        $gte: parseFloat(lat) - latRange,
        $lte: parseFloat(lat) + latRange
      };
      query['location.longitude'] = {
        $gte: parseFloat(lng) - lngRange,
        $lte: parseFloat(lng) + lngRange
      };
    }

    const borewells = await Borewell.find(query)
      .populate('customer', 'name phoneNumber address email')
      .select('location customer');

    // Format response for owner information
    const ownersData = borewells.map(borewell => ({
      name: borewell.customer.name,
      address: borewell.customer.address,
      phone: borewell.customer.phoneNumber,
      email: borewell.customer.email,
      latitude: borewell.location.latitude,
      longitude: borewell.location.longitude
    }));

    res.json(ownersData);

  } catch (error) {
    console.error('Get borewell owners error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/borewell/:id
// @desc    Update a borewell
// @access  Private
router.put('/:id', auth, [
  body('exactDepth')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Exact depth must be a positive number'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('currentWaterLevel')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Water level must be a positive number')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      exactDepth,
      description,
      currentWaterLevel,
      motorOperated,
      authoritiesAware,
      status,
      isPublic
    } = req.body;

    // Find borewell and ensure it belongs to the user
    const borewell = await Borewell.findOne({
      _id: req.params.id,
      customer: req.user.userId
    });

    if (!borewell) {
      return res.status(404).json({
        success: false,
        message: 'Borewell not found or unauthorized'
      });
    }

    // Update fields
    if (exactDepth !== undefined) borewell.exactDepth = exactDepth;
    if (description !== undefined) borewell.description = description;
    if (motorOperated !== undefined) borewell.motorOperated = Boolean(motorOperated);
    if (authoritiesAware !== undefined) borewell.authoritiesAware = Boolean(authoritiesAware);
    if (status !== undefined && ['active', 'inactive', 'maintenance', 'dry'].includes(status)) {
      borewell.status = status;
    }
    if (isPublic !== undefined) borewell.isPublic = Boolean(isPublic);

    // Update water level if provided
    if (currentWaterLevel !== undefined) {
      borewell.waterLevel = {
        ...borewell.waterLevel,
        current: currentWaterLevel,
        lastUpdated: new Date()
      };
    }

    await borewell.save();

    res.json({
      success: true,
      message: 'Borewell updated successfully',
      borewell
    });

  } catch (error) {
    console.error('Update borewell error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during borewell update'
    });
  }
});

// @route   DELETE /api/borewell/:id
// @desc    Delete a borewell
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const borewell = await Borewell.findOneAndDelete({
      _id: req.params.id,
      customer: req.user.userId
    });

    if (!borewell) {
      return res.status(404).json({
        success: false,
        message: 'Borewell not found or unauthorized'
      });
    }

    res.json({
      success: true,
      message: 'Borewell deleted successfully'
    });

  } catch (error) {
    console.error('Delete borewell error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during borewell deletion'
    });
  }
});

module.exports = router;
