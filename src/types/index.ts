export interface User {
  id?: string;
  _id?: string;
  regId?: string;
  name: string;
  email: string;
  role: 'student' | 'organizer' | 'admin';
  section?: string;
  department?: string;
  branch?: string; // Added branch for backend compatibility
  mobile?: string;
  year?: number;
  avatar?: string;
  createdAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: 'technical' | 'cultural' | 'sports' | 'workshop' | 'seminar';
  date: Date;
  time: string;
  venue: string;
  maxParticipants: number;
  currentParticipants: number;
  organizerId: string;
  organizer?: User;
  image?: string;
  requirements?: string[];
  prizes?: string[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  registrationDeadline: Date;
  createdAt: Date;
}

export interface Registration {
  id: string;
  userId: string;
  eventId: string;
  user: User & { _id?: string };
  event: Event & { _id?: string };
  registeredAt: Date;
  status: 'registered' | 'attended' | 'absent';
  qrCode?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
}

export interface EventResult {
  id: string;
  eventId: string;
  position: number;
  participantName: string;
  participantId: string;
  prize?: string;
  createdAt: Date;
}