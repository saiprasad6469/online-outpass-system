# Online Outpass System

A full-stack web application built to digitize and simplify the outpass process in college hostels and campuses. The goal is straightforward — replace the manual, paper-based system that most institutions still rely on with something faster, more transparent, and easier to manage for everyone involved.

---

## The Problem This Solves

In most hostels, getting an outpass means hunting down a warden, filling a paper form, waiting for a signature, and hoping the record does not get lost. There is no way for a student to know what is happening with their request, and admins have no clean way to track who went where and when.

This system replaces all of that. Students submit requests from their phone or laptop, admins handle approvals from a single dashboard, and every action is logged automatically. No paperwork, no chasing people down, no confusion about request status.

---

## How It Works

The flow is simple on purpose:

1. A student logs in with their credentials and goes to the request form.
2. They fill in the destination, date, time of departure, expected return, and the reason for going out.
3. The request is submitted and immediately appears on the admin's dashboard.
4. The admin or warden reviews it and either approves or rejects it, optionally leaving a remark.
5. The student's dashboard updates in real time to reflect the decision.
6. An approved request acts as a digital outpass — the student can show it at the gate.

Everything is tracked. Nothing slips through.

---

## User Roles

### Student

Students have their own dedicated dashboard where they can:

- Log in securely and access their personal profile
- Submit new outpass requests with all required details
- View the current status of any pending request (Pending, Approved, or Rejected)
- See the admin's remarks if a request was rejected
- Browse the full history of their past outpass requests

### Admin / Warden

Admins have a separate interface with elevated access:

- A centralized dashboard showing all incoming requests from all students
- Ability to filter and sort requests by date, status, or student name
- One-click approval or rejection with an optional remarks field
- Access to complete student records and outpass history
- Overview of how many students are currently outside campus at any given time

---

## Features

**Authentication and Authorization**
Login is handled securely with session management. Passwords are hashed before storage, and routes are protected based on role. A student cannot access the admin dashboard and vice versa.

**Outpass Request Form**
The request form captures all the necessary details — destination, date and time of departure, expected time of return, and the reason. Basic validation is in place to prevent incomplete submissions.

**Admin Approval System**
Admins see all requests in one place. They can approve or reject with a single action. If rejecting, they can leave a note explaining why, which the student can see on their end.

**Real-Time Status Updates**
Once an admin takes action, the student's dashboard reflects the change immediately. Students do not need to refresh the page or contact anyone to know the status.

**Request History and Records**
Every outpass request — approved, rejected, or cancelled — is stored and accessible. Students can view their own history. Admins can view records across all students, which is useful for audits or tracking patterns.

**Role-Based Access Control**
The system has two completely separate user flows. Students and admins see different interfaces, have access to different data, and can perform different actions. This is enforced at both the frontend and backend level.

---

## Tech Stack

**Frontend**
- React.js for the UI
- Component-based structure with separate views for student and admin roles
- Axios for API calls to the backend

**Backend**
- Node.js with Express for the server and REST API
- JWT (JSON Web Tokens) for authentication
- Middleware for role-based route protection

**Database**
- MongoDB with Mongoose for schema definition and data storage
- Collections for Users and Outpass Requests

---

## Getting Started

### Prerequisites

- Node.js (v16 or above)
- MongoDB (local installation or a MongoDB Atlas connection string)
- Git

### Installation

Clone the repository and move into the project directory:

```bash
git clone https://github.com/your-username/online-outpass-system.git
cd online-outpass-system
```

Install dependencies for both the server and client:

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

Set up your environment variables:

```bash
cp .env.example .env
```

Open `.env` and fill in the following:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Start the development server:

```bash
npm run dev
```

This will start both the backend server and the React frontend concurrently. The app should be running at `http://localhost:3000` and the API at `http://localhost:5000`.

---

## Project Structure

```
online-outpass-system/
│
├── client/                  # React frontend
│   ├── src/
│   │   ├── pages/           # Student dashboard, Admin dashboard, Login, etc.
│   │   ├── components/      # Reusable UI components
│   │   └── services/        # API call functions using Axios
│   └── public/
│
├── server/                  # Express backend
│   ├── routes/              # API routes (auth, outpass, admin)
│   ├── controllers/         # Logic for each route
│   └── middleware/          # Auth middleware, role checks
│
├── models/                  # Mongoose schemas
│   ├── User.js              # Student and Admin user model
│   └── Outpass.js           # Outpass request model
│
├── config/
│   └── db.js                # MongoDB connection setup
│
├── .env.example             # Sample environment variables
├── package.json
└── README.md
```

---

## API Overview

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Both | Login and receive JWT token |
| POST | `/api/outpass/request` | Student | Submit a new outpass request |
| GET | `/api/outpass/my-requests` | Student | Get all requests by the logged-in student |
| GET | `/api/admin/requests` | Admin | Get all outpass requests across students |
| PUT | `/api/admin/requests/:id` | Admin | Approve or reject a specific request |
| GET | `/api/admin/students` | Admin | View all registered students |

---

## Screenshots

> *(Add screenshots here — Student Dashboard, Admin Panel, Request Form, Status View)*

---

## Why This Is Worth Building

This is not just an academic exercise. Institutions that deal with large volumes of student movement face real operational problems — lack of records, delayed approvals, no accountability when something goes wrong. This system directly addresses those issues with a setup that can be deployed and adapted without much overhead.

The codebase is structured cleanly enough that extending it — for example, adding email notifications, SMS alerts, or integration with an attendance system — would be straightforward.

---

## Contributing

If you would like to contribute, here is how:

1. Fork the repository
2. Create a new branch for your feature or fix: `git checkout -b feature/your-feature-name`
3. Commit your changes with a clear message: `git commit -m "Add: description of change"`
4. Push to your branch: `git push origin feature/your-feature-name`
5. Open a pull request and describe what you changed and why

Bug reports and feature suggestions are welcome through the Issues tab.

---

## License

This project is licensed under the MIT License. You are free to use, modify, and distribute it for personal or institutional purposes. See the `LICENSE` file for the full terms.
