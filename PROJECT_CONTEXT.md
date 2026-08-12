# Smart Logistics Platform

## Project Vision
A full-stack logistics marketplace designed around return-load optimization. Businesses post load requirements, and truck drivers discover loads and place competitive bids. Includes real-time GPS tracking and AI-powered driver document verification.

## Architecture
- Frontend: React (Vite) + Tailwind CSS + Leaflet
- Backend: Node.js (Express) + MongoDB
- Microservice: FastAPI (Python) for OCR
- Real-time: Socket.IO

## Tech Stack
React, Node.js, Express, MongoDB, Mongoose, Socket.IO, Python, FastAPI, Tesseract OCR.

## Repository Structure
- `/smart-logistics-frontend` - React Frontend
- `/smart-logistics-backend` - Node.js Backend
- `/doc_verify_service` - FastAPI Python OCR Service

## User Roles
- Business Owner
- Truck Driver
- Admin

## Authentication
JWT-based authentication with bcryptjs for password hashing. RBAC middleware for role protection.

## Marketplace Workflow
Business Creates Load -> Driver Browses Loads -> Driver Places Bid -> Business Accepts Bid -> Trip Created -> Trip Tracked -> Trip Completed.

## Load Model
*COMPLETED* - `Load` schema created.

## Bid Model
*COMPLETED* - `Bid` schema created.

## Trip Model
*COMPLETED* - `Trip` schema created and integrated into sockets.

## GPS Tracking
*PARTIALLY IMPLEMENTED* - `locationSocket.js` uses new `Trip` model.

## OCR Microservice
*PARTIALLY IMPLEMENTED* - Endpoints exist for DL, Aadhaar, and RC. Missing PUC, Insurance, and Permit.

## Supported Documents
DL, Aadhaar, RC (Implemented).
PUC, Insurance, Permit (Missing).

## OCR Pipeline
Tesseract OCR with custom normalizations for extracting text and validating document fields.

## API Endpoints
Backend:
- `/api/v1/auth/*`
- `/api/v1/business/*` (Shipment endpoints refactored to Load)
- `/api/v1/driver/*`

FastAPI:
- `/api/v1/documents/verify*` (DL, Aadhaar, RC)

## Database Models
Current: `User`, `DriverProfile`, `BusinessProfile`, `Truck`, `LocationHistory`, `Load`, `Bid`, `Trip`, `Document`.
Missing: None currently identified.

## Socket.IO Events
Current: `join-trip`, `send-location`, `receive-location`, `trip-status-update`.

## Environment Variables
- `MONGO_URI`, `JWT_SECRET`, `PORT` (Backend)
- `TESSERACT_PATH`, `ENVIRONMENT` (FastAPI)

## Docker Architecture
*MISSING* - Dockerfile exists in FastAPI but no compose or backend/frontend Dockerfiles.

## Security
Basic JWT and bcrypt in place. Missing robust role checks for some advanced actions.

## Known Issues
- Missing Admin features entirely.

## Completed Features
- Full User Registration & Login with JWT & RBAC (Driver, Business, Admin).
- Mapped User registration credentials (`name`, `email`, `phone`) with `DriverProfile` / `BusinessProfile` in MongoDB.
- Driver Profile Document Vault & Fullscreen Image Lightbox Modal for inspecting uploaded document photos.
- Complete Load Marketplace with posting, bidding, bid acceptance, bid rejection, and load lifecycle management.
- Real-time GPS location tracking with Socket.IO throttled at 45 seconds for MongoDB optimization.
- Custom Delivery Confirmation modal on tracking page and synchronized status update (`ASSIGNED` -> `IN_TRANSIT` -> `DELIVERED`).
- Full OCR document extraction & verification for DL, Aadhaar, RC, PUC, Insurance, and Permit using EasyOCR / Tesseract pipeline with dynamic rotation handling.
- In-Database MongoDB Base64 Data URL document storage (`DocumentStore`) with Multer `memoryStorage()` (zero local uploads disk persistence) and SHA-256 de-duplication.
- 2-Page Document Verification UI flow (Primary: DL, Aadhaar & RC; Page 2: PUC, Insurance & Permit).
- Inline Fleet Vehicle Registration Modal in `DocumentVerification.jsx` (eliminates external routing to `/profile`).
- Replaced all native browser `alert()` popups with global `react-toastify` notifications.

## Pending Features
- Dockerization (Dockerfiles & docker-compose.yml for microservices).
- Unit & Integration Test Suites (Phase 11).

## Current Task
Phase 6: Admin Dashboard & System Finalization

## Last Completed Task
Updated Driver Document Verification (Added Delete Truck, simplified complex document uploads to skip OCR).

## Next Recommended Task
Admin Dashboard Implementation.

## Important Technical Decisions
- Use `Load`, `Bid`, `Trip` as separate collections to support 1:N relations for bidding.
- Keep OCR in FastAPI separate from Node backend.

## Things NOT To Change
- The general technology stack.
- The use of Tesseract for lightweight OCR (do not replace with heavy ML models).
