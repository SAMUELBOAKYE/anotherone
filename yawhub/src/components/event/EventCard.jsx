// src/components/event/EventCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatTime, formatRelativeTime } from '../../utils/formatters';
import '../../styles/components/EventCard.css';

const EventCard = ({ event, variant = 'default' }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/events/${event._id}`);
  };

  const renderIcon = (iconName) => {
    const icons = {
      calendar: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
      time: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      location: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      ),
      users: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      academic: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      ),
      exam: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      ),
      registration: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
        </svg>
      ),
      meeting: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
      holiday: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
      ),
      ongoing: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="4"/>
        </svg>
      ),
      upcoming: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      completed: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 12l3 3 6-6"/>
        </svg>
      ),
      register: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
          <line x1="12" y1="3" x2="12" y2="11"/>
          <line x1="9" y1="7" x2="15" y2="7"/>
        </svg>
      )
    };
    return icons[iconName];
  };

  const getEventTypeConfig = (type) => {
    const types = {
      academic: {
        icon: 'academic',
        label: 'ACADEMIC',
        color: '#3b82f6',
        bg: 'rgba(59, 130, 246, 0.1)'
      },
      exam: {
        icon: 'exam',
        label: 'EXAM',
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.1)'
      },
      registration: {
        icon: 'registration',
        label: 'REGISTRATION',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.1)'
      },
      meeting: {
        icon: 'meeting',
        label: 'MEETING',
        color: '#8b5cf6',
        bg: 'rgba(139, 92, 246, 0.1)'
      },
      holiday: {
        icon: 'holiday',
        label: 'HOLIDAY',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.1)'
      },
      workshop: {
        icon: 'academic',
        label: 'WORKSHOP',
        color: '#06b6d4',
        bg: 'rgba(6, 182, 212, 0.1)'
      },
      seminar: {
        icon: 'meeting',
        label: 'SEMINAR',
        color: '#ec4899',
        bg: 'rgba(236, 72, 153, 0.1)'
      }
    };
    return types[type] || types.academic;
  };

  const getEventStatus = () => {
    const eventDate = new Date(event.date);
    const eventEndDate = event.endDate ? new Date(event.endDate) : eventDate;
    const now = new Date();

    if (now >= eventDate && now <= eventEndDate) {
      return { status: 'ongoing', label: 'ONGOING', icon: 'ongoing', color: '#10b981' };
    } else if (now < eventDate) {
      const daysUntil = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
      return { status: 'upcoming', label: `${daysUntil} DAYS LEFT`, icon: 'upcoming', color: '#3b82f6' };
    } else {
      return { status: 'past', label: 'COMPLETED', icon: 'completed', color: '#94a3b8' };
    }
  };

  const typeConfig = getEventTypeConfig(event.eventType);
  const statusConfig = getEventStatus();
  const isUpcoming = statusConfig.status === 'upcoming';
  const isOngoing = statusConfig.status === 'ongoing';
  const isFull = event.registeredCount >= event.capacity;

  return (
    <div className={`event-card ${variant === 'compact' ? 'event-card-compact' : ''}`} onClick={handleClick}>
      {/* Event Header with Type Badge */}
      <div className="event-card-header">
        <div className="event-type-badge" style={{ background: typeConfig.bg, color: typeConfig.color }}>
          {renderIcon(typeConfig.icon)}
          <span>{typeConfig.label}</span>
        </div>
        <div className="event-status-badge" style={{ background: statusConfig.color }}>
          {renderIcon(statusConfig.icon)}
          <span>{statusConfig.label}</span>
        </div>
      </div>

      {/* Event Image */}
      {event.image && (
        <div className="event-card-image">
          <img src={event.image} alt={event.title} />
          {isOngoing && <div className="event-live-badge">LIVE</div>}
        </div>
      )}

      {/* Event Content */}
      <div className="event-card-content">
        <h3 className="event-card-title">{event.title}</h3>
        
        <div className="event-card-details">
          <div className="event-detail-item">
            {renderIcon('calendar')}
            <span>{formatDate(event.date)}</span>
            {event.endDate && event.endDate !== event.date && (
              <span> - {formatDate(event.endDate)}</span>
            )}
          </div>
          
          {event.time && (
            <div className="event-detail-item">
              {renderIcon('time')}
              <span>{event.time}</span>
            </div>
          )}
          
          <div className="event-detail-item">
            {renderIcon('location')}
            <span>{event.location || 'KAAF University Campus'}</span>
          </div>
          
          <div className="event-detail-item">
            {renderIcon('users')}
            <span>{event.registeredCount || 0} / {event.capacity} registered</span>
          </div>
        </div>
        
        <p className="event-card-description">
          {event.description?.length > (variant === 'compact' ? 80 : 120)
            ? `${event.description.substring(0, variant === 'compact' ? 80 : 120)}...`
            : event.description}
        </p>
        
        <div className="event-card-footer">
          {isUpcoming && !isFull && (
            <button className="event-register-btn" onClick={(e) => { e.stopPropagation(); navigate(`/events/${event._id}/register`); }}>
              {renderIcon('register')}
              Register Now
            </button>
          )}
          {isUpcoming && isFull && (
            <span className="event-full-badge">Fully Booked</span>
          )}
          <span className="event-read-more">Read More →</span>
        </div>
      </div>
    </div>
  );
};

export default EventCard;