import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEvents } from '../contexts/EventContext';
import { useToast } from '../components/ui/Toast';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Trophy,
  FileText,
  Image,
  ArrowLeft,
  Plus,
  X
} from 'lucide-react';

const CreateEvent: React.FC = () => {
  const { user } = useAuth();
  const { events, createEvent, updateEvent, loading } = useEvents();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  // Check if we're in edit mode (either from URL params or location state)
  const isEditMode = !!id || !!location.state?.event;
  const editingEvent = location.state?.event || (id ? events.find(e => e.id === id || (e as any)._id === id) : null);

  // If we're in edit mode via URL but haven't found the event yet, show loading
  if (id && !editingEvent && events.length === 0 && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  // If we're in edit mode but the event doesn't exist
  if (id && !editingEvent && events.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-4">The event you're trying to edit doesn't exist or may have been deleted.</p>
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

  const [showCalendar, setShowCalendar] = useState(false);

  // State for form data
  const [formData, setFormData] = useState({
    title: editingEvent?.title || '',
    description: editingEvent?.description || '',
    category: editingEvent?.category || 'technical',
    date: editingEvent?.date ? new Date(editingEvent.date).toISOString().slice(0, 10) : '',
    time: editingEvent?.time || '',
    venue: editingEvent?.venue || '',
    maxParticipants: editingEvent?.maxParticipants || 50,
    image: editingEvent?.image || '',
    requirements: editingEvent?.requirements || [''],
    prizes: editingEvent?.prizes || [''],
    registrationDeadline: editingEvent?.registrationDeadline ? new Date(editingEvent.registrationDeadline).toISOString().slice(0, 10) : '',
    status: editingEvent?.status || 'upcoming',
  });

  // Helper function to get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  // Helper function to format date for display
  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const today = new Date();
    const currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const firstDayOfWeek = currentDate.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(today.getFullYear(), today.getMonth(), day));
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const [imagePreview, setImagePreview] = useState<string>('');

  // Load event data if editing via URL parameter
  useEffect(() => {
    if (id && !editingEvent && events.length > 0) {
      const event = events.find(e => e.id === id || (e as any)._id === id);
      if (event) {
        setFormData({
          title: event.title,
          description: event.description,
          category: event.category,
          date: new Date(event.date).toISOString().slice(0, 10),
          time: event.time,
          venue: event.venue,
          maxParticipants: event.maxParticipants,
          image: event.image,
          requirements: event.requirements || [''],
          prizes: event.prizes || [''],
          registrationDeadline: new Date(event.registrationDeadline).toISOString().slice(0, 10),
          status: event.status,
        });
        if (event.image) {
          setImagePreview(event.image);
        }
      }
    }
  }, [id, editingEvent, events]);

  const categories = [
    { value: 'technical', label: 'Technical' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'sports', label: 'Sports' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'seminar', label: 'Seminar' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (new Date(formData.date) <= new Date()) {
      addToast({
        type: 'error',
        title: 'Invalid Date',
        message: 'Event date must be in the future.',
      });
      return;
    }
    if (new Date(formData.registrationDeadline) >= new Date(formData.date)) {
      addToast({
        type: 'error',
        title: 'Invalid Registration Deadline',
        message: 'Registration deadline must be before the event date.',
      });
      return;
    }

    const eventData = {
      ...formData,
      date: new Date(formData.date),
      registrationDeadline: new Date(formData.registrationDeadline),
      organizerId: user.id ?? user._id ?? '', // Ensure organizerId is always a string
      requirements: formData.requirements.filter((req: string) => req.trim() !== ''),
      prizes: formData.prizes.filter((prize: string) => prize.trim() !== ''),
    };
    console.log('CreateEvent user:', user);
    console.log('CreateEvent eventData:', JSON.stringify(eventData, null, 2));
    // Debug log
  console.log('CreateEvent user:', user);
  console.log('CreateEvent eventData:', JSON.stringify(eventData, null, 2));

    let success = false;
    let errorMsg = '';
    
    if (isEditMode) {
      // Editing existing event
      const eventId = editingEvent?.id || editingEvent?._id || id;
      if (eventId) {
        success = await updateEvent(eventId, eventData);
      }
    } else {
      // Creating new event
      try {
        success = await createEvent(eventData);
      } catch (err: any) {
        errorMsg = err?.message || '';
        // Log backend error to console for debugging
        console.error('Backend event creation error:', err);
      }
    }

    if (success) {
      addToast({
        type: 'success',
        title: isEditMode ? 'Event Updated!' : 'Event Created!',
        message: isEditMode ? 'Your event has been updated successfully.' : 'Your event has been created successfully.',
      });
      navigate(isEditMode ? `/events/${id || editingEvent?.id || editingEvent?._id}` : '/dashboard');
    } else {
      addToast({
        type: 'error',
        title: isEditMode ? 'Update Failed' : 'Creation Failed',
        message: errorMsg ? errorMsg : 'Please try again later.',
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'maxParticipants' ? parseInt(value) || 0 : value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, image: url }));
    if (!url) {
      setImagePreview('');
      return;
    }
    // Try to load image (accept any address)
    const img = new window.Image();
    img.onload = () => setImagePreview(url);
    img.onerror = () => {
      addToast({
        type: 'error',
        title: 'Image Not Reachable',
        message: 'Could not load image from the provided address.',
      });
      setImagePreview('');
    };
    img.src = url;
  };

  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, ''],
    }));
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
  requirements: prev.requirements.filter((_: string, i: number) => i !== index),
    }));
  };

  const updateRequirement = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
  requirements: prev.requirements.map((req: string, i: number) => i === index ? value : req),
    }));
  };

  const addPrize = () => {
    setFormData(prev => ({
      ...prev,
      prizes: [...prev.prizes, ''],
    }));
  };

  const removePrize = (index: number) => {
    setFormData(prev => ({
      ...prev,
  prizes: prev.prizes.filter((_: string, i: number) => i !== index),
    }));
  };

  const updatePrize = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
  prizes: prev.prizes.map((prize: string, i: number) => i === index ? value : prize),
    }));
  };

  // Check user permissions
  if (!user || (user.role !== 'admin' && user.role !== 'organizer')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Only admins and organizers can create or edit events.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Additional check for editing: ensure user can edit this event
  if (isEditMode && editingEvent && user.role !== 'admin') {
    const eventOrgId = editingEvent.organizerId || editingEvent.organizer?.id || editingEvent.organizer?._id;
    const userId = user.id || user._id;
    
    if (eventOrgId !== userId) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You can only edit events that you created.</p>
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
  }

  return (
    <div className="min-h-screen pt-24 pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditMode ? 'Edit Event' : 'Create New Event'}
          </h1>
          <p className="text-gray-600">
            {editingEvent ? 'Update the details below to edit your event.' : 'Fill in the details below to create an amazing event for your college community.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title *
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter event title"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="date"
                      name="date"
                      type="date"
                      required
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                    Time *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="time"
                      name="time"
                      type="time"
                      required
                      value={formData.time}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Event Calendar View */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Event Calendar - {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
                  </button>
                </div>

                {showCalendar && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    {/* Calendar Header */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((day, index) => {
                        if (!day) {
                          return <div key={index} className="h-10"></div>;
                        }
                        
                        const dayEvents = getEventsForDate(day);
                        const isToday = day.toDateString() === new Date().toDateString();
                        const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
                        const hasEvents = dayEvents.length > 0;
                        
                        return (
                          <div
                            key={index}
                            className={`h-10 flex items-center justify-center text-sm relative rounded-md
                              ${isToday ? 'bg-blue-100 text-blue-800 font-semibold' : ''}
                              ${isPast ? 'text-gray-400' : 'text-gray-700'}
                              ${hasEvents ? 'bg-red-50 border border-red-200' : 'hover:bg-gray-50'}
                            `}
                            title={hasEvents ? `${dayEvents.length} event(s): ${dayEvents.map(e => e.title).join(', ')}` : ''}
                          >
                            {day.getDate()}
                            {hasEvents && (
                              <div className="absolute bottom-0 right-0 w-2 h-2 bg-red-500 rounded-full -mb-1 -mr-1"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Legend */}
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
                        <span>Today</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-50 border border-red-200 rounded relative">
                          <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-red-500 rounded-full -mb-0.5 -mr-0.5"></div>
                        </div>
                        <span>Has Events</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Current Month Event List */}
                <div className="mt-4">
                  <h4 className="text-md font-medium text-gray-800 mb-2">Upcoming Events This Month</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {events
                      .filter(event => {
                        const eventDate = new Date(event.date);
                        const currentMonth = new Date().getMonth();
                        const currentYear = new Date().getFullYear();
                        return eventDate.getMonth() === currentMonth && 
                               eventDate.getFullYear() === currentYear &&
                               eventDate >= new Date();
                      })
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .slice(0, 5)
                      .map(event => (
                        <div key={event.id || (event as any)._id} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded">
                          <div>
                            <p className="font-medium text-sm text-gray-900">{event.title}</p>
                            <p className="text-xs text-gray-500">
                              {formatDateForDisplay(new Date(event.date))} at {event.time}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            event.category === 'technical' ? 'bg-blue-100 text-blue-800' :
                            event.category === 'cultural' ? 'bg-purple-100 text-purple-800' :
                            event.category === 'sports' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {event.category}
                          </span>
                        </div>
                      ))}
                    {events.filter(event => {
                      const eventDate = new Date(event.date);
                      const currentMonth = new Date().getMonth();
                      const currentYear = new Date().getFullYear();
                      return eventDate.getMonth() === currentMonth && 
                             eventDate.getFullYear() === currentYear &&
                             eventDate >= new Date();
                    }).length === 0 && (
                      <p className="text-sm text-gray-500 italic">No upcoming events this month</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Venue */}
              <div>
                <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-2">
                  Venue *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="venue"
                    name="venue"
                    type="text"
                    required
                    value={formData.venue}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter venue location"
                  />
                </div>
              </div>

              {/* Max Participants */}
              <div>
                <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Participants *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="maxParticipants"
                    name="maxParticipants"
                    type="number"
                    required
                    min="1"
                    value={formData.maxParticipants}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter maximum participants"
                  />
                </div>
              </div>

              {/* Registration Deadline */}
              <div>
                <label htmlFor="registrationDeadline" className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Deadline *
                </label>
                <input
                  id="registrationDeadline"
                  name="registrationDeadline"
                  type="date"
                  required
                  value={formData.registrationDeadline}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                  <textarea
                    id="description"
                    name="description"
                    required
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Describe your event..."
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                  Event Image URL
                </label>
                <div className="relative">
                  <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="image"
                    name="image"
                    type="url"
                    value={formData.image}
                    onChange={handleImageChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                {imagePreview && (
                  <div className="mt-2">
                    <img src={imagePreview} alt="Event Preview" className="w-full h-48 object-cover rounded-lg border" />
                  </div>
                )}
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requirements
                </label>
                <div className="space-y-2">
                  {formData.requirements.map((requirement: string, index: number) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="text"
                        value={requirement}
                        onChange={(e) => updateRequirement(index, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter requirement"
                      />
                      {formData.requirements.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRequirement(index)}
                          className="p-2 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addRequirement}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Requirement</span>
                  </button>
                </div>
              </div>

              {/* Prizes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prizes
                </label>
                <div className="space-y-2">
                  {formData.prizes.map((prize: string, index: number) => (
                    <div key={index} className="flex space-x-2">
                      <div className="relative flex-1">
                        <Trophy className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          value={prize}
                          onChange={(e) => updatePrize(index, e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder={`${index + 1}${index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'} Prize`}
                        />
                      </div>
                      {formData.prizes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePrize(index)}
                          className="p-2 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addPrize}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Prize</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? (isEditMode ? 'Updating Event...' : 'Creating Event...') : (isEditMode ? 'Update Event' : 'Create Event')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;