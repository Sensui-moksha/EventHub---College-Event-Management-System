import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useEvents } from '../contexts/EventContext';
import { useToast } from '../components/ui/Toast';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Trophy,
  CheckCircle,
  X,
  ArrowLeft,
  Share2,
  QrCode,
  User,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { events, registrations, registerForEvent, unregisterFromEvent, deleteEvent, loading } = useEvents();
  const { addToast } = useToast();
  const [showQR, setShowQR] = useState(false);

  // Share event link handler
  const handleShare = async () => {
    const url = window.location.href;
    const event = events.find(e => e.id === id || (e as any)._id === id);
    if (!event) return;
    const shareData = {
      title: event.title,
      text: `Check out this event: ${event.title}`,
      url,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        addToast({ type: 'success', title: 'Shared!', message: 'Event shared successfully.' });
      } catch (err) {
        addToast({ type: 'error', title: 'Share Failed', message: 'Could not share the event.' });
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        addToast({ type: 'success', title: 'Link Copied', message: 'Event link copied to clipboard!' });
      } catch (err) {
        addToast({ type: 'error', title: 'Copy Failed', message: 'Could not copy the link.' });
      }
    } else {
      // fallback for very old browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        addToast({ type: 'success', title: 'Link Copied', message: 'Event link copied to clipboard!' });
      } catch (err) {
        addToast({ type: 'error', title: 'Copy Failed', message: 'Could not copy the link.' });
      }
      document.body.removeChild(textArea);
    }
  };
  // ...existing code...

  // Robust event lookup for both id and _id
  const event = events.find(e => e.id === id || (e as any)._id === id);
  const userId = user?._id || user?.id;
  const isRegistered = registrations.some(r => {
    const regUserId = (r.userId as any);
    return (
      (r.eventId === id || r.eventId === event?.id || (event && (r.eventId === (event as any)._id))) &&
      (regUserId === userId ||
        (typeof regUserId === 'object' && (regUserId._id === userId || regUserId.id === userId)))
    );
  });
  // Robustly find the user's registration for this event
  const userRegistration = registrations.find(r => {
    // Handle userId as string or object
    const regUserId = (r.userId as any);
    const matchesUser = regUserId === userId ||
      (typeof regUserId === 'object' && (regUserId._id === userId || regUserId.id === userId));
    // Handle eventId as string or object
    const regEventId = (r.eventId as any);
    const matchesEvent = regEventId === id || regEventId === event?.id || regEventId === (event as any)._id;
    return matchesUser && matchesEvent;
  });

  // Get all registrations for this event
  const eventRegistrations = registrations.filter(r => {
    const regEventId = (r.eventId as any);
    return regEventId === id || regEventId === event?.id || (event && regEventId === (event as any)._id);
  });

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-4">The event you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/events')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  // Fix registration deadline check
  const currentDate = new Date();
  const deadlineDate = new Date(event.registrationDeadline);
  console.log('Current date:', currentDate);
  console.log('Registration deadline:', deadlineDate);
  const isRegistrationOpen = currentDate <= deadlineDate && event.status === 'upcoming';
  const isFull = event.currentParticipants >= event.maxParticipants;

  const handleRegister = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    const success = await registerForEvent(event.id);
    if (success) {
      addToast({
        type: 'success',
        title: 'Registration Successful!',
        message: `You've been registered for ${event.title}`,
      });
    } else {
      addToast({
        type: 'error',
        title: 'Registration Failed',
        message: 'Please try again later.',
      });
    }
  };

  const handleUnregister = async () => {
    const success = await unregisterFromEvent(event.id);
    if (success) {
      addToast({
        type: 'success',
        title: 'Unregistered Successfully',
        message: `You've been unregistered from ${event.title}`,
      });
    } else {
      addToast({
        type: 'error',
        title: 'Unregistration Failed',
        message: 'Please try again later.',
      });
    }
  };

  const handleDeleteEvent = async () => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    try {
      const success = await deleteEvent(event.id);
      if (success) {
        addToast({
          type: 'success',
          title: 'Event Deleted',
          message: 'The event has been deleted successfully.',
        });
        navigate('/events');
      } else {
        addToast({
          type: 'error',
          title: 'Delete Failed',
          message: 'Could not delete the event. Please try again.',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: 'Could not delete the event. Please try again.',
      });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical':
        return 'bg-blue-100 text-blue-800';
      case 'cultural':
        return 'bg-purple-100 text-purple-800';
      case 'sports':
        return 'bg-green-100 text-green-800';
      case 'workshop':
        return 'bg-orange-100 text-orange-800';
      case 'seminar':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/events')}
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Events</span>
        </button>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Event Image */}
          {event.image && (
            <div className="relative h-64 md:h-80">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center space-x-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(event.category)}`}>
                    {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                  </span>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium">
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {event.title}
                </h1>
              </div>
            </div>
          )}

            <div className="p-8">
              {/* Always show event date, time, and registration deadline at the top */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                  <span>{format(new Date(event.date), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="w-5 h-5 mr-2 text-blue-500" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-5 h-5 mr-2 text-yellow-500" />
                  <span>Reg. Deadline: {event.registrationDeadline ? format(new Date(event.registrationDeadline), 'MMM dd, yyyy') : '-'}</span>
                </div>
              </div>
            {/* Event Info */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Details</h2>
                <div className="space-y-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-5 h-5 mr-3 text-blue-500" />
                    <span>{format(event.date, 'EEEE, MMMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-5 h-5 mr-3 text-blue-500" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-5 h-5 mr-3 text-blue-500" />
                    <span>{event.venue}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="w-5 h-5 mr-3 text-blue-500" />
                    <span>{event.currentParticipants} / {event.maxParticipants} participants</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <User className="w-5 h-5 mr-3 text-blue-500" />
                    <span>Organized by {event.organizer?.name ?? 'Unknown'}</span>
                  </div>
                </div>

                {/* Registration Deadline */}
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Registration Deadline:</strong> {format(deadlineDate, 'MMM dd, yyyy')}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    Registration is {isRegistrationOpen ? 'open' : 'closed'} • Current date: {format(currentDate, 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {event.description}
                </p>

                {/* Requirements */}
                {event.requirements && event.requirements.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
                    <ul className="space-y-2">
                      {event.requirements.map((req, index) => (
                        <li key={index} className="flex items-center text-gray-600">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Prizes */}
                {event.prizes && event.prizes.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Prizes</h3>
                    <div className="flex items-center text-gray-600">
                      <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                      <span>{event.prizes.join(', ')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Registration Progress */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Registration Progress</span>
                <span>{event.currentParticipants} / {event.maxParticipants}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((event.currentParticipants / event.maxParticipants) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {user ? (
                <>
                  {isRegistered ? (
                    <div className="flex flex-col sm:flex-row gap-4 flex-1">
                      <div className="flex items-center space-x-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg flex-1">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-green-800 font-medium">You're registered!</span>
                      </div>
                      <button
                        onClick={() => setShowQR(true)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
                      >
                        <QrCode className="w-5 h-5" />
                        <span>Show QR Code</span>
                      </button>
                      <button
                        onClick={handleUnregister}
                        disabled={loading}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                      >
                        {loading ? 'Processing...' : 'Unregister'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleRegister}
                      disabled={loading || !isRegistrationOpen || isFull}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Processing...' : 
                       currentDate > deadlineDate ? 'Registration Deadline Passed' :
                       event.status !== 'upcoming' ? 'Event Not Upcoming' :
                       isFull ? 'Event Full' : 'Register Now'}
                    </button>
                  )}
                  {(user.role === 'admin' || user.role === 'organizer') && (
                    <button
                      onClick={handleDeleteEvent}
                      disabled={loading}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                    >
                      {loading ? 'Deleting...' : 'Delete Event'}
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Login to Register
                </button>
              )}

              <button
                type="button"
                onClick={handleShare}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <Share2 className="w-5 h-5" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* QR Code Modal */}
        {showQR && userRegistration && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-8 max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Your QR Code</h3>
                <button
                  onClick={() => setShowQR(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="text-center">
                <div className="w-48 h-48 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  {userRegistration.qrCode ? (
                    <img 
                      src={userRegistration.qrCode} 
                      alt="QR Code" 
                      className="w-44 h-44 object-contain"
                    />
                  ) : userRegistration.qrPayload ? (
                    <QRCodeSVG
                      value={JSON.stringify(userRegistration.qrPayload)}
                      size={180}
                    />
                  ) : (
                    <div className="text-center text-gray-500">
                      <QrCode className="w-16 h-16 mx-auto mb-2" />
                      <p>QR Code not available</p>
                    </div>
                  )}
                </div>
                {userRegistration.qrCode && (
                  <p className="text-sm text-gray-600 mb-2">
                    QR Code Generated Successfully
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Show this QR code at the event entrance for quick check-in.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Registered Students Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Registered Students ({eventRegistrations.length})
          </h2>
          {eventRegistrations.length === 0 ? (
            <p className="text-gray-600">No students have registered for this event yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">Reg. ID</th>
                    <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">Branch</th>
                    <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">Section</th>
                    <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">Year</th>
                    <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">Registered At</th>
                  </tr>
                </thead>
                <tbody>
                  {eventRegistrations.map(reg => (
                    <tr key={reg.id} className="border-b">
                      <td className="px-4 py-2 text-sm text-gray-800">{reg.id}</td>
                      <td className="px-4 py-2 text-sm text-gray-800">{reg.user?.name ?? '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-800">{reg.user?.email ?? '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-800">{reg.user?.department ?? '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-800">{reg.user?.year ?? '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-800">{reg.user?.section ?? '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-800">{reg.registeredAt ? format(new Date(reg.registeredAt), 'MMM dd, yyyy') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetails;