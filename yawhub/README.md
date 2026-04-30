# KAAF University Noticeboard System - Frontend

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.3.1-61dafb.svg)
![Vite](https://img.shields.io/badge/Vite-5.0-646cff.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**Frontend application for KAAF University Digital Campus Noticeboard and Event Management System**

[Backend Repository](https://github.com/SAMUELBOAKYE/kaaf-noticeboard-backend) | [Live Demo](#) | [Documentation](#)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [API Integration](#api-integration)
- [Backend Compatibility](#backend-compatibility)
- [Contributing](#contributing)
- [License](#license)

---

## 📖 Overview

This is the official frontend application for the **KAAF University Digital Campus Noticeboard and Event Management System**. It provides a modern, responsive interface for students, faculty, and administrators to manage campus notices and events in real-time.

### Key Features

#### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Faculty, Student)
- Secure login/registration with email verification
- Password reset functionality
- Session management with refresh tokens

#### 📢 Notice Management
- Create, read, update, and delete notices
- Rich text editor for notice content
- Category and priority filtering
- Pin important notices
- Search and pagination
- File attachments support

#### 🎉 Event Management
- Event creation and management
- Event registration with capacity limits
- Waitlist functionality
- QR code check-in system
- Event calendar view
- Feedback collection
- Certificate generation

#### 🔔 Real-time Notifications
- Instant notifications via Socket.io
- In-app notification center
- Email notifications
- Push notification support
- Notification preferences

#### 👥 User Management
- Profile management with avatar upload
- User dashboard with activity overview
- Registration history
- Event attendance tracking

#### 📊 Admin Analytics
- User statistics dashboard
- Notice and event analytics
- Registration reports
- Export data to Excel/PDF

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|--------------|
| **Frontend Framework** | React 18 |
| **Build Tool** | Vite |
| **Routing** | React Router v6 |
| **State Management** | Context API, Redux Toolkit |
| **HTTP Client** | Axios |
| **Real-time** | Socket.io Client |
| **UI Components** | Material-UI (MUI) |
| **Forms** | React Hook Form, Yup |
| **Charts** | Recharts, Chart.js |
| **Date Handling** | date-fns, MUI X Date Pickers |
| **File Upload** | React Dropzone |
| **PDF Generation** | @react-pdf/renderer |
| **QR Code** | qrcode.react |
| **Excel Export** | SheetJS (xlsx) |
| **Markdown** | react-markdown |
| **Testing** | Vitest, Testing Library |
| **Code Quality** | ESLint, Prettier |

---

## 📦 Installation

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Backend server running on port 5000

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/SAMUELBOAKYE/kaaf-noticeboard-frontend.git
   cd kaaf-noticeboard-frontend