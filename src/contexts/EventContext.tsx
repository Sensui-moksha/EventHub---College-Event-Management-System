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

  // Fetch registrations
  const fetchRegistrations = async () => {
    try {
      const res = await fetch('/api/registrations');
      const data = await res.json();
      if (res.ok && Array.isArray(data.registrations)) {
        setRegistrations(data.registrations);
      }
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
    }
  };

  useEffect(() => {
    // Fetch events from backend
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/events');
        const data = await res.json();
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
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
    fetchRegistrations();
  }, []);

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
      const data = await res.json();
      if (res.ok && data.registration) {
        await fetchRegistrations();
        return true;
      }
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

      const data = await res.json();
      
      if (res.ok) {
        await fetchRegistrations(); // Refresh registrations
        return {
          eventIds,
          userId: user._id || '',
          registrations: data.registrations || [],
          totalEvents: data.totalEvents || eventIds.length,
          successfulRegistrations: data.successfulRegistrations || 0,
          failedRegistrations: data.failedRegistrations || []
        };
      } else {
        return {
          eventIds,
          userId: user._id || '',
          registrations: [],
          totalEvents: eventIds.length,
          successfulRegistrations: 0,
          failedRegistrations: eventIds.map(id => ({ eventId: id, reason: data.error || 'Registration failed' }))
        };
      }
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

      const data = await res.json();
      
      if (res.ok) {
        if (data.valid) {
          await fetchRegistrations(); // Refresh registrations if scan was valid
        }
        return data;
      } else {
        return {
          valid: false,
          reason: data.reason || 'QR validation failed'
        };
      }
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
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchRegistrations();
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

  const createEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'currentParticipants' | 'organizer'>): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...eventData, organizerId: user._id })
      });
      const data = await res.json();
      if (res.ok && data.event) {
        // Map _id to id for frontend compatibility
        const event = { ...data.event, id: data.event._id };
        setEvents(prev => [event, ...prev]);
        return true;
      }
      // If backend returns error, throw it for toast
      if (data.error) {
        throw new Error(data.error);
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
      const data = await res.json();
      if (res.ok && data.event) {
        const updatedEvent = { ...data.event, id: data.event._id };
        setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
        return true;
      }
      if (data.error) {
        throw new Error(data.error);
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
      const data = await res.json();
      if (res.ok && (data.success || data.message === 'Event deleted')) {
        setEvents(prev => prev.filter(e => e.id !== eventId && (e as any)._id !== eventId));
        setRegistrations(prev => prev.filter(r => r.eventId !== eventId));
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
      const data = await res.json();
      if (res.ok && data.results) {
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
    validateQRCode,
    createEvent,
    updateEvent,
    deleteEvent,
    addResult,
    loading,
  };

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};