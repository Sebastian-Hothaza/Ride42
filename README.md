# Ride42 Trackday Management System

Ride42 is a full-stack platform for managing trackday events, riders, motorcycles, and payments. It streamlines operations for trackday organizers and provides a seamless experience for participants.  

▶️ [Try the live demo](https://demo.ride42.ca)  
▶️ [Technical Demo Video](https://youtu.be/TEF-p22az1A)

---

## Key Features

- **Full-Stack Functionality:** Manage users, trackdays, motorcycles, payments, and check-ins end-to-end.
- **Secure Authentication:** Password hashing with BCrypt and JWT-based access and refresh tokens for secure sessions.
- **Automated Payment Workflows:** Stripe integration and automated E-Transfer processing simplify transactions.
- **Automated Emails:** Automated notifications and reminders for participants.
- **QR Code Check-in:** Generate and assign QR codes to riders and their motorcycles for easy management and verification on event day.
- **Comprehensive CRUD Support:** Create, read, update, and delete users, trackdays, motorcycles, costs, and more.
- **Reliable Data Handling:** All dates stored in UTC, with backend validation and detailed logging.

---

## Technical Stack

- **Backend:** Node.js, Express, MongoDB, JWT, BCrypt
- **Frontend:** React
- **DevOps:** Docker, NGINX, Jest testing framework, CI/CD workflows
- **Payments:** Stripe API and automated E-Transfer processing
- **Other:** QR code generation and automated check-in system

---

## Architecture

Ride42 consists of:

1. **API Server:** Handles authentication, CRUD operations, business logic, and payments.
2. **React App:** Provides a user-friendly interface for participants and administrators.
3. **Database:** MongoDB stores all users, trackdays, motorcycles, payments, and logs.
4. **Automation & QR System:** Manages check-ins, QR assignments, and workflow automation.

---

## API Documentation

Detailed API usage, endpoints, and request examples are documented in the [Ride42 API README](./api/README.md).

---
