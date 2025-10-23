import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  GraduationCap,
  Building,
  Calendar
} from 'lucide-react';
import { pageVariants, fadeInVariants } from '../utils/animations';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as 'student' | 'organizer' | 'faculty',
    department: '',
    section: '',
    roomNo: '',
    mobile: '',
    year: 1,
    regId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, loading } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const departments = [
    'CSE',
    'IT',
    'AI & DS',
    'AI & ML',
    'ECE',
    'EEE',
    'Mechanical',
    'Civil',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      addToast({
        type: 'error',
        title: 'Password Mismatch',
        message: 'Passwords do not match.',
      });
      return;
    }

    if (formData.password.length < 6) {
      addToast({
        type: 'error',
        title: 'Weak Password',
        message: 'Password must be at least 6 characters long.',
      });
      return;
    }
    if (!formData.name.trim()) {
      addToast({
        type: 'error',
        title: 'Full Name Required',
        message: 'Please enter your full name.',
      });
      return;
    }
    if (!formData.email.trim()) {
      addToast({
        type: 'error',
        title: 'Email Required',
        message: 'Please enter your email address.',
      });
      return;
    }
    if (!formData.department.trim()) {
      addToast({
        type: 'error',
        title: 'Department Required',
        message: 'Please select your department.',
      });
      return;
    }
    if (formData.role === 'student' && (!formData.year || isNaN(Number(formData.year)) || Number(formData.year) < 1 || Number(formData.year) > 4)) {
      addToast({
        type: 'error',
        title: 'Year of Study Required',
        message: 'Please select a valid year of study (1-4).',
      });
      return;
    }
    if (formData.role === 'student' && !formData.section.trim()) {
      addToast({
        type: 'error',
        title: 'Section Required',
        message: 'Please enter your section.',
      });
      return;
    }
    if (formData.role === 'faculty' && !formData.roomNo.trim()) {
      addToast({
        type: 'error',
        title: 'Room No Required',
        message: 'Please enter your room number.',
      });
      return;
    }
    if (!formData.mobile.trim() || !/^\d{10}$/.test(formData.mobile)) {
      addToast({
        type: 'error',
        title: 'Mobile Number Required',
        message: 'Please enter a valid 10-digit mobile number.',
      });
      return;
    }
    if (formData.role === 'student' && !formData.year) {
      addToast({
        type: 'error',
        title: 'Year of Study Required',
        message: 'Please select your year of study.',
      });
      return;
    }
    if ((formData.role === 'student' || formData.role === 'faculty') && !formData.regId.trim()) {
      addToast({
        type: 'error',
        title: 'Registration ID Required',
        message: 'Please enter your Registration ID.',
      });
      return;
    }

    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      department: formData.department,
      section: formData.role === 'student' ? formData.section : undefined, // Include section for students
      roomNo: formData.role === 'faculty' ? formData.roomNo : undefined, // Include room no for faculty
      branch: formData.department, // Send branch as department value
      mobile: formData.mobile,
      year: formData.role === 'student' ? formData.year : (undefined as unknown as number),
      regId: (formData.role === 'student' || formData.role === 'faculty') ? formData.regId : undefined,
    });
    if (result.success) {
      addToast({
        type: 'success',
        title: 'Account Created!',
        message: 'Welcome to EventHub!',
      });
      navigate('/'); // Redirect to Home page
    } else {
      addToast({
        type: 'error',
        title: result.error === 'Account already exists with this email.' ? 'Account Already Exists' : 'Registration Failed',
        message: result.error || 'Please try again later.',
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' ? parseInt(value) : value,
    }));
  };

  return (
    <motion.div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.div 
        className="max-w-md w-full space-y-8"
        variants={fadeInVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        {/* Header */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 shadow-lg border border-gray-200">
              <img 
                src="/logo-small.png" 
                alt="College Logo" 
                className="h-16 w-auto object-contain mx-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  // Show fallback graduation cap icon
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Join EventHub
          </h2>
          <p className="text-gray-600">
            Create your account to start exploring events
          </p>
        </motion.div>

        {/* Registration Form */}
        <motion.form 
          className="space-y-6" 
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your email"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="student">Student</option>
              <option value="organizer">Event Organizer</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>

          {/* Department */}
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                id="department"
                name="department"
                required
                value={formData.department}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section (Student) / Room No (Faculty) */}
          {formData.role === 'student' ? (
            <div>
              <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-2">
                Section
              </label>
              <div className="relative">
                <input
                  id="section"
                  name="section"
                  type="text"
                  required
                  value={formData.section}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your section (e.g., A, B, C)"
                />
              </div>
            </div>
          ) : formData.role === 'faculty' ? (
            <div>
              <label htmlFor="roomNo" className="block text-sm font-medium text-gray-700 mb-2">
                Room No
              </label>
              <div className="relative">
                <input
                  id="roomNo"
                  name="roomNo"
                  type="text"
                  required
                  value={formData.roomNo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your room number"
                />
              </div>
            </div>
          ) : null}

          {/* Mobile Number */}
          <div>
            <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-2">
              Mobile Number
            </label>
            <div className="relative">
              <input
                id="mobile"
                name="mobile"
                type="tel"
                required
                pattern="\d{10}"
                value={formData.mobile}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your 10-digit mobile number"
              />
            </div>
          </div>

          {/* Year (for students only) */}
          {formData.role === 'student' && (
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                Year of Study
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                </select>
              </div>
            </div>
          )}

          {/* Reg. ID (for students and faculty) */}
          {(formData.role === 'student' || formData.role === 'faculty') && (
            <div>
              <label htmlFor="regId" className="block text-sm font-medium text-gray-700 mb-2">
                Registration ID <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="regId"
                  name="regId"
                  type="text"
                  required
                  value={formData.regId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your Registration ID"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Create a password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </motion.form>

        {/* Footer */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in here
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Register;