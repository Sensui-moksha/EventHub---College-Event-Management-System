import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Event, Registration, EventResult, MultiEventRegistration, QRValidationResult } from '../types';
import { useAuth } from './AuthContext';

interface EventContextType {
  events: Event[];
  registrations: Registration[];
  results: EventResult[];
  registerForEvent: (eventId: string) => Promise<boolean>;
  registerForMultipleEvents: (eventIds: string[]) => Promise<MultiEventRegistration>;
  unregisterFromEvent: (eventId: string) => Promise<boolean>;
  removeParticipant: (eventId: string, userId: string) => Promise<boolean>;
  validateQRCode: (qrData: string, eventId?: string, scannedBy?: string, location?: string) => Promise<QRValidationResult>;
  createEvent: (eventData: Omit<Event, 'id' | 'createdAt' | 'currentParticipants' | 'organizer'>) => Promise<boolean>;
  updateEvent: (eventId: string, eventData: Partial<Event>) => Promise<boolean>;
  deleteEvent: (eventId: string) => Promise<boolean>;
  addResult: (eventId: string, results: Omit<EventResult, 'id' | 'eventId' | 'createdAt'>[]) => Promise<boolean>;
  loading: boolean;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const useEvents = () => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};

interface EventProviderProps {
  children: ReactNode;
}

export const EventProvider: React.FC<EventProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [results, setResults] = useState<EventResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Safe response parser to avoid "Unexpected end of JSON input" when
  // the server returns empty responses (e.g. 403 with no body).
  const parseResponse = async (res: Response) => {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (err) {
      return { _rawText: text };
    }
  };

  // Fetch events from backend
  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await parseResponse(res);
      let eventList = [];
      if (res.ok && Array.isArray(data)) {
        eventList = data;
      } else if (res.ok && Array.isArray(data.events)) {
        eventList = data.events;
      }
      if (eventList.length > 0) {
        // Process event dates to ensure they're proper Date objects
        const processedEvents = eventList.map((event: any) => ({
          ...event,
          id: event._id || event.id, // Use _id from MongoDB, fallback to id
          date: new Date(event.date),
          registrationDeadline: new Date(event.registrationDeadline),
          createdAt: new Date(event.createdAt)
        }));
        console.log('Processed events with dates:', processedEvents);
        setEvents(processedEvents);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setEvents([]);
    }
  };

  // Fetch registrations
  const fetchRegistrations = async () => {
    try {
      const res = await fetch('/api/registrations');
      const data = await parseResponse(res);
      if (!res.ok) {
        console.error('Failed to fetch registrations: HTTP', res.status, data);
        return;
      }
      if (data && Array.isArray(data.registrations)) {
        setRegistrations(data.registrations);
      } else {
        console.warn('Registrations response shape unexpected:', data);
      }
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
    }
  };

  useEffect(() => {
    // Initial data fetch
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([fetchEvents(), fetchRegistrations()]);
      setLoading(false);
    };

    loadInitialData();

    // Set up auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchEvents();
      fetchRegistrations();
    }, 30000);

    // Set up visibility change listener to refresh when tab becomes active
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchEvents();
        fetchRegistrations();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set up force refresh listener for manual triggers
    const handleForceRefresh = () => {
      fetchEvents();
      fetchRegistrations();
    };

    window.addEventListener('forceRefresh', handleForceRefresh);

    // Cleanup
    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('forceRefresh', handleForceRefresh);
    };
  }, []);

  // Auto-refresh data after any mutation
  const refreshData = async () => {
    await Promise.all([fetchEvents(), fetchRegistrations()]);
  };

  const registerForEvent = async (eventId: string): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);
    try {
      const event = events.find(e => e.id === eventId);
      if (!event) {
        console.error('Event not found:', eventId);
        return false;
      }

      // Use the original _id for the backend API call
      const backendEventId = (event as any)._id || event.id;
      console.log('Registering for event:', { eventId, backendEventId, event });

      const res = await fetch(`/api/events/${backendEventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id })
      });
      const data = await parseResponse(res);
      if (!res.ok) {
        console.error('Register API error:', res.status, data);
        return false;
      }
      if (data && data.registration) {
        // Auto-refresh all data after successful registration
        await refreshData();
        return true;
      }
      console.warn('Register response unexpected:', data);
      return false;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const registerForMultipleEvents = async (eventIds: string[]): Promise<MultiEventRegistration> => {
    if (!user) {
      return {
        eventIds,
        userId: '',
        registrations: [],
        totalEvents: eventIds.length,
        successfulRegistrations: 0,
        failedRegistrations: eventIds.map(id => ({ eventId: id, reason: 'User not authenticated' }))
      };
    }

    setLoading(true);
    try {
      // Convert frontend event IDs to backend IDs
      const backendEventIds = eventIds.map(eventId => {
        const event = events.find(e => e.id === eventId || (e as any)._id === eventId);
        return (event && (event as any)._id) ? (event as any)._id : eventId;
      });

      const res = await fetch('/api/events/register-multiple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user._id,
          eventIds: backendEventIds
        })
      });

      const data = await parseResponse(res);

      if (!res.ok) {
        console.error('Register-multiple API error:', res.status, data);
        return {
          eventIds,
          userId: user._id || '',
          registrations: [],
          totalEvents: eventIds.length,
          successfulRegistrations: 0,
          failedRegistrations: eventIds.map(id => ({ eventId: id, reason: data?.error || 'Registration failed' }))
        };
      }

      await fetchRegistrations(); // Refresh registrations
      return {
        eventIds,
        userId: user._id || '',
        registrations: data?.registrations || [],
        totalEvents: data?.totalEvents || eventIds.length,
        successfulRegistrations: data?.successfulRegistrations || 0,
        failedRegistrations: data?.failedRegistrations || []
      };
    } catch (error) {
      console.error('Multi-event registration failed:', error);
      return {
        eventIds,
        userId: user._id || '',
        registrations: [],
        totalEvents: eventIds.length,
        successfulRegistrations: 0,
        failedRegistrations: eventIds.map(id => ({ eventId: id, reason: 'Network error' }))
      };
    } finally {
      setLoading(false);
    }
  };

  const validateQRCode = async (
    qrData: string, 
    eventId?: string, 
    scannedBy?: string, 
    location?: string
  ): Promise<QRValidationResult> => {
    try {
      const res = await fetch('/api/qr/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          qrData, 
          eventId, 
          scannedBy, 
          location 
        })
      });

      const data = await parseResponse(res);

      if (!res.ok) {
        console.error('QR validate API error:', res.status, data);
        return { valid: false, reason: data?.reason || 'QR validation failed' };
      }

      if (data.valid) {
        await fetchRegistrations(); // Refresh registrations if scan was valid
      }
      return data;
    } catch (error) {
      console.error('QR validation error:', error);
      return {
        valid: false,
        reason: 'Network error during QR validation'
      };
    }
  };

  const unregisterFromEvent = async (eventId: string): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);
    try {
      const event = events.find(e => e.id === eventId);
      if (!event) {
        console.error('Event not found:', eventId);
        return false;
      }

      // Use the original _id for the backend API call
      const backendEventId = (event as any)._id || event.id;

      const res = await fetch(`/api/events/${backendEventId}/unregister`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id })
      });
      const data = await parseResponse(res);
      if (!res.ok) {
        console.error('Unregister API error:', res.status, data);
        return false;
      }
      if (data.success) {
        // Auto-refresh all data after successful unregistration
        await refreshData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Unregistration failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeParticipant = async (eventId: string, userId: string): Promise<boolean> => {
    if (!user) return false;
    
    // Check if user has permission (admin or organizer)
    if (user.role !== 'admin' && user.role !== 'organizer') {
      console.error('Unauthorized: Only admins and organizers can remove participants');
      return false;
    }

    setLoading(true);
    try {
      const event = events.find(e => e.id === eventId);
      if (!event) {
        console.error('Event not found:', eventId);
        return false;
      }

      // Use the original _id for the backend API call
      const backendEventId = (event as any)._id || event.id;

      const res = await fetch(`/api/events/${backendEventId}/remove-participant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: userId,
          removedBy: user._id 
        })
      });
      const data = await parseResponse(res);
      if (!res.ok) {
        console.error('Remove participant API error:', res.status, data);
        return false;
      }
      if (data.success) {
        // Auto-refresh all data after successful participant removal
        await refreshData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Remove participant failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'currentParticipants' | 'organizer'>): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...eventData, organizerId: user._id })
      });
      const data = await parseResponse(res);
      if (!res.ok) {
        console.error('Create event API error:', res.status, data);
        if (data?.error) throw new Error(data.error);
        throw new Error('Event creation failed');
      }
      if (data.event) {
        // Auto-refresh all data after successful event creation
        await refreshData();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Event creation failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (eventId: string, eventData: Partial<Event>): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
      const data = await parseResponse(res);
      if (!res.ok) {
        console.error('Update event API error:', res.status, data);
        if (data?.error) throw new Error(data.error);
        throw new Error('Event update failed');
      }
      if (data.event) {
        const updatedEvent = { ...data.event, id: data.event._id };
        setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Event update failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId: string): Promise<boolean> => {
    setLoading(true);
    try {
      // Always use _id for backend
      const event = events.find(e => e.id === eventId || (e as any)._id === eventId);
      const backendEventId = (event && (event as any)._id) ? (event as any)._id : eventId;
      const res = await fetch(`/api/events/${backendEventId}`, {
        method: 'DELETE'
      });
      const data = await parseResponse(res);
      if (!res.ok) {
        console.error('Delete event API error:', res.status, data);
        return false;
      }
      if (data.success || data.message === 'Event deleted') {
        // Auto-refresh all data after successful event deletion
        await refreshData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Event deletion failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const addResult = async (eventId: string, resultData: Omit<EventResult, 'id' | 'eventId' | 'createdAt'>[]): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: resultData })
      });
      const data = await parseResponse(res);
      if (!res.ok) {
        console.error('Add results API error:', res.status, data);
        return false;
      }
      if (data.results) {
        setResults(prev => [...prev, ...data.results]);
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'completed' as const } : e));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Adding results failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    events,
    registrations,
    results,
    registerForEvent,
    registerForMultipleEvents,
    unregisterFromEvent,
    removeParticipant,
    validateQRCode,
    createEvent,
    updateEvent,
    deleteEvent,
    addResult,
    loading,
  };

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};