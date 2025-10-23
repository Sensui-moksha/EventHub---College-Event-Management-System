EventHub — College Event Management System

Problem Statement

Colleges and student organizations frequently struggle with manual, fragmented processes for managing events, registrations, and attendance. Existing tools often require multiple platforms, manual data entry, and provide poor support for event-specific workflows such as bulk registration, secure check-in, and mass user management. This inefficiency leads to administrative overhead, inaccurate attendance records, and a poor experience for students and organizers.

Project Description

EventHub is a modern, full‑stack web application designed to centralize and streamline the lifecycle of college events — from creation and promotion to registration, check‑in, and post‑event reporting. The application provides role‑based access (Student, Organizer, Admin), a unified QR code system for secure and verifiable attendance, multi‑event registration, and admin tools for bulk operations and user management. It is built with maintainability, security, and mobile responsiveness in mind.

Key Capabilities

- Role-based authentication and authorization (Student, Organizer, Admin)
- Create, edit, and manage events with images and metadata
- Multi-event registration with per-event QR code generation
- Secure QR codes with HMAC-SHA256 signatures and expiry checks
- Unified camera-based QR scanner and manual entry fallback
- Real-time registration and attendance tracking with scan history
- Bulk administrative operations (mass delete, user management)
- Profile management with avatar uploads and registration IDs

Technical Summary

Frontend
- React 18 + TypeScript, built with Vite
- Tailwind CSS for responsive, utility-first styling
- React Router for navigation and React Context for state management
- QR generation and scanning implemented client-side with canvas overlays and html5-qrcode

Backend
- Node.js + Express REST API
- MongoDB Atlas with Mongoose ODM
- JWT-based authentication and bcrypt password hashing
- Server-side QR image generation for downloads and verification

How to Run (development)

1. Install dependencies

Windows (PowerShell):

```powershell
cd "f:\The final Product moksha project\edit"
npm install
cd server
npm install
cd ..
```

2. Start the full development environment

```powershell
# From project root
npm run dev
```

3. Access the application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

Maintenance and Next Steps

- Add WebSocket-based real-time notifications for live updates during events
- Integrate cloud file storage (S3) for images to replace base64 storage
- Add automated tests for critical API endpoints and QR validation logic
- Expand analytics and reporting for event organizers and administrators

Contact & Attribution

Core Contributor: Mokshyagna Yadav (github.com/Sensui-moksha)

License & Distribution

All rights reserved by the project owner. See `README.md` for more details.