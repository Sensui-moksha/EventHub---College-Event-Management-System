import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Trophy,
  ChevronRight
} from 'lucide-react';
import { Event } from '../types';

interface EventCardProps {
  event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const getCategoryColor = (category: Event['category']) => {
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

  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'upcoming':
        return 'bg-green-100 text-green-800';
      case 'ongoing':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isRegistrationOpen = new Date() < event.registrationDeadline && event.status === 'upcoming';
  const isFull = event.currentParticipants >= event.maxParticipants;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Event Image */}
      {event.image && (
        <div className="relative h-40 sm:h-48 lg:h-52 overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4 flex flex-wrap gap-2">
            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
              {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
            </span>
            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            </span>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6">
        {/* Event Title */}
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
          {event.title}
        </h3>

        {/* Event Description */}
        <p className="text-gray-600 text-sm mb-3 sm:mb-4 line-clamp-2">
          {event.description}
        </p>

        {/* Event Details */}
        <div className="space-y-2 mb-3 sm:mb-4">
          <div className="flex items-center text-xs sm:text-sm text-gray-600">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-blue-500 flex-shrink-0" />
            <span className="truncate">{format(new Date(event.date), 'MMM dd, yyyy')}</span>
          </div>
          <div className="flex items-center text-xs sm:text-sm text-gray-600">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-blue-500 flex-shrink-0" />
            <span className="truncate">{event.time}</span>
          </div>
          <div className="flex items-center text-xs sm:text-sm text-gray-600">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-blue-500 flex-shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
          <div className="flex items-center text-xs sm:text-sm text-gray-600">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-blue-500 flex-shrink-0" />
            <span className="truncate">{event.currentParticipants} / {event.maxParticipants} participants</span>
          </div>
          <div className="flex items-center text-xs sm:text-sm text-gray-600">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-yellow-500 flex-shrink-0" />
            <span className="truncate">Reg. Deadline: {event.registrationDeadline ? format(new Date(event.registrationDeadline), 'MMM dd, yyyy') : '-'}</span>
          </div>
        </div>

        {/* Prizes */}
        {event.prizes && event.prizes.length > 0 && (
          <div className="flex items-center text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
            <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-yellow-500 flex-shrink-0" />
            <span className="truncate">Prizes: {event.prizes.join(', ')}</span>
          </div>
        )}

        {/* Registration Status */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center space-x-2">
            {isFull ? (
              <span className="text-xs text-orange-600 font-medium">Event Full</span>
            ) : isRegistrationOpen ? (
              <span className="text-xs text-green-600 font-medium">Registration Open</span>
            ) : (
              <span className="text-xs text-red-600 font-medium">Registration Closed</span>
            )}
          </div>
          <Link
            to={`/events/${event.id || (event as any)._id}`}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium text-xs sm:text-sm group-hover:translate-x-1 transition-all"
          >
            <span>View Details</span>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
          </Link>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Registration Progress</span>
            <span>{Math.round((event.currentParticipants / event.maxParticipants) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-1.5 sm:h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((event.currentParticipants / event.maxParticipants) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;