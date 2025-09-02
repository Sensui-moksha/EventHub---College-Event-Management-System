import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Event, Registration, EventResult } from '../types';
import { useAuth } from './AuthContext';

interface EventContextType {
  events: Event[];
  registrations: Registration[];
  results: EventResult[];
  registerForEvent: (eventId: string) => Promise<boolean>;
  unregisterFromEvent: (eventId: string) => Promise<boolean>;
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
            id: event.id,
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
      // Always use _id for backend
      const event = events.find(e => e.id === eventId || (e as any)._id === eventId);
      const backendEventId = (event && (event as any)._id) ? (event as any)._id : eventId;
      const res = await fetch(`/api/events/${backendEventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id })
      });
      const data = await res.json();
      if (res.ok && data.registration) {
        await fetchRegistrations(); // Always refetch after register
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

  const unregisterFromEvent = async (eventId: string): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);
    try {
      // Always use _id for backend
      const event = events.find(e => e.id === eventId || (e as any)._id === eventId);
      const backendEventId = (event && (event as any)._id) ? (event as any)._id : eventId;
      const res = await fetch(`/api/events/${backendEventId}/unregister`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchRegistrations(); // Always refetch after unregister
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
        const event = { ...data.event, id: data.event._id };
        setEvents(prev => prev.map(e => e.id === eventId ? event : e));
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
    unregisterFromEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    addResult,
    loading,
  };

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};