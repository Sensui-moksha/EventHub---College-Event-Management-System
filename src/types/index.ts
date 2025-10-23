export interface User {
  id?: string;
  _id?: string;
  regId?: string;
  name: string;
  email: string;
  role: 'student' | 'organizer' | 'admin' | 'faculty';
  section?: string;
  roomNo?: string;
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
  registrationId: string; // Unique ID for each registration
  userId: string;
  eventId: string;
  user: User & { _id?: string };
  event: Event & { _id?: string };
  registeredAt: Date;
  status: 'registered' | 'attended' | 'absent' | 'cancelled';
  qrCode?: string;
  qrPayload?: QRPayload;
  scanLogs?: ScanLog[];
}

export interface QRPayload {
  registration_id: string;
  student_id: string;
  event_id: string;
  issued_at: string;
  expires_at?: string;
  signature: string;
  event_title?: string;
  student_name?: string;
}

export interface ScanLog {
  id: string;
  registrationId: string;
  scannedAt: Date;
  scannedBy?: string;
  location?: string;
  status: 'valid' | 'invalid' | 'expired' | 'duplicate';
  notes?: string;
}

export interface MultiEventRegistration {
  eventIds: string[];
  userId: string;
  registrations: Registration[];
  totalEvents: number;
  successfulRegistrations: number;
  failedRegistrations: { eventId: string; reason: string; }[];
}

export interface QRValidationResult {
  valid: boolean;
  registration?: Registration;
  reason?: string;
  scanLog?: ScanLog;
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