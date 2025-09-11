// ...existing code...

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import qrImage from 'qr-image';
import { createCanvas, loadImage } from 'canvas';
import crypto from 'crypto';

const app = express();
app.use(cors());
app.use(express.json());

// QR Code Secret for signing
const QR_SECRET = process.env.QR_CODE_SECRET || 'your_secure_qr_secret_key_change_in_production';

// Utility functions for QR code generation and validation
const generateQRSignature = (payload) => {
  const data = `${payload.registration_id}:${payload.student_id}:${payload.event_id}:${payload.issued_at}`;
  return crypto.createHmac('sha256', QR_SECRET).update(data).digest('hex');
};

const validateQRSignature = (payload) => {
  try {
    const expectedSignature = generateQRSignature(payload);
    return crypto.timingSafeEqual(
      Buffer.from(payload.signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.log('Signature validation error:', error.message);
    return false;
  }
};

const generateUniqueRegistrationId = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Custom QR Code generator with event name overlay
const generateQRCodeWithEventName = async (qrData, eventName, options = {}) => {
  const {
    size = 300,
    fontSize = 14,
    fontFamily = 'Arial',
    fontWeight = 'bold',
    maxChars = 40,
    position = 'below',
    backgroundColor = '#FFFFFF',
    textColor = '#000000',
    qrColor = '#000000'
  } = options;

  try {
    // Truncate event name if too long
    let displayName = eventName.length > maxChars 
      ? eventName.substring(0, maxChars - 3) + '...' 
      : eventName;

    // Generate QR code as PNG buffer
    const qrBuffer = qrImage.imageSync(qrData, { 
      type: 'png', 
      size: size / 4, // qr-image uses different sizing
      margin: 1,
      'parse-url': false
    });

    // Create canvas for combining QR with text
    const padding = 20;
    const textHeight = fontSize + 10;
    const canvasHeight = position === 'below' ? size + textHeight + (padding * 2) : size + (padding * 2);
    const canvasWidth = size + (padding * 2);

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Load and draw QR code
    const qrImg = await loadImage(qrBuffer);
    const qrX = padding;
    const qrY = position === 'below' ? padding : padding + textHeight;
    ctx.drawImage(qrImg, qrX, qrY, size, size);

    // Draw event name text
    ctx.fillStyle = textColor;
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textX = canvasWidth / 2;
    const textY = position === 'below' 
      ? size + padding + (textHeight / 2)
      : textHeight / 2;

    // Add text background for better readability
    const textMetrics = ctx.measureText(displayName);
    const textWidth = textMetrics.width;
    const textPadding = 8;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(
      textX - (textWidth / 2) - textPadding,
      textY - (fontSize / 2) - 4,
      textWidth + (textPadding * 2),
      fontSize + 8
    );

    // Draw the text
    ctx.fillStyle = textColor;
    ctx.fillText(displayName, textX, textY);

    // Convert to data URL
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('QR Code generation error:', error);
    // Fallback to basic QR code without overlay
    return await QRCode.toDataURL(qrData, {
      width: size,
      margin: 2,
      color: { dark: qrColor, light: backgroundColor }
    });
  }
};

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'student', required: true },
  department: { type: String, required: true },
  branch: { type: String, required: true },
  mobile: { type: String, required: true },
  year: { type: Number, required: true },
  regId: { type: String }, // Add regId field for students
  section: { type: String }, // Add section field
  avatar: { type: String }, // Add avatar field for profile pictures
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// Event Schema
const eventSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  date: Date,
  time: String,
  venue: String,
  maxParticipants: Number,
  currentParticipants: { type: Number, default: 0 },
  organizerId: String,
  image: String,
  requirements: [String],
  prizes: [String],
  status: { type: String, default: 'upcoming' },
  registrationDeadline: Date,
  createdAt: { type: Date, default: Date.now }
});
const Event = mongoose.model('Event', eventSchema);

// Registration Schema - Enhanced for per-event QR codes
const registrationSchema = new mongoose.Schema({
  registrationId: { type: String, unique: true, required: true }, // Unique per registration
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  registeredAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['registered', 'attended', 'absent', 'cancelled'], default: 'registered' },
  qrCode: { type: String }, // Base64 QR code image
  qrPayload: {
    registration_id: String,
    student_id: String,
    event_id: String,
    issued_at: String,
    expires_at: String,
    signature: String,
    event_title: String,
    student_name: String
  },
  scanLogs: [{
    scannedAt: { type: Date, default: Date.now },
    scannedBy: String,
    location: String,
    status: { type: String, enum: ['valid', 'invalid', 'expired', 'duplicate'], required: true },
    notes: String
  }]
});

// Ensure unique registration per student per event
registrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

const Registration = mongoose.model('Registration', registrationSchema);

// Scan Log Schema for detailed tracking
const scanLogSchema = new mongoose.Schema({
  registrationId: { type: String, required: true },
  scannedAt: { type: Date, default: Date.now },
  scannedBy: String,
  location: String,
  status: { type: String, enum: ['valid', 'invalid', 'expired', 'duplicate'], required: true },
  notes: String,
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const ScanLog = mongoose.model('ScanLog', scanLogSchema);
// Multi-Event Registration Endpoint
app.post('/api/events/register-multiple', async (req, res) => {
  try {
    const { userId, eventIds } = req.body;
    
    if (!userId || !eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const results = {
      totalEvents: eventIds.length,
      successfulRegistrations: 0,
      failedRegistrations: [],
      registrations: []
    };

    // Process each event registration
    for (const eventId of eventIds) {
      try {
        // Check if already registered
        const existingRegistration = await Registration.findOne({ userId, eventId });
        if (existingRegistration) {
          results.failedRegistrations.push({
            eventId,
            reason: 'Already registered for this event'
          });
          continue;
        }

        // Get event details
        const event = await Event.findById(eventId);
        if (!event) {
          results.failedRegistrations.push({
            eventId,
            reason: 'Event not found'
          });
          continue;
        }

        // Check if event is full
        if (event.currentParticipants >= event.maxParticipants) {
          results.failedRegistrations.push({
            eventId,
            reason: 'Event is full'
          });
          continue;
        }

        // Check if registration deadline has passed
        if (new Date() > new Date(event.registrationDeadline)) {
          results.failedRegistrations.push({
            eventId,
            reason: 'Registration deadline has passed'
          });
          continue;
        }

        // Generate unique registration ID
        const registrationId = generateUniqueRegistrationId();
        const issuedAt = new Date().toISOString();
        const expiresAt = new Date(event.date).toISOString(); // QR expires when event ends

        // Create QR payload with signature
        const qrPayload = {
          registration_id: registrationId,
          student_id: userId,
          event_id: eventId,
          issued_at: issuedAt,
          expires_at: expiresAt,
          signature: '', // Will be generated below
          event_title: event.title,
          student_name: user.name
        };

        // Generate cryptographic signature
        qrPayload.signature = generateQRSignature(qrPayload);

        // Generate QR code image with event name overlay
        const qrCodeString = await generateQRCodeWithEventName(
          JSON.stringify(qrPayload), 
          event.title,
          {
            size: 300,
            fontSize: 16,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            maxChars: 40,
            position: 'below',
            backgroundColor: '#FFFFFF',
            textColor: '#000000',
            qrColor: '#000000'
          }
        );

        // Create registration record
        const registration = new Registration({
          registrationId,
          userId,
          eventId,
          qrCode: qrCodeString,
          qrPayload,
          scanLogs: []
        });

        await registration.save();

        // Update event participant count
        event.currentParticipants += 1;
        await event.save();

        // Populate for response
        const populatedRegistration = await Registration.findById(registration._id)
          .populate('userId')
          .populate('eventId');

        const regObj = populatedRegistration.toObject();
        regObj.user = regObj.userId;
        regObj.event = regObj.eventId;
        regObj.userId = regObj.userId._id;
        regObj.eventId = regObj.eventId._id;
        regObj.id = regObj._id;

        results.registrations.push(regObj);
        results.successfulRegistrations++;

      } catch (error) {
        console.error(`Registration error for event ${eventId}:`, error);
        results.failedRegistrations.push({
          eventId,
          reason: 'Registration processing failed'
        });
      }
    }

    res.json(results);
  } catch (err) {
    console.error('Multi-event registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Single Event Registration (backwards compatibility)
app.post('/api/events/:eventId/register', async (req, res) => {
  try {
    const { userId } = req.body;
    const eventId = req.params.eventId;

    // Find the user first
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user is already registered
    const existingRegistration = await Registration.findOne({ 
      userId, 
      eventId: eventId 
    });

    if (existingRegistration) {
      return res.status(409).json({ error: 'Already registered for this event' });
    }

    // Check capacity
    if (event.currentParticipants >= event.maxParticipants) {
      return res.status(400).json({ error: 'Event is full' });
    }

    // Check registration deadline
    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ error: 'Registration deadline has passed' });
    }

    // Create registration
    const registrationId = generateUniqueRegistrationId();
    const qrPayload = {
      registrationId,
      userId,
      eventIds: [eventId],
      timestamp: Date.now()
    };

    const signature = generateQRSignature(qrPayload);
    const qrData = JSON.stringify({ ...qrPayload, signature });
    
    // Generate QR code with event name overlay
    const qrCodeUrl = await generateQRCodeWithEventName(
      qrData,
      event.title,
      {
        size: 300,
        fontSize: 16,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        maxChars: 40,
        position: 'below',
        backgroundColor: '#FFFFFF',
        textColor: '#000000',
        qrColor: '#000000'
      }
    );

    const registration = new Registration({
      registrationId,
      userId,
      eventId: eventId,
      qrCode: qrCodeUrl,
      qrPayload: {
        registration_id: registrationId,
        student_id: userId,
        event_id: eventId,
        issued_at: new Date().toISOString(),
        expires_at: new Date(event.date).toISOString(),
        signature: signature,
        event_title: event.title,
        student_name: user.name
      },
      registeredAt: new Date()
    });

    await registration.save();

    // Update event participant count
    event.currentParticipants += 1;
    await event.save();

    res.json({
      success: true,
      registration: {
        id: registrationId,
        event: event,
        qrCode: qrCodeUrl,
        registeredAt: registration.registeredAt
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// QR Code Validation Endpoint
app.post('/api/qr/validate', async (req, res) => {
  try {
    const { qrData, eventId, scannedBy, location } = req.body;
    
    console.log('QR Validation Request:');
    console.log('- QR Data received:', qrData);
    console.log('- QR Data length:', qrData?.length);
    console.log('- Event ID:', eventId);
    console.log('- Scanned by:', scannedBy);
    console.log('- Location:', location);
    
    let qrPayload;
    try {
      qrPayload = JSON.parse(qrData);
      console.log('- Parsed QR Payload:', qrPayload);
      console.log('- QR Payload fields:', Object.keys(qrPayload));
    } catch (error) {
      console.log('- QR Data parsing failed:', error.message);
      return res.json({
        valid: false,
        reason: 'Invalid QR code format'
      });
    }

    // Validate required fields
    const requiredFields = ['registration_id', 'student_id', 'event_id', 'signature'];
    const missingFields = requiredFields.filter(field => !qrPayload[field]);
    
    if (missingFields.length > 0) {
      console.log('- Missing required fields:', missingFields);
      return res.json({
        valid: false,
        reason: `Missing required QR code fields: ${missingFields.join(', ')}`
      });
    }

    // Validate signature
    console.log('- Validating signature...');
    if (!validateQRSignature(qrPayload)) {
      console.log('- Signature validation failed');
      return res.json({
        valid: false,
        reason: 'Invalid QR code signature'
      });
    }
    console.log('- Signature validation passed');

    // Check if scanning for correct event
    if (eventId && qrPayload.event_id !== eventId) {
      console.log(`- Event ID mismatch: expected ${eventId}, got ${qrPayload.event_id}`);
      return res.json({
        valid: false,
        reason: 'QR code is for a different event'
      });
    }

    // Find the registration
    const registration = await Registration.findOne({
      registrationId: qrPayload.registration_id,
      userId: qrPayload.student_id,
      eventId: qrPayload.event_id
    }).populate('userId').populate('eventId');

    if (!registration) {
      return res.json({
        valid: false,
        reason: 'Registration not found'
      });
    }

    // Check if registration is active
    if (registration.status === 'cancelled') {
      return res.json({
        valid: false,
        reason: 'Registration has been cancelled'
      });
    }

    // Check if QR code has expired
    if (qrPayload.expires_at && new Date() > new Date(qrPayload.expires_at)) {
      return res.json({
        valid: false,
        reason: 'QR code has expired'
      });
    }

    // Check for duplicate scans (if already attended)
    if (registration.status === 'attended') {
      return res.json({
        valid: false,
        reason: 'Already marked as attended',
        registration: {
          ...registration.toObject(),
          user: registration.userId,
          event: registration.eventId,
          userId: registration.userId._id,
          eventId: registration.eventId._id,
          id: registration._id
        }
      });
    }

    // Create scan log
    const scanLog = {
      scannedAt: new Date(),
      scannedBy: scannedBy || 'system',
      location: location || 'unknown',
      status: 'valid',
      notes: 'Valid scan - marked as attended'
    };

    // Update registration status and add scan log
    registration.status = 'attended';
    registration.scanLogs.push(scanLog);
    await registration.save();

    // Also create a standalone scan log for admin tracking
    const standaloneScanLog = new ScanLog({
      registrationId: registration.registrationId,
      scannedAt: scanLog.scannedAt,
      scannedBy: scanLog.scannedBy,
      location: scanLog.location,
      status: scanLog.status,
      notes: scanLog.notes,
      eventId: registration.eventId,
      userId: registration.userId
    });
    await standaloneScanLog.save();

    res.json({
      valid: true,
      registration: {
        ...registration.toObject(),
        user: registration.userId,
        event: registration.eventId,
        userId: registration.userId._id,
        eventId: registration.eventId._id,
        id: registration._id
      },
      scanLog
    });

  } catch (err) {
    console.error('QR validation error:', err);
    res.status(500).json({ 
      valid: false, 
      reason: 'QR validation failed' 
    });
  }
});

// Get Scan Logs for Admin
app.get('/api/scan-logs', async (req, res) => {
  try {
    const { eventId, userId, status } = req.query;
    
    let filter = {};
    if (eventId) filter.eventId = eventId;
    if (userId) filter.userId = userId;
    if (status) filter.status = status;

    const scanLogs = await ScanLog.find(filter)
      .populate('eventId')
      .populate('userId')
      .sort({ scannedAt: -1 });

    res.json({ scanLogs });
  } catch (err) {
    console.error('Error fetching scan logs:', err);
    res.status(500).json({ error: 'Failed to fetch scan logs' });
  }
});

// Get all registrations
app.get('/api/registrations', async (req, res) => {
  try {
    const registrations = await Registration.find()
      .populate('userId')
      .populate('eventId');
    
    // Convert to expected frontend shape
    const formattedRegistrations = registrations
      .filter(reg => reg.userId && reg.eventId) // Filter out registrations with missing user or event
      .map(reg => {
        const regObj = reg.toObject();
        regObj.user = regObj.userId;
        regObj.event = regObj.eventId;
        regObj.userId = regObj.userId._id;
        regObj.eventId = regObj.eventId._id;
        regObj.id = regObj._id;
        return regObj;
      });
    
    res.json({ registrations: formattedRegistrations });
  } catch (err) {
    console.error('Error fetching registrations:', err);
    res.status(500).json({ error: 'Failed to fetch registrations.' });
  }
});

// Unregister from Event
app.post('/api/events/:eventId/unregister', async (req, res) => {
  try {
    const { userId } = req.body;
    const eventId = req.params.eventId;

    const registration = await Registration.findOneAndDelete({ userId, eventId });
    if (!registration) {
      return res.status(404).json({ error: 'Registration not found.' });
    }

    // Update event participant count
    const event = await Event.findById(eventId);
    if (event && event.currentParticipants > 0) {
      event.currentParticipants -= 1;
      await event.save();
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Unregistration failed.' });
  }
});

// Auth Routes
app.post('/api/register', async (req, res) => {
  console.log('Register API received:', req.body);
  try {
    const { name, email, password, role, department, branch, mobile, year, regId, section } = req.body;
    if (!name || !email || !password || !role || !department || !branch || !mobile || !year) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }
    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role, department, branch, mobile, year, regId, section });
    await user.save();
    // Don't send password back
    const userObj = user.toObject();
    delete userObj.password;
    res.json({ user: userObj });
  } catch (err) {
    console.error('Registration error details:', err);
    res.status(500).json({ error: 'Registration failed.', details: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
  // Don't send password back
  const userObj = user.toObject();
  delete userObj.password;
  res.json({ message: 'Login successful', user: userObj });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update user profile
app.put('/api/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, department, section, mobile, year, regId, avatar } = req.body;
    
    // Find and update user
    const user = await User.findByIdAndUpdate(
      id,
      { name, email, department, section, mobile, year, regId, avatar },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    // Don't send password back
    const userObj = user.toObject();
    delete userObj.password;
    
    res.json({ user: userObj });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(400).json({ error: 'Failed to update profile.' });
  }
});

// Change user password
app.put('/api/user/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }
    
    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }
    
    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    user.password = hashedNewPassword;
    await user.save();
    
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

// Admin endpoints for user management
// Get all users (admin only)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Exclude password field
    res.json({ users });
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// Admin: Update any user's profile
app.put('/api/admin/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, department, section, mobile, year, regId, avatar, role } = req.body;
    
    // Find and update user
    const user = await User.findByIdAndUpdate(
      id,
      { name, email, department, section, mobile, year, regId, avatar, role },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    res.json({ user });
  } catch (err) {
    console.error('Admin user update error:', err);
    res.status(400).json({ error: 'Failed to update user.' });
  }
});

// Admin: Change any user's password
app.put('/api/admin/user/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required.' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }
    
    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    user.password = hashedNewPassword;
    await user.save();
    
    res.json({ success: true, message: 'Password updated successfully by admin.' });
  } catch (err) {
    console.error('Admin password change error:', err);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

// Admin: Delete user
app.delete('/api/admin/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    // Also delete user's registrations
    await Registration.deleteMany({ userId: id });
    
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Admin user delete error:', err);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// Event Routes
app.get('/api/events', async (req, res) => {
  const events = await Event.find();
  res.json(events);
});

app.post('/api/events', async (req, res) => {
  try {
    // Log the incoming request body for debugging
    console.log('Event creation request body:', req.body);
    console.log('Event creation request body keys:', Object.keys(req.body));
    // Log each field and its type for debugging
    const requiredFields = ['title','description','category','date','time','venue','maxParticipants','organizerId','registrationDeadline'];
    requiredFields.forEach(field => {
      console.log(`${field}:`, req.body[field], 'type:', typeof req.body[field]);
    });
    const {
      title,
      description,
      category,
      date,
      time,
      venue,
      maxParticipants,
      organizerId,
      image,
      requirements,
      prizes,
      status,
      registrationDeadline
    } = req.body;

    if (!title || !description || !category || !date || !time || !venue || !maxParticipants || !organizerId || !registrationDeadline) {
      return res.status(400).json({ error: 'All required fields must be filled.' });
    }

    const event = new Event({
      title,
      description,
      category,
      date,
      time,
      venue,
      maxParticipants,
      organizerId,
      image,
      requirements,
      prizes,
      status,
      registrationDeadline
    });
    await event.save();
    res.status(201).json({ event });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/events/:id', async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      date,
      time,
      venue,
      maxParticipants,
      organizerId,
      registrationDeadline
    } = req.body;

    if (!title || !description || !category || !date || !time || !venue || !maxParticipants || !organizerId || !registrationDeadline) {
      return res.status(400).json({ error: 'All required fields must be filled.' });
    }

    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ event });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// Bulk delete events
app.delete('/api/events', async (req, res) => {
  try {
    const { eventIds } = req.body;
    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return res.status(400).json({ error: 'No event IDs provided.' });
    }
    const result = await Event.deleteMany({ _id: { $in: eventIds } });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
