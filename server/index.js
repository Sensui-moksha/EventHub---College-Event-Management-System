// ...existing code...

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';

const app = express();
app.use(cors());
app.use(express.json());

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

// Registration Schema
const registrationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  registeredAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['registered', 'attended', 'absent'], default: 'registered' },
  qrCode: { type: String }
});
const Registration = mongoose.model('Registration', registrationSchema);
// Register for Event
app.post('/api/events/:eventId/register', async (req, res) => {
  try {
    const { userId } = req.body;
    const eventId = req.params.eventId;

    // Check if already registered
    const existing = await Registration.findOne({ userId, eventId });
    if (existing) {
      return res.status(409).json({ error: 'Already registered for this event.' });
    }

    // Check if event is full
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    if (event.currentParticipants >= event.maxParticipants) {
      return res.status(400).json({ error: 'Event is full.' });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Generate QR code data
    const qrData = {
      registrationId: new mongoose.Types.ObjectId().toString(),
      userId: userId,
      eventId: eventId,
      userEmail: user.email,
      userName: user.name,
      eventTitle: event.title,
      registeredAt: new Date().toISOString()
    };

    // Generate QR code string
    const qrCodeString = await QRCode.toDataURL(JSON.stringify(qrData));

    // Create registration with QR code
    const registration = new Registration({ 
      userId, 
      eventId, 
      qrCode: qrCodeString 
    });
    await registration.save();

    // Update event participant count
    event.currentParticipants += 1;
    await event.save();

    // Populate user and event fields for frontend QR code and details
    const populatedRegistration = await Registration.findById(registration._id)
      .populate('userId')
      .populate('eventId');

    // Convert to expected frontend shape
    const regObj = populatedRegistration.toObject();
    regObj.user = regObj.userId;
    regObj.event = regObj.eventId;
    regObj.userId = regObj.userId._id;
    regObj.eventId = regObj.eventId._id;

    res.json({ registration: regObj });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// Get all registrations
app.get('/api/registrations', async (req, res) => {
  try {
    const registrations = await Registration.find()
      .populate('userId')
      .populate('eventId');
    
    // Convert to expected frontend shape
    const formattedRegistrations = registrations.map(reg => {
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
    res.status(500).json({ error: 'Registration failed.' });
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
