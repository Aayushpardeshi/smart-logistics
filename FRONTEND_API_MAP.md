# Frontend API Map

This document tracks how frontend pages and components map to the existing backend REST APIs and Socket.IO events.

## Auth Endpoints
| Frontend Page/Component | Method | Endpoint | Description |
|-------------------------|--------|----------|-------------|
| `Login.jsx` | POST | `/api/v1/auth/login` | Authenticates user, returns JWT and user role. |
| `Register.jsx` | POST | `/api/v1/auth/register` | Registers new user and auto-creates Driver/Business profiles. |

## Driver Endpoints
| Frontend Page/Component | Method | Endpoint | Description |
|-------------------------|--------|----------|-------------|
| `Profile.jsx` | GET | `/api/v1/driver/profile` | Fetches driver personal info and verification status. |
| `Profile.jsx` | PUT | `/api/v1/driver/profile` | Updates driver profile. |
| `VehicleManagement.jsx` | POST | `/api/v1/driver/trucks` | Adds a new truck to the driver's fleet. |
| `VehicleManagement.jsx` | GET | `/api/v1/driver/trucks` | Lists all trucks for the driver. |
| `VehicleManagement.jsx` | PUT | `/api/v1/driver/trucks/:id` | Edits truck details. |
| `VehicleManagement.jsx` | DELETE | `/api/v1/driver/trucks/:id` | Removes a truck. |
| `DocumentVerification.jsx` | POST | `/api/v1/driver/verify-aadhaar` | Uploads Aadhaar Front & Back for OCR validation. |
| `DocumentVerification.jsx` | POST | `/api/v1/driver/trucks/:id/verify-rc` | Uploads Vehicle RC for OCR validation. |
| `DocumentVerification.jsx` | POST | `/api/v1/driver/trucks/:id/verify-puc` | Uploads Vehicle PUC for OCR validation. |
| `AvailableLoads.jsx` | GET | `/api/v1/driver/loads/open` | Searches and filters open loads in the marketplace. |
| `PlaceBidModal.jsx` | POST | `/api/v1/driver/loads/:loadId/bids` | Places a bid on a specific load. |
| `MyBids.jsx` | GET | `/api/v1/driver/bids` | Lists all bids placed by the driver. |
| `DriverDashboard.jsx` | GET | `/api/v1/driver/trips` | Fetches all trips (active, completed) assigned to the driver. |
| `TripDetails.jsx` | GET | `/api/v1/driver/trips/:id` | Fetches specific trip details (includes load & business data). |

## Business Endpoints
| Frontend Page/Component | Method | Endpoint | Description |
|-------------------------|--------|----------|-------------|
| `Profile.jsx` | GET | `/api/v1/business/profile` | Fetches business company profile. |
| `Profile.jsx` | PUT | `/api/v1/business/profile` | Updates business profile. |
| `CreateLoad.jsx` | POST | `/api/v1/business/loads` | Posts a new load requirement to the marketplace. |
| `MyLoads.jsx` | GET | `/api/v1/business/loads` | Lists all loads created by the business. |
| `MyLoads.jsx` | PUT | `/api/v1/business/loads/:id` | Updates a load (if open). |
| `MyLoads.jsx` | PUT | `/api/v1/business/loads/:id/cancel` | Cancels a load. |
| `BidComparison.jsx` | GET | `/api/v1/business/loads/:loadId/bids` | Lists all bids placed on a specific load. |
| `BidComparison.jsx` | PUT | `/api/v1/business/bids/:bidId/accept` | Accepts a bid, rejects others, marks load ASSIGNED, creates Trip. |
| `BidComparison.jsx` | PUT | `/api/v1/business/bids/:bidId/reject` | Rejects a specific bid. |
| `BusinessDashboard.jsx` | GET | `/api/v1/business/trips` | Fetches all trips associated with the business. |
| `TripDetails.jsx` | GET | `/api/v1/business/trips/:id` | Fetches specific trip details (includes driver details). |
| `TripHistoryMap.jsx` | GET | `/api/v1/business/trips/:id/history` | Fetches the full GPS coordinate history array for a trip. |

## Socket.IO Events (Tracking)
| Emitter | Event Name | Payload | Backend Action / Broadcast |
|---------|------------|---------|----------------------------|
| Driver | `driver:start_trip` | `{ tripId }` | Marks Trip `IN_TRANSIT`, joins driver to room, broadcasts `trip:started`. |
| Driver | `driver:location_update` | `{ tripId, lat, lng, speed... }` | Saves to MongoDB, broadcasts `location:update` to room (throttled). |
| Business | `business:join_trip_room` | `{ tripId }` | Authenticates business, joins room, returns `room:joined` with last location. |
| Business | `business:confirm_delivery`| `{ tripId }` | Marks Trip `DELIVERED`, broadcasts `trip:ended`, kills room, severs connections. |
