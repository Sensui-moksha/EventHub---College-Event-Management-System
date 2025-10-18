import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEvents } from '../contexts/EventContext';
import { useNotifications } from '../contexts/NotificationContext';
import { format } from 'date-fns';
import {
  Calendar,
  Users,
  Trophy,
  Bell,
  QrCode,
  Edit,
  Trash2,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { events, registrations, results, deleteEvent, updateEvent } = useEvents();
  const { notifications, markAsRead } = useNotifications();
  const [activeTab, setActiveTab] = useState('overview');
  // Multi-select for My Events
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  // QR Code state
  const [showQRCode, setShowQRCode] = useState<string | null>(null);

  if (!user) return null;

  // Helper function to create QR-friendly data with user information
  const getQRValue = (registration: any) => {
    // Create a structured QR code with user information - event name and reg ID first
    const qrData = {
      regId: registration.registrationId || registration.id || 'N/A',
      eventName: registration.event?.title || registration.eventName || 'Unknown Event',
      userName: user.name || 'Unknown User',
      section: user.section || 'N/A',
      dept: user.department || user.branch || 'N/A',
      regDate: new Date(registration.registeredAt).toLocaleDateString()
    };
    
    // Try JSON format first (more structured)
    try {
      const jsonString = JSON.stringify(qrData);
      if (jsonString.length <= 300) {
        return jsonString;
      }
    } catch (e) {
      // Fall back to pipe format if JSON fails
    }
    
    // Fallback to compact pipe-delimited format with event name and reg ID first
    const qrString = `Reg. ID:${qrData.regId}|EVENT:${qrData.eventName.substring(0, 25)}|NAME:${qrData.userName}|SEC:${qrData.section}|DEPT:${qrData.dept}|DATE:${qrData.regDate}`;
    
    return qrString;
  };

  // Admins see all events, organizers see their own
  const userEvents = user.role === 'admin' ? events : events.filter(e => e.organizerId === user.id);
  const userRegistrations = registrations.filter(r => r.userId === user.id);
  const userResults = results.filter(r => r.participantId === user.id);
  const unreadNotifications = notifications.filter(n => !n.read);

  const stats = user.role === 'organizer' || user.role === 'admin' ? [
    {
      icon: Calendar,
      label: 'Events Created',
      value: userEvents.length,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: Users,
      label: 'Total Participants',
      value: userEvents.reduce((sum, event) => sum + event.currentParticipants, 0),
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: Trophy,
      label: 'Completed Events',
      value: userEvents.filter(e => e.status === 'completed').length,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      icon: Bell,
      label: 'Notifications',
      value: unreadNotifications.length,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ] : [
    {
      icon: Calendar,
      label: 'Registered Events',
      value: userRegistrations.length,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: CheckCircle,
      label: 'Attended Events',
      value: userRegistrations.filter(r => r.status === 'attended').length,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: Trophy,
      label: 'Awards Won',
      value: userResults.length,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      icon: Bell,
      label: 'Notifications',
      value: unreadNotifications.length,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  const tabs = user.role === 'organizer' || user.role === 'admin' ? [
    { id: 'overview', label: 'Overview' },
    { id: 'events', label: 'My Events' },
    { id: 'notifications', label: 'Notifications' },
  ] : [
    { id: 'overview', label: 'Overview' },
    { id: 'registrations', label: 'My Registrations' },
    { id: 'results', label: 'My Results' },
    { id: 'notifications', label: 'Notifications' },
  ];

  return (
    <div className="min-h-screen pt-16 sm:pt-20 lg:pt-24 pb-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name}!
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {user.role === 'organizer' ? 'Manage your events and track participation.' :
             user.role === 'admin' ? 'Monitor all events and system activity.' :
             'Track your registrations and discover new events.'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center">
                <div className={`p-2 sm:p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-gray-600">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto px-4 sm:px-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 sm:py-4 px-2 sm:px-4 lg:px-6 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.id === 'notifications' && unreadNotifications.length > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {unreadNotifications.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Quick Actions */}
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <Link
                        to="/events"
                        className="flex items-center space-x-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">Browse Events</span>
                      </Link>
                      {(user.role === 'organizer' || user.role === 'admin') && (
                        <Link
                          to="/create-event"
                          className="flex items-center space-x-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="w-5 h-5 text-green-600" />
                          <span className="font-medium">Create Event</span>
                        </Link>
                      )}
                      <Link
                        to="/profile"
                        className="flex items-center space-x-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Edit className="w-5 h-5 text-purple-600" />
                        <span className="font-medium">Edit Profile</span>
                      </Link>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6 border border-green-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      {userRegistrations.slice(0, 3).map(registration => (
                        <div key={registration.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {registration.event?.title || 'Event Title Unavailable'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Registered {format(registration.registeredAt, 'MMM dd')}
                            </p>
                          </div>
                        </div>
                      ))}
                      {userRegistrations.length === 0 && (
                        <p className="text-gray-500 text-sm">No recent activity</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Events Tab (for organizers) */}
            {activeTab === 'events' && (user.role === 'organizer' || user.role === 'admin') && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">My Events</h3>
                  <div className="flex gap-2 items-center">
                    <button
                      className={`px-4 py-2 rounded-lg font-medium transition-colors shadow-sm border border-gray-200 bg-white hover:bg-gray-100 ${userEvents.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => {
                        if (selectedEvents.length === userEvents.length) {
                          setSelectedEvents([]);
                        } else {
                          setSelectedEvents(userEvents.map(event => event.id));
                        }
                      }}
                      disabled={userEvents.length === 0}
                    >
                      <span className="inline-flex items-center gap-1">
                        <input type="checkbox" checked={selectedEvents.length === userEvents.length && userEvents.length > 0} readOnly className="w-4 h-4" />
                        {selectedEvents.length === userEvents.length && userEvents.length > 0 ? 'Deselect All' : 'Select All'}
                      </span>
                    </button>
                    <button
                      className={`px-4 py-2 rounded-lg font-medium transition-colors shadow-sm border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed`}
                      onClick={async () => {
                        if (selectedEvents.length === 0) return;
                        if (!window.confirm('Delete selected events?')) return;
                        setBulkDeleteLoading(true);
                        for (const id of selectedEvents) {
                          await deleteEvent(id);
                        }
                        setSelectedEvents([]);
                        setBulkDeleteLoading(false);
                      }}
                      disabled={selectedEvents.length === 0 || bulkDeleteLoading}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Trash2 className="w-4 h-4" /> Delete Selected
                      </span>
                    </button>
                    {selectedEvents.length > 0 && (
                      <span className="text-sm text-gray-600">{selectedEvents.length} selected</span>
                    )}
                    <Link
                      to="/create-event"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm border border-blue-200 bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Event</span>
                    </Link>
                  </div>
                </div>
                {userEvents.length > 0 ? (
                  <div className="space-y-8">
                    {userEvents.map(event => {
                      // Get registrations for this event
                      const eventRegistrations = registrations.filter(r => r.eventId === event.id);
                      return (
                        <div key={event.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow relative">
                          {/* Multi-select checkbox */}
                          <input
                            type="checkbox"
                            className="absolute top-4 left-4 w-5 h-5 z-10"
                            checked={selectedEvents.includes(event.id)}
                            onChange={() => {
                              setSelectedEvents(prev =>
                                prev.includes(event.id)
                                  ? prev.filter(eid => eid !== event.id)
                                  : [...prev, event.id]
                              );
                            }}
                            title="Select event"
                          />
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">{event.title}</h4>
                              <p className="text-gray-600 text-sm">{event.description}</p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Edit Event"
                                onClick={() => navigate('/create-event', { state: { event } })}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {(user.role === 'admin' || user.role === 'organizer') && (
                                <button
                                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Delete Event"
                                  onClick={async () => {
                                    if (window.confirm('Are you sure you want to delete this event?')) {
                                      await deleteEvent(event.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                              {user.role === 'admin' && (
                                <button
                                  className="p-2 text-gray-400 hover:text-yellow-600 transition-colors"
                                  title={event.status === 'upcoming' ? 'Close Registration' : 'Open Registration'}
                                  onClick={async () => {
                                    const newStatus = event.status === 'upcoming' ? 'cancelled' : 'upcoming';
                                    await updateEvent(event.id, { status: newStatus });
                                  }}
                                >
                                  {event.status === 'upcoming' ? (
                                    <X className="w-4 h-4" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                            <div className="flex items-center text-gray-600">
                              <Calendar className="w-4 h-4 mr-2" />
                              <span>{format(event.date, 'MMM dd')}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Clock className="w-4 h-4 mr-2" />
                              <span>{event.time}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Users className="w-4 h-4 mr-2" />
                              <span>{event.currentParticipants}/{event.maxParticipants}</span>
                            </div>
                            <div className="flex items-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                event.status === 'upcoming' ? 'bg-green-100 text-green-800' :
                                event.status === 'ongoing' ? 'bg-yellow-100 text-yellow-800' :
                                event.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {event.status}
                              </span>
                            </div>
                          </div>

                          {/* Registered Students Table */}
                          <div className="mt-4">
                            <h5 className="text-md font-semibold text-gray-900 mb-2">Registered Students ({eventRegistrations.length})</h5>
                            {eventRegistrations.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="min-w-full text-sm border border-gray-200 rounded-lg">
                                  <thead>
                                    <tr className="bg-gray-100">
                                      <th className="px-4 py-2 text-left">Name</th>
                                      <th className="px-4 py-2 text-left">Branch</th>
                                      <th className="px-4 py-2 text-left">Department</th>
                                      <th className="px-4 py-2 text-left">Mobile</th>
                                      <th className="px-4 py-2 text-left">Email</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {eventRegistrations.map(reg => (
                                      <tr key={reg.id} className="border-t">
                                        <td className="px-4 py-2">{reg.user.name}</td>
                                        <td className="px-4 py-2">{reg.user.section || '-'}</td>
                                        <td className="px-4 py-2">{reg.user.department || '-'}</td>
                                        <td className="px-4 py-2">{reg.user.mobile || '-'}</td>
                                        <td className="px-4 py-2">{reg.user.email}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-gray-500">No students registered yet.</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Events Created</h3>
                    <p className="text-gray-500 mb-4">Start by creating your first event.</p>
                    <Link
                      to="/create-event"
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Event</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Registrations Tab (for students) */}
            {activeTab === 'registrations' && user.role === 'student' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">My Registrations</h3>
                
                {userRegistrations.length > 0 ? (
                  <div className="space-y-4">
                    {userRegistrations.map(registration => {
                      // Safely get event ID, handling different ID formats
                      const eventId = registration.event?.id || registration.event?._id || registration.eventId;
                      
                      return (
                        <div key={registration.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">
                                {registration.event?.title || 'Event Title Unavailable'}
                              </h4>
                              <p className="text-gray-600 text-sm">
                                {registration.event?.description || 'Description not available'}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => setShowQRCode(showQRCode === registration.id ? null : registration.id)}
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                title={showQRCode === registration.id ? "Hide QR Code" : "Show QR Code"}
                              >
                                <QrCode className="w-4 h-4" />
                              </button>
                              {eventId && (
                                <Link
                                  to={`/events/${eventId}`}
                                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                  title="View Event Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </Link>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center text-gray-600">
                              <Calendar className="w-4 h-4 mr-2" />
                              <span>
                                {registration.event?.date ? format(registration.event.date, 'MMM dd') : 'Date TBD'}
                              </span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Clock className="w-4 h-4 mr-2" />
                              <span>{registration.event?.time || 'Time TBD'}</span>
                            </div>
                            <div className="flex items-center text-gray-600 min-w-0">
                              <span className="whitespace-nowrap mr-2">QR:</span>
                              <span className="text-xs font-mono truncate" title={registration.qrCode || 'N/A'}>
                                {registration.qrCode || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                registration.status === 'registered' ? 'bg-blue-100 text-blue-800' :
                                registration.status === 'attended' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {registration.status}
                              </span>
                            </div>
                          </div>
                          
                          {/* QR Code Display */}
                          {showQRCode === registration.id && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border-t">
                              <div className="flex justify-between items-start mb-3">
                                <h5 className="font-semibold text-gray-900">Registration QR Code</h5>
                                <button
                                  onClick={() => setShowQRCode(null)}
                                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                  title="Close QR Code"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              
                              {registration.qrCode || registration.registrationId || registration.id ? (
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                  <div className="flex-shrink-0">
                                    {(() => {
                                      try {
                                        const qrValue = getQRValue(registration);
                                        
                                        return (
                                          <QRCodeSVG 
                                            value={qrValue}
                                            size={140}
                                            level="M"
                                            includeMargin={true}
                                            className="border rounded bg-white"
                                          />
                                        );
                                      } catch (error) {
                                        console.error('QR Code generation error:', error);
                                        return (
                                          <div className="w-[140px] h-[140px] border rounded bg-white flex items-center justify-center">
                                            <div className="text-center p-2">
                                              <QrCode className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                              <p className="text-xs text-gray-500">QR Error</p>
                                            </div>
                                          </div>
                                        );
                                      }
                                    })()}
                                  </div>
                                  <div className="flex-1 text-center sm:text-left">
                                    <p className="text-sm text-gray-600 mb-3">
                                      Show this QR code at the event for quick check-in
                                    </p>
                                    <div className="bg-white p-3 rounded border">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                        <div>
                                          <p className="text-xs text-gray-500 mb-1">Name:</p>
                                          <p className="font-medium text-gray-800">{user.name}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500 mb-1">Registration ID:</p>
                                          <p className="font-mono text-gray-800">{registration.registrationId || registration.id}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500 mb-1">Section:</p>
                                          <p className="font-medium text-gray-800">{user.section || 'N/A'}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500 mb-1">Department:</p>
                                          <p className="font-medium text-gray-800">{user.department || user.branch || 'N/A'}</p>
                                        </div>
                                      </div>
                                      
                                      <div className="mt-3 pt-3 border-t">
                                        <p className="text-xs text-gray-500 mb-2">QR Code Contains:</p>
                                        <div className="bg-gray-50 p-2 rounded text-xs leading-relaxed text-gray-700">
                                          {(() => {
                                            const qrValue = getQRValue(registration);
                                            try {
                                              // Try to parse as JSON first
                                              const parsed = JSON.parse(qrValue);
                                              return Object.entries(parsed).map(([key, value], index) => {
                                                // Format display names for better readability with event name and reg ID prominent
                                                const displayKey = key === 'regId' ? 'Reg. ID' : 
                                                                 key === 'eventName' ? 'EVENT NAME' :
                                                                 key === 'userName' ? 'STUDENT NAME' :
                                                                 key === 'regDate' ? 'REG DATE' :
                                                                 key.toUpperCase();
                                                return (
                                                  <div key={index} className="mb-1">
                                                    <span className="font-medium text-blue-600">{displayKey}:</span>{' '}
                                                    <span className="font-medium">{value as string}</span>
                                                  </div>
                                                );
                                              });
                                            } catch (e) {
                                              // Fall back to pipe-delimited parsing
                                              return qrValue.split('|').map((item, index) => (
                                                <div key={index} className="mb-1">
                                                  <span className="font-medium text-blue-600">{item.split(':')[0]}:</span>{' '}
                                                  <span className="font-medium">{item.split(':').slice(1).join(':')}</span>
                                                </div>
                                              ));
                                            }
                                          })()}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-6">
                                  <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                  <p className="text-gray-600 font-medium">No QR Code Available</p>
                                  <p className="text-sm text-gray-500">QR code data is not available for this registration</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Registrations</h3>
                    <p className="text-gray-500 mb-4">You haven't registered for any events yet.</p>
                    <Link
                      to="/events"
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Browse Events</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Results Tab (for students) */}
            {activeTab === 'results' && user.role === 'student' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">My Results</h3>
                
                {userResults.length > 0 ? (
                  <div className="space-y-4">
                    {userResults.map(result => (
                      <div key={result.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              Position #{result.position}
                            </h4>
                            <p className="text-gray-600">{result.prize}</p>
                          </div>
                          <Trophy className="w-8 h-8 text-yellow-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Results Yet</h3>
                    <p className="text-gray-500">Participate in events to see your results here.</p>
                  </div>
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Notifications</h3>
                
                {notifications.length > 0 ? (
                  <div className="space-y-4">
                    {notifications.map(notification => (
                      <div
                        key={notification.id}
                        className={`border rounded-lg p-4 transition-all ${
                          notification.read 
                            ? 'border-gray-200 bg-white' 
                            : 'border-blue-200 bg-blue-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {notification.title}
                            </h4>
                            <p className="text-gray-600 text-sm mb-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(notification.createdAt, 'MMM dd, yyyy HH:mm')}
                            </p>
                          </div>
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Notifications</h3>
                    <p className="text-gray-500">You're all caught up!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;