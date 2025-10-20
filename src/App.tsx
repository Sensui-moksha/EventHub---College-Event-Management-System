<<<<<<< HEAD
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Component, ReactNode } from 'react';
=======
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Component, ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
>>>>>>> 7c79b6e (Remove clg logo and images for GitHub push)
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider } from './contexts/AuthContext';
import { EventProvider } from './contexts/EventContext';
import { ToastProvider } from './components/ui/Toast';
import Navbar from './components/Navbar';
import OverlayFooter from './components/OverlayFooter';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Events from './pages/Events';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import AdminUsers from './pages/AdminUsers';
import QRScannerPage from './pages/QRScannerPage';
import ProtectedRoute from './components/ProtectedRoute';
import EventDetails from './pages/EventDetails';
import CreateEvent from './pages/CreateEvent';
import CalendarPage from './pages/CalendarPage';

// Simple error boundary
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.log('Error caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40 }}>
          <h1 style={{ color: 'red' }}>Something went wrong.</h1>
          <pre>{this.state.error && this.state.error.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

<<<<<<< HEAD
=======
// Routes component with animations
function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={
          <ErrorBoundary>
            <Login />
          </ErrorBoundary>
        } />
        <Route path="/register" element={
          <ErrorBoundary>
            <Register />
          </ErrorBoundary>
        } />
        <Route path="/events" element={
          <ErrorBoundary>
            <Events />
          </ErrorBoundary>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <ErrorBoundary>
              <Dashboard />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ErrorBoundary>
              <Profile />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/admin-users" element={
          <ProtectedRoute>
            <ErrorBoundary>
              <AdminUsers />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/events/:id" element={
          <ErrorBoundary>
            <EventDetails />
          </ErrorBoundary>
        } />
        <Route path="/events/:id/edit" element={
          <ProtectedRoute>
            <ErrorBoundary>
              <CreateEvent />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/create-event" element={
          <ProtectedRoute>
            <ErrorBoundary>
              <CreateEvent />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/qr-scanner" element={
          <ProtectedRoute>
            <ErrorBoundary>
              <QRScannerPage />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
      </Routes>
    </AnimatePresence>
  );
}

>>>>>>> 7c79b6e (Remove clg logo and images for GitHub push)
function App() {
  console.log("App component is rendering");
  
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AuthProvider>
          <EventProvider>
            <ToastProvider>
              <Router>
                <div className="min-h-screen flex flex-col">
                  <Navbar />
                  <main className="flex-1">
<<<<<<< HEAD
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/login" element={
                        <ErrorBoundary>
                          <Login />
                        </ErrorBoundary>
                      } />
                      <Route path="/register" element={
                        <ErrorBoundary>
                          <Register />
                        </ErrorBoundary>
                      } />
                      <Route path="/events" element={
                        <ErrorBoundary>
                          <Events />
                        </ErrorBoundary>
                      } />
                      <Route path="/dashboard" element={
                        <ProtectedRoute>
                          <ErrorBoundary>
                            <Dashboard />
                          </ErrorBoundary>
                        </ProtectedRoute>
                      } />
                      <Route path="/profile" element={
                        <ProtectedRoute>
                          <ErrorBoundary>
                            <Profile />
                          </ErrorBoundary>
                        </ProtectedRoute>
                      } />
                      <Route path="/admin-users" element={
                        <ProtectedRoute>
                          <ErrorBoundary>
                            <AdminUsers />
                          </ErrorBoundary>
                        </ProtectedRoute>
                      } />
                      <Route path="/events/:id" element={
                        <ErrorBoundary>
                          <EventDetails />
                        </ErrorBoundary>
                      } />
                      <Route path="/events/:id/edit" element={
                        <ProtectedRoute>
                          <ErrorBoundary>
                            <CreateEvent />
                          </ErrorBoundary>
                        </ProtectedRoute>
                      } />
                      <Route path="/create-event" element={
                        <ProtectedRoute>
                          <ErrorBoundary>
                            <CreateEvent />
                          </ErrorBoundary>
                        </ProtectedRoute>
                      } />
                      <Route path="/calendar" element={<CalendarPage />} />
                      <Route path="/qr-scanner" element={
                        <ProtectedRoute>
                          <ErrorBoundary>
                            <QRScannerPage />
                          </ErrorBoundary>
                        </ProtectedRoute>
                      } />
                    </Routes>
=======
                    <AnimatedRoutes />
>>>>>>> 7c79b6e (Remove clg logo and images for GitHub push)
                  </main>
                  <OverlayFooter />
                </div>
              </Router>
            </ToastProvider>
          </EventProvider>
        </AuthProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;