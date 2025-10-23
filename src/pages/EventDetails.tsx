import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useEvents } from '../contexts/EventContext.tsx';
import { useToast } from '../components/ui/Toast';
import * as XLSX from 'xlsx';
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
  Trash2,
  Filter,
  Download,
  SortAsc,
  SortDesc,
  Edit3,
  Copy,
  MessageCircle,
  Mail,
  MoreHorizontal,
  Search,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { pageVariants } from '../utils/animations';
import { displayCategoryLabel, getCategoryColor } from '../utils/categories';

const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { events, registrations, registerForEvent, unregisterFromEvent, removeParticipant, deleteEvent, loading } = useEvents();
  const { addToast } = useToast();
  const [showQR, setShowQR] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    };

    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShareMenu]);
  
  // Filtering, sorting, and search state
  const [sortBy, setSortBy] = useState<'regId' | 'name' | 'department' | 'year'>('department');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Platform-specific quick share handler
  const handleShare = async () => {
    const url = window.location.href;
    const event = events.find(e => e.id === id || (e as any)._id === id);
    if (!event) return;

    const shareData = {
      title: `${event.title} - EventHub`,
      text: `🎉 Check out this amazing event: ${event.title}\n📅 Date: ${format(new Date(event.date), 'PPP')}\n📍 Venue: ${event.venue}\n\nJoin us for an exciting experience!`,
      url,
    };

    const fullShareText = `${shareData.text}\n\n${shareData.url}`;

    // Detect platforms
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    console.log('Quick Share - Platform detection - Android:', isAndroid, 'iOS:', isIOS);

    // iOS Quick Share - Native iOS Share Sheet (includes AirDrop)
    if (isIOS) {
      if (navigator.share) {
        try {
          await navigator.share(shareData);
          addToast({ 
            type: 'success', 
            title: 'iOS Share Sheet Opened!', 
            message: 'Event shared via iOS native sharing (includes AirDrop).' 
          });
          return;
        } catch (err: any) {
          if (err.name === 'AbortError') {
            addToast({ 
              type: 'info', 
              title: 'Share Cancelled', 
              message: 'iOS sharing was cancelled.' 
            });
            return;
          }
          console.log('iOS Share API failed:', err);
        }
      }
      
      // iOS fallback - copy to clipboard
      try {
        await navigator.clipboard.writeText(fullShareText);
        addToast({ 
          type: 'success', 
          title: 'Copied for iOS!', 
          message: 'Event details copied! Open any iOS app and paste to share.' 
        });
        return;
      } catch (err) {
        console.log('iOS clipboard failed:', err);
      }
    }

    // Android Quick Share - Native Android Share Menu
    if (isAndroid) {
      // Try Android intent for native share menu
      try {
        // Use ACTION_CHOOSER to force Android system dialog
        const chooserIntent = `intent://send#Intent;action=android.intent.action.CHOOSER;S.android.intent.extra.TITLE=Share Event;S.android.intent.extra.INTENT=android.intent.action.SEND|text/plain|S.android.intent.extra.TEXT=${encodeURIComponent(fullShareText)};end`;
        
        window.location.href = chooserIntent;
        
        addToast({ 
          type: 'success', 
          title: 'Android Share Menu Opened!', 
          message: 'Opening native Android share options...' 
        });
        
        return;
        
      } catch (err) {
        console.log('Android intent failed, trying Web Share API:', err);
      }
      
      // Android fallback - Web Share API
      if (navigator.share) {
        try {
          await navigator.share(shareData);
          addToast({ 
            type: 'success', 
            title: 'Android Share Success!', 
            message: 'Event shared via Android native sharing.' 
          });
          return;
        } catch (err: any) {
          if (err.name === 'AbortError') {
            addToast({ 
              type: 'info', 
              title: 'Share Cancelled', 
              message: 'Android sharing was cancelled.' 
            });
            return;
          }
          console.log('Android Web Share API failed:', err);
        }
      }
    }

    // Desktop/Other devices - Standard Web Share API
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        addToast({ 
          type: 'success', 
          title: 'Shared Successfully!', 
          message: 'Event shared via your device\'s share menu.' 
        });
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.log('Web Share API failed:', err);
        }
      }
    }

    // Final fallback - Clipboard copy for all platforms
    try {
      await navigator.clipboard.writeText(fullShareText);
      addToast({ 
        type: 'success', 
        title: 'Link Copied!', 
        message: 'Event details copied to clipboard. You can now paste and share!' 
      });
    } catch (err) {
      console.log('Clipboard failed, trying legacy method:', err);
      
      // Legacy clipboard fallback
      try {
        const textArea = document.createElement('textarea');
        textArea.value = fullShareText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          addToast({ 
            type: 'success', 
            title: 'Link Copied!', 
            message: 'Event details copied to clipboard!' 
          });
        } else {
          throw new Error('Copy failed');
        }
      } catch (finalErr) {
        addToast({ 
          type: 'error', 
          title: 'Share Failed', 
          message: 'Unable to share. Please copy the link manually from address bar.' 
        });
      }
    }
  };

  // Platform-specific share methods
  const shareViaWhatsApp = () => {
    const event = events.find(e => e.id === id || (e as any)._id === id);
    if (!event) return;
    
    const text = `🎉 *${event.title}*\n\n📅 Date: ${format(new Date(event.date), 'PPP')}\n⏰ Time: ${event.time}\n📍 Venue: ${event.venue}\n\nJoin us for this exciting event!\n\n${window.location.href}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
    
    addToast({ 
      type: 'success', 
      title: 'Opening WhatsApp', 
      message: 'Event details prepared for WhatsApp sharing!' 
    });
  };

  const shareViaEmail = () => {
    const event = events.find(e => e.id === id || (e as any)._id === id);
    if (!event) return;
    
    const subject = `Check out this event: ${event.title}`;
    const body = `Hi!\n\nI wanted to share this exciting event with you:\n\n🎉 Event: ${event.title}\n📅 Date: ${format(new Date(event.date), 'PPP')}\n⏰ Time: ${event.time}\n📍 Venue: ${event.venue}\n\n${event.description}\n\nYou can register and get more details here:\n${window.location.href}\n\nHope to see you there!\n\nBest regards`;
    
    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = emailUrl;
    
    addToast({ 
      type: 'success', 
      title: 'Opening Email', 
      message: 'Event details prepared for email sharing!' 
    });
  };

  const copyEventLink = async () => {
    const url = window.location.href;
    
    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(url);
        addToast({ 
          type: 'success', 
          title: 'Link Copied!', 
          message: 'Event link copied to clipboard!' 
        });
        return;
      } catch (err) {
        console.log('Clipboard API failed:', err);
      }
    }
    
    // Fallback method
    try {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        addToast({ 
          type: 'success', 
          title: 'Link Copied!', 
          message: 'Event link copied to clipboard!' 
        });
      } else {
        throw new Error('Copy failed');
      }
    } catch (err) {
      addToast({ 
        type: 'error', 
        title: 'Copy Failed', 
        message: 'Unable to copy link. Please copy manually from address bar.' 
      });
    }
  };

  const openNativeShareMenu = async () => {
    const event = events.find(e => e.id === id || (e as any)._id === id);
    if (!event) return;

    const shareData = {
      title: event.title,
      text: `🎉 ${event.title}\n📅 ${format(new Date(event.date), 'PPP')} at ${event.time}\n📍 ${event.venue}\n\nJoin us for this exciting event!`,
      url: window.location.href
    };

    const fullShareText = `${shareData.text}\n\n${shareData.url}`;

    // Detect different mobile platforms
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isMobile = /Mobi|Android|iPad|iPhone|iPod/i.test(navigator.userAgent);
    
    console.log('Platform detection - Android:', isAndroid, 'iOS:', isIOS, 'Mobile:', isMobile);

    // iOS-specific sharing methods
    if (isIOS) {
      console.log('Attempting iOS-specific sharing methods...');
      
      // Method 1: Try Web Share API first (works well on iOS)
      if (navigator.share) {
        try {
          console.log('Trying iOS Web Share API...');
          await navigator.share(shareData);
          addToast({ 
            type: 'success', 
            title: 'Shared Successfully', 
            message: 'Event shared via iOS share sheet!' 
          });
          return;
        } catch (err: any) {
          if (err.name === 'AbortError') {
            addToast({ 
              type: 'info', 
              title: 'Share Cancelled', 
              message: 'Sharing was cancelled.' 
            });
            return;
          }
          console.log('iOS Web Share API failed:', err);
        }
      }

      // Method 2: Try iOS-specific URL schemes
      try {
        // WhatsApp URL scheme for iOS
        const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(fullShareText)}`;
        
        // Create a temporary link to test if WhatsApp is installed
        const tempLink = document.createElement('a');
        tempLink.href = whatsappUrl;
        tempLink.click();
        
        addToast({ 
          type: 'success', 
          title: 'Opening WhatsApp', 
          message: 'Opening WhatsApp for sharing...' 
        });
        
        return;
        
      } catch (err) {
        console.log('iOS WhatsApp URL scheme failed:', err);
      }

      // Method 3: Try SMS URL scheme for iOS
      try {
        const smsUrl = `sms:&body=${encodeURIComponent(fullShareText)}`;
        window.location.href = smsUrl;
        
        addToast({ 
          type: 'success', 
          title: 'Opening Messages', 
          message: 'Opening iOS Messages app...' 
        });
        
        return;
        
      } catch (err) {
        console.log('iOS SMS URL scheme failed:', err);
      }

      // Method 4: Try mailto for iOS
      try {
        const mailtoUrl = `mailto:?subject=${encodeURIComponent(`Event: ${shareData.title}`)}&body=${encodeURIComponent(fullShareText)}`;
        window.location.href = mailtoUrl;
        
        addToast({ 
          type: 'success', 
          title: 'Opening Mail', 
          message: 'Opening iOS Mail app...' 
        });
        
        return;
        
      } catch (err) {
        console.log('iOS mailto failed:', err);
      }
    }

    // Android-specific methods for native sharing (try first for Android)
    if (isAndroid && isMobile) {
      console.log('Attempting Android-specific sharing methods...');
      
      // Method 1: Force Android Chooser - this bypasses any default app selection
      try {
        // Use ACTION_CHOOSER to force the system dialog
        const chooserIntent = `intent://send#Intent;action=android.intent.action.CHOOSER;S.android.intent.extra.TITLE=Share Event;S.android.intent.extra.INTENT=android.intent.action.SEND|text/plain|S.android.intent.extra.TEXT=${encodeURIComponent(fullShareText)};end`;
        
        window.location.href = chooserIntent;
        
        addToast({ 
          type: 'success', 
          title: 'Opening System Chooser', 
          message: 'Opening Android app chooser...' 
        });
        
        return;
        
      } catch (err) {
        console.log('Chooser Intent method failed:', err);
      }

      // Method 2: Try standard share intent without specific app targeting
      try {
        // Simple share intent that should trigger system dialog
        const shareIntent = `intent:${encodeURIComponent(fullShareText)}#Intent;action=android.intent.action.SEND;type=text/plain;end`;
        
        window.location.href = shareIntent;
        
        addToast({ 
          type: 'success', 
          title: 'Opening Share Dialog', 
          message: 'Opening Android share options...' 
        });
        
        return;
        
      } catch (err) {
        console.log('Share Intent method failed:', err);
      }

      // Method 3: Try mailto to trigger Android app chooser
      try {
        // This often triggers Android's native chooser for communication apps
        const mailtoUrl = `mailto:?subject=${encodeURIComponent(`Event: ${shareData.title}`)}&body=${encodeURIComponent(fullShareText)}`;
        
        window.location.href = mailtoUrl;
        
        addToast({ 
          type: 'success', 
          title: 'Opening App Chooser', 
          message: 'Opening Android communication apps...' 
        });
        
        return;
        
      } catch (err) {
        console.log('Mailto method failed:', err);
      }
    }

    // Fallback to Web Share API for other devices
    if (navigator.share) {
      try {
        console.log('Trying Web Share API...');
        await navigator.share(shareData);
        addToast({ 
          type: 'success', 
          title: 'Shared Successfully', 
          message: 'Event shared successfully!' 
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          addToast({ 
            type: 'info', 
            title: 'Share Cancelled', 
            message: 'Sharing was cancelled.' 
          });
          return;
        }
        console.log('Web Share API failed:', err);
      }
    }

    // Final fallback - copy to clipboard
    try {
      await navigator.clipboard.writeText(fullShareText);
      addToast({ 
        type: 'success', 
        title: 'Copied to Clipboard', 
        message: 'Event details copied! You can paste and share manually.' 
      });
    } catch (err) {
      addToast({ 
        type: 'error', 
        title: 'Share Failed', 
        message: 'Unable to share or copy. Please share the link manually.' 
      });
    }
  };

  // ...existing code...

  // Robust event lookup for both id and _id
  const event = events.find(e => e.id === id || (e as any)._id === id);
  const userId = user?._id || user?.id;
  const isRegistered = registrations.some(r => {
    const regUserId = (r.userId as any);
    return (
      (r.eventId === id || 
       (event && r.eventId === event.id) || 
       (event && r.eventId === (event as any)._id)) &&
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
    const matchesEvent = regEventId === id || 
      (event && regEventId === event.id) || 
      (event && regEventId === (event as any)._id);
    return matchesUser && matchesEvent;
  });

  // Get all registrations for this event
  const eventRegistrations = registrations.filter(r => {
    const regEventId = (r.eventId as any);
    return regEventId === id || 
      (event && regEventId === event.id) || 
      (event && regEventId === (event as any)._id);
  });

  // Department options with CSE first
  const departmentOptions = useMemo(() => {
    // Departments available in registration page with Computer Science (CSE) first
    const availableDepts = [
      'CSE',      // CSE equivalent
      'IT',
      'AI & DS',              // Artificial Intelligence & Data Science
      'AI & ML',              // Artificial Intelligence & Machine Learning
      'ECE',
      'EEE',                  // Electrical & Electronics Engineering
      'Mechanical',
      'Civil',
    ];
    
    // Get departments from registered students
    const registeredDepts = eventRegistrations.length > 0 
      ? [...new Set(eventRegistrations.map(r => r.user.department).filter(Boolean))]
      : [];
    
    // Combine available departments with any additional departments from registrations
    const allDepts = [...availableDepts];
    registeredDepts.forEach(dept => {
      if (dept && !allDepts.includes(dept)) {
        allDepts.push(dept);
      }
    });
    
    return allDepts;
  }, [eventRegistrations]);

  // Filtered and sorted participants
  // Filtered, searched, and sorted participants
  const filteredAndSortedParticipants = useMemo(() => {
    if (!eventRegistrations.length) return [];
    
    let filtered = [...eventRegistrations];
    
    // Apply department filter
    if (filterDepartment !== 'all') {
      filtered = filtered.filter(r => r.user.department === filterDepartment);
    }
    
    // Apply search filter (case-insensitive, comprehensive search)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(r => {
        const user = r.user;
        
        // Search through multiple fields
        const searchableFields = [
          user.name || '',
          user.email || '',
          user.regId || '',
          user.department || '',
          user.section || '',
          (user as any).roomNo || '',
          user.year?.toString() || '',
          user.mobile || '',
          // Also search in registration date
          new Date(r.registeredAt).toLocaleDateString() || '',
          // Status
          r.status || ''
        ];
        
        // Check if any field contains the search term
        return searchableFields.some(field => 
          field.toLowerCase().includes(searchLower)
        );
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'regId':
          const regIdA = a.user.regId || '';
          const regIdB = b.user.regId || '';
          comparison = regIdA.localeCompare(regIdB, undefined, { numeric: true });
          break;
        case 'name':
          comparison = a.user.name.localeCompare(b.user.name);
          break;
        case 'department':
          const deptA = a.user.department || '';
          const deptB = b.user.department || '';
          comparison = deptA.localeCompare(deptB);
          break;
        case 'year':
          const yearA = a.user.year || 0;
          const yearB = b.user.year || 0;
          comparison = yearA - yearB;
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return filtered;
  }, [eventRegistrations, filterDepartment, searchTerm, sortBy, sortOrder]);

  // Excel export function
  const exportToExcel = () => {
    if (!filteredAndSortedParticipants.length) {
      addToast({
        type: 'error',
        title: 'No Data',
        message: 'No participants to export',
      });
      return;
    }

    // Create workbook and worksheet manually for better style control
    const wb = XLSX.utils.book_new();
    
    // Define headers
    const headers = [
      'S.No', 'Registration ID', 'Name', 'Department', 'Section/Room', 
      'Year', 'Email', 'Mobile', 'Registered At', 'Status'
    ];
    
    // Create data rows
    const dataRows = filteredAndSortedParticipants.map((reg, index) => [
      index + 1,
      reg.user.regId || 'N/A',
      reg.user.name,
      reg.user.department || 'N/A',
      (reg.user.role === 'faculty' ? (reg.user as any).roomNo : reg.user.section) || 'N/A',
      reg.user.year || 'N/A',
      reg.user.email,
      reg.user.mobile || 'N/A',
      new Date(reg.registeredAt).toLocaleString(),
      reg.status
    ]);
    
    // Combine headers and data
    const allData = [headers, ...dataRows];
    
    // Create worksheet from array
    const ws = XLSX.utils.aoa_to_sheet(allData);
    
    // Initialize worksheet properties
    if (!ws['!cols']) ws['!cols'] = [];
    if (!ws['!rows']) ws['!rows'] = [];
    
    // Set column widths
    ws['!cols'] = headers.map((header, index) => {
      const maxLength = Math.max(
        header.length,
        ...dataRows.map(row => String(row[index] || '').length)
      );
      return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
    });
    
    // Set header row height
    ws['!rows'][0] = { hpt: 35 };
    
    // Apply styles to header cells (A1 to J1)
    const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) continue;
      
      // Set cell style
      ws[cellAddress].s = {
        fill: {
          patternType: "solid",
          fgColor: { rgb: "4472C4" } // Professional blue
        },
        font: {
          name: "Calibri",
          color: { rgb: "FFFFFF" },
          bold: true,
          sz: 11
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: false
        },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    }
    
    // Apply borders to all data cells
    for (let row = 1; row <= headerRange.e.r; row++) {
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[cellAddress]) continue;
        
        if (!ws[cellAddress].s) ws[cellAddress].s = {};
        ws[cellAddress].s.border = {
          top: { style: "thin", color: { rgb: "D3D3D3" } },
          bottom: { style: "thin", color: { rgb: "D3D3D3" } },
          left: { style: "thin", color: { rgb: "D3D3D3" } },
          right: { style: "thin", color: { rgb: "D3D3D3" } }
        };
      }
    }
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Participants');
    
    // Generate filename and download
    const fileName = `${(event?.title || 'event').replace(/[^a-zA-Z0-9]/g, '_')}_participants.xlsx`;
    
    // Write file with specific options for better compatibility
    XLSX.writeFile(wb, fileName, { 
      bookType: 'xlsx',
      cellStyles: true,
      compression: true
    });
    
    addToast({
      type: 'success',
      title: 'Export Successful',
      message: `Downloaded ${filteredAndSortedParticipants.length} participants to ${fileName}`,
    });
  };

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

  const handleRemoveParticipant = async (userId: string, userName: string) => {
    if (!user || !event || !window.confirm(`Are you sure you want to remove ${userName} from this event?`)) return;
    
    const success = await removeParticipant(event.id, userId);
    if (success) {
      addToast({ 
        type: 'success', 
        title: 'Participant Removed', 
        message: `${userName} has been removed from the event.` 
      });
    } else {
      addToast({ 
        type: 'error', 
        title: 'Error', 
        message: 'Failed to remove participant. Please try again.' 
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

  const handleEditEvent = () => {
    navigate(`/events/${id}/edit`);
  };

  // Use shared category utils to keep display consistent across the app
  // Note: event may include a customCategory field when category is a custom string
  // We import helpers at top of file

  return (
    <motion.div 
      className="min-h-screen pt-16 sm:pt-20 lg:pt-24 pb-8"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10">
        {/* Back Button */}
        <motion.button
          onClick={() => navigate('/events')}
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 mb-4 sm:mb-6 transition-colors text-sm sm:text-base"
          whileHover={{ x: -5 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Back to Events</span>
        </motion.button>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Event Image */}
          {event.image && (
            <div className="relative h-48 sm:h-56 md:h-64 lg:h-80 xl:h-96">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getCategoryColor(event.category)}`}>
                    {displayCategoryLabel(event.category)}
                  </span>
                  <span className="px-2 sm:px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs sm:text-sm font-medium">
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
                  {event.title}
                </h1>
              </div>
            </div>
          )}

            <div className="p-4 sm:p-6 lg:p-8 xl:p-10">
              {/* Always show event date, time, and registration deadline at the top */}
              <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
                <div className="flex items-center text-gray-600 text-sm sm:text-base">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500 flex-shrink-0" />
                  <span className="truncate">{format(new Date(event.date), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex items-center text-gray-600 text-sm sm:text-base">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500 flex-shrink-0" />
                  <span className="truncate">{event.time}</span>
                </div>
                <div className="flex items-center text-gray-600 text-sm sm:text-base">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-yellow-500 flex-shrink-0" />
                  <span className="truncate">Reg. Deadline: {event.registrationDeadline ? format(new Date(event.registrationDeadline), 'MMM dd, yyyy') : '-'}</span>
                </div>
              </div>
            {/* Event Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Event Details</h2>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center text-gray-600 text-sm sm:text-base">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-blue-500 flex-shrink-0" />
                    <span className="break-words">{format(event.date, 'EEEE, MMMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm sm:text-base">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-blue-500 flex-shrink-0" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm sm:text-base">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-blue-500 flex-shrink-0" />
                    <span className="break-words">{event.venue}</span>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm sm:text-base">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-blue-500 flex-shrink-0" />
                    <span>{event.currentParticipants} / {event.maxParticipants} participants</span>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm sm:text-base">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-blue-500 flex-shrink-0" />
                    <span className="break-words">Organized by {event.organizer?.name ?? 'Unknown'}</span>
                  </div>
                </div>

                {/* Registration Deadline */}
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-yellow-800">
                    <strong>Registration Deadline:</strong> {format(deadlineDate, 'MMM dd, yyyy')}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    Registration is {isRegistrationOpen ? 'open' : 'closed'} • Current date: {format(currentDate, 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Description</h2>
                <p className="text-gray-600 leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">
                  {event.description}
                </p>

                {/* Requirements */}
                {event.requirements && event.requirements.length > 0 && (
                  <div className="mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Requirements</h3>
                    <ul className="space-y-2">
                      {event.requirements.map((req, index) => (
                        <li key={index} className="flex items-start text-gray-600 text-sm sm:text-base">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="break-words">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Prizes */}
                {event.prizes && event.prizes.length > 0 && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Prizes</h3>
                    <div className="flex items-start text-gray-600 text-sm sm:text-base">
                      <Trophy className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span className="break-words">{event.prizes.join(', ')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Registration Progress */}
            <div className="mb-6 sm:mb-8">
              <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
                <span>Registration Progress</span>
                <span>{event.currentParticipants} / {event.maxParticipants}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 sm:h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((event.currentParticipants / event.maxParticipants) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:gap-4">
              {user ? (
                <>
                  {isRegistered ? (
                    <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
                      <div className="flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 bg-green-50 border border-green-200 rounded-lg flex-1">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                        <span className="text-green-800 font-medium text-sm sm:text-base">You're registered!</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <button
                          onClick={() => setShowQR(true)}
                          className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2 text-sm sm:text-base min-w-[140px] sm:min-w-[160px]"
                        >
                          <QrCode className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                          <span>Show QR Code</span>
                        </button>
                        <button
                          onClick={handleUnregister}
                          disabled={loading}
                          className="px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 text-sm sm:text-base min-w-[120px] sm:min-w-[140px]"
                        >
                          {loading ? 'Processing...' : 'Unregister'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleRegister}
                      disabled={loading || !isRegistrationOpen || isFull}
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                      {loading ? 'Processing...' : 
                       currentDate > deadlineDate ? 'Registration Deadline Passed' :
                       event.status !== 'upcoming' ? 'Event Not Upcoming' :
                       isFull ? 'Event Full' : 'Register Now'}
                    </button>
                  )}
                  
                  {/* Admin/Organizer Actions */}
                  {(user.role === 'admin' || user.role === 'organizer') && (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button
                        onClick={handleEditEvent}
                        className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center justify-center space-x-2 text-sm sm:text-base"
                      >
                        <Edit3 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        <span>Edit Event</span>
                      </button>
                      <button
                        onClick={handleDeleteEvent}
                        disabled={loading}
                        className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center space-x-2 text-sm sm:text-base"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        <span>{loading ? 'Deleting...' : 'Delete Event'}</span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
                >
                  Login to Register
                </button>
              )}

              {/* Share Button */}
              <div className="w-full">
                <button
                  type="button"
                  onClick={() => {
                    console.log('Share button clicked, opening modal');
                    setShowShareMenu(true);
                  }}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span>Share Event</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Share Modal Popup */}
        {showShareMenu && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4">
            <div 
              ref={shareMenuRef}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Share Event</h3>
                <button
                  onClick={() => setShowShareMenu(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <p className="text-gray-600 mb-6">Choose how you'd like to share this event:</p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      console.log('Quick Share clicked');
                      handleShare();
                      setShowShareMenu(false);
                    }}
                    className="w-full text-left px-4 py-4 hover:bg-blue-50 rounded-lg flex items-center space-x-4 text-gray-700 transition-colors duration-150 border border-gray-200 hover:border-blue-300"
                  >
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Share2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold">Quick Share</div>
                      <div className="text-sm text-gray-500">Use native device sharing</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      console.log('More Options clicked');
                      openNativeShareMenu();
                      setShowShareMenu(false);
                    }}
                    className="w-full text-left px-4 py-4 hover:bg-purple-50 rounded-lg flex items-center space-x-4 text-gray-700 transition-colors duration-150 border border-gray-200 hover:border-purple-300"
                  >
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <MoreHorizontal className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-semibold">Advanced Sharing Options</div>
                      <div className="text-sm text-gray-500">Enhanced sharing with multiple methods</div>
                    </div>
                  </button>
                  
                  <div className="border-t border-gray-200 my-4"></div>
                  
                  <button
                    onClick={() => {
                      console.log('WhatsApp clicked');
                      shareViaWhatsApp();
                      setShowShareMenu(false);
                    }}
                    className="w-full text-left px-4 py-4 hover:bg-green-50 rounded-lg flex items-center space-x-4 text-gray-700 transition-colors duration-150 border border-gray-200 hover:border-green-300"
                  >
                    <div className="p-2 bg-green-100 rounded-lg">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold">WhatsApp</div>
                      <div className="text-sm text-gray-500">Share via WhatsApp</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      console.log('Email clicked');
                      shareViaEmail();
                      setShowShareMenu(false);
                    }}
                    className="w-full text-left px-4 py-4 hover:bg-orange-50 rounded-lg flex items-center space-x-4 text-gray-700 transition-colors duration-150 border border-gray-200 hover:border-orange-300"
                  >
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Mail className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-semibold">Email</div>
                      <div className="text-sm text-gray-500">Share via email</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      console.log('Copy Link clicked');
                      copyEventLink();
                      setShowShareMenu(false);
                    }}
                    className="w-full text-left px-4 py-4 hover:bg-gray-50 rounded-lg flex items-center space-x-4 text-gray-700 transition-colors duration-150 border border-gray-200 hover:border-gray-300"
                  >
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Copy className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-semibold">Copy Link</div>
                      <div className="text-sm text-gray-500">Copy event link to clipboard</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Registered Students ({filteredAndSortedParticipants.length})
            </h2>
            
            {/* Filter and Export Controls */}
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Search Input */}
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {/* Department Filter */}
                <div className="flex items-center space-x-2 flex-1">
                  <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Departments</option>
                    {departmentOptions.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* Sort Controls */}
                <div className="flex items-center space-x-2 flex-1">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'regId' | 'name' | 'department' | 'year')}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="department">Sort by Department</option>
                    <option value="regId">Sort by Reg. ID</option>
                    <option value="name">Sort by Name</option>
                    <option value="year">Sort by Year</option>
                  </select>
                  
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                    title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                  >
                    {sortOrder === 'asc' ? (
                      <SortAsc className="w-4 h-4 text-gray-500" />
                    ) : (
                      <SortDesc className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>

                {/* Export Button */}
                <button
                  onClick={exportToExcel}
                  disabled={filteredAndSortedParticipants.length === 0}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 whitespace-nowrap"
                  title="Export to Excel"
                >
                  <Download className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Export Excel</span>
                  <span className="sm:hidden">Export</span>
                </button>
              </div>
            </div>
          </div>

          {filteredAndSortedParticipants.length === 0 ? (
            <p className="text-gray-600">
              {eventRegistrations.length === 0 
                ? "No students have registered for this event yet." 
                : "No participants match the current filter."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">Reg. ID</th>
                    <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">Department</th>
                    <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">Section/Room</th>
                    <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">Year</th>
                    <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">Registered At</th>
                    {(user?.role === 'admin' || user?.role === 'organizer') && (
                      <th className="px-4 py-2 border-b text-left text-sm font-semibold text-gray-700">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedParticipants.map(reg => (
                    <tr key={reg.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-800">{reg.user?.regId ?? reg.id}</td>
                      <td className="px-4 py-2 text-sm text-gray-800">{reg.user?.name ?? '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-800">{reg.user?.email ?? '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-800">{reg.user?.department ?? '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-800">{reg.user?.role === 'faculty' ? (reg.user as any)?.roomNo ?? '-' : reg.user?.section ?? '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-800">{reg.user?.year ?? '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-800">{reg.registeredAt ? format(new Date(reg.registeredAt), 'MMM dd, yyyy') : '-'}</td>
                      {(user?.role === 'admin' || user?.role === 'organizer') && (
                        <td className="px-4 py-2 text-sm">
                          <button
                            onClick={() => handleRemoveParticipant(
                              reg.user?._id || reg.user?.id || reg.userId, 
                              reg.user?.name || 'Unknown User'
                            )}
                            disabled={loading}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-1"
                            title="Remove participant"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default EventDetails;