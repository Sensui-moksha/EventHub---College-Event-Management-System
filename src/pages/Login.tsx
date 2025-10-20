import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
<<<<<<< HEAD
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Eye, EyeOff } from 'lucide-react';
=======
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Eye, EyeOff } from 'lucide-react';
import { pageVariants, fadeInVariants, slideInBottomVariants } from '../utils/animations';
>>>>>>> 7c79b6e (Remove clg logo and images for GitHub push)

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

<<<<<<< HEAD
  // Demo accounts for quick login
  const demoAccounts = [
    { label: 'Admin', email: 'admin@college.edu', password: 'admin123' },
    { label: 'Organizer', email: 'organizer@college.edu', password: 'organizer123' },
    { label: 'Student', email: 'student1@college.edu', password: 'student123' },
  ];
=======
>>>>>>> 7c79b6e (Remove clg logo and images for GitHub push)
  const { login, loading } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check for empty fields
    if (!email.trim() || !password.trim()) {
      addToast({
        type: 'error',
        title: 'Missing Fields',
        message: 'Please enter both email and password.',
      });
      return;
    }

    const success = await login(email, password);
    if (success) {
      addToast({
        type: 'success',
        title: 'Welcome back!',
        message: 'You have successfully logged in.',
      });
<<<<<<< HEAD
      navigate('/dashboard');
=======
      navigate('/'); // Redirect to Home page
>>>>>>> 7c79b6e (Remove clg logo and images for GitHub push)
    } else {
      addToast({
        type: 'error',
        title: 'Login Failed',
        message: 'Invalid credentials or server error.',
      });
    }
  };

<<<<<<< HEAD
  // Helper to autofill and login
  const autofillAndLogin = async (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
    // Wait for state to update before submitting
    setTimeout(() => {
      document.getElementById('login-submit-btn')?.click();
    }, 100);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign in to EventHub</h2>
          <p className="text-gray-600">Use your credentials or demo accounts below.</p>
        </div>

        {/* Demo Accounts */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="mb-2 font-semibold text-blue-700">Demo Accounts</div>
          <div className="flex gap-2 flex-wrap">
            {demoAccounts.map(acc => (
              <button
                key={acc.label}
                type="button"
                className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                onClick={() => autofillAndLogin(acc.email, acc.password)}
              >
                {acc.label}
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-600">Click to autofill credentials and login for quick testing.</div>
        </div>

        {/* Login Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
=======
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
          {/* Logo removed for GitHub push */}
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign in to EventHub</h2>
          <p className="text-gray-600">Enter your credentials to access your account.</p>
        </motion.div>

        {/* Login Form */}
        <motion.form 
          className="space-y-6" 
          onSubmit={handleSubmit}
          variants={slideInBottomVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
        >
>>>>>>> 7c79b6e (Remove clg logo and images for GitHub push)
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your email"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your password"
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
          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
<<<<<<< HEAD
        </form>

        {/* Footer */}
        <div className="text-center mt-4">
=======
        </motion.form>

        {/* Footer */}
        <motion.div 
          className="text-center mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
>>>>>>> 7c79b6e (Remove clg logo and images for GitHub push)
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Register here
            </Link>
          </p>
<<<<<<< HEAD
        </div>
      </div>
    </div>
=======
        </motion.div>
      </motion.div>
    </motion.div>
>>>>>>> 7c79b6e (Remove clg logo and images for GitHub push)
  );
}

export default Login;