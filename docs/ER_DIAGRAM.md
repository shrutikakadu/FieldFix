# FieldFix — Entity-Relationship (ER) Diagram

This document contains the complete database entity design for the **FieldFix** platform, matching the Prisma schema ([`schema.prisma`](file:///c:/Users/USER/Desktop/SE_lab/FieldFix/backend/prisma/schema.prisma)).

## 📊 Visual Mermaid ER Diagram

```mermaid
erDiagram
    USER ||--o| TECHNICIAN_PROFILE : "has profile (1:1)"
    USER ||--o{ BOOKING : "places as customer (1:N)"
    USER ||--o{ BOOKING : "assigned as tech (1:N)"
    USER ||--o{ REVIEW : "gives reviews (1:N)"
    USER ||--o{ REVIEW : "receives reviews (1:N)"
    
    SERVICE_CATEGORY ||--o{ BOOKING : "categorizes (1:N)"
    BOOKING ||--o| PAYMENT : "has transaction (1:1)"
    BOOKING ||--o| REVIEW : "has review (1:1)"

    USER {
        string id PK "UUID"
        string email UK "Unique Email Address"
        string phone "Phone Number"
        string passwordHash "Bcrypt Encrypted Hash"
        string name "Full Name"
        string role "CUSTOMER | TECHNICIAN | ADMIN"
        string avatarUrl "Profile image link"
        datetime createdAt "Timestamp"
        datetime updatedAt "Timestamp"
    }

    TECHNICIAN_PROFILE {
        string id PK "UUID"
        string userId FK "Foreign Key -> User.id"
        string skills "JSON Array of Skill Strings"
        boolean isAvailable "Online status toggle"
        float currentLat "Live GPS Latitude"
        float currentLng "Live GPS Longitude"
        float rating "Aggregated Star Rating (1.0-5.0)"
        int totalJobs "Total completed jobs count"
    }

    SERVICE_CATEGORY {
        string id PK "UUID"
        string name UK "HVAC, Plumbing, Electrical, etc."
        string description "Category info"
        string icon "Visual icon string"
        float basePrice "Standard base pricing"
    }

    BOOKING {
        string id PK "UUID (e.g. BK-9021)"
        string customerId FK "Foreign Key -> User.id"
        string technicianId FK "Foreign Key -> User.id (Nullable)"
        string categoryId FK "Foreign Key -> ServiceCategory.id"
        string status "PENDING | ACCEPTED | DISPATCHED | IN_PROGRESS | COMPLETED | CANCELLED"
        string address "Customer service address"
        float latitude "Service destination Lat"
        float longitude "Service destination Lng"
        datetime scheduledAt "Scheduled service time"
        float totalAmount "Total job fee in INR"
        datetime createdAt "Creation Timestamp"
        datetime updatedAt "Last updated"
    }

    PAYMENT {
        string id PK "UUID"
        string bookingId FK "Foreign Key -> Booking.id"
        float amount "Transaction amount"
        string provider "Razorpay | Stripe | UPI"
        string transactionId UK "Unique Gateway TXN Ref"
        string status "PENDING | PAID | REFUNDED | FAILED"
        datetime createdAt "Payment timestamp"
    }

    REVIEW {
        string id PK "UUID"
        string bookingId FK "Foreign Key -> Booking.id"
        string reviewerId FK "User who wrote review"
        string targetId FK "User being reviewed"
        int rating "1 to 5 Stars"
        string comment "Feedback remarks text"
        datetime createdAt "Review submission time"
    }
```

---

## 🗄️ Relational Integrity & Key Constraints

1. **User Table (`users`)**:
   - `email` is enforced UNIQUE.
   - Roles are string-validated (`CUSTOMER`, `TECHNICIAN`, `ADMIN`).
2. **Technician Profile (`technician_profiles`)**:
   - `userId` has `onDelete: Cascade` to automatically remove profile on user deletion.
3. **Booking Table (`bookings`)**:
   - `customerId` links to the requesting Customer User.
   - `technicianId` is nullable (assigned during auto-dispatch or manual admin allocation).
4. **Payment Table (`payments`)**:
   - 1-to-1 relationship with `Booking`.
   - `transactionId` enforced UNIQUE to prevent double charges.
5. **Review Table (`reviews`)**:
   - 1-to-1 relationship with `Booking` with ratings from 1 to 5.
