# FieldFix — Service Booking State Transition Diagram

This document models the lifecycle of a FieldFix service ticket from creation to completion or cancellation.

---

## 🔄 State Transition Diagram (Mermaid)

```mermaid
stateDiagram-v2
    [*] --> PENDING : Customer books service

    state PENDING {
        [*] --> AwaitingDispatcher
        AwaitingDispatcher --> MatchFound : Auto/Manual Match
    }

    PENDING --> CANCELLED : Customer cancels before dispatch
    PENDING --> ACCEPTED : Technician accepts job

    state ACCEPTED {
        [*] --> Preparation
        Preparation --> ReadyForRoute : Tech ready
    }

    ACCEPTED --> DISPATCHED : Tech starts travelling (Live GPS on)
    ACCEPTED --> PENDING : Tech rejects / Reassign required

    state DISPATCHED {
        [*] --> EnRoute
        EnRoute --> ArrivedAtSite : Proximity alert (<50m)
    }

    DISPATCHED --> CANCELLED : Emergency cancel (Refund policy applied)
    DISPATCHED --> IN_PROGRESS : Tech arrives & starts diagnostic / repair

    state IN_PROGRESS {
        [*] --> Inspection
        Inspection --> Repairing
        Repairing --> QualityCheck
    }

    IN_PROGRESS --> COMPLETED : Customer signature & invoice settled
    IN_PROGRESS --> CANCELLED : Unserviceable / Dispute

    COMPLETED --> [*] : Review & Feedback submitted
    CANCELLED --> [*] : Ticket archived & logs updated
```

---

## 📋 State Descriptions & Triggers

| State | Trigger | Actor | Actions & Events |
| :--- | :--- | :--- | :--- |
| **`PENDING`** | Customer submits booking on Web/Mobile | Customer | Payment pre-auth, broadcast job alert to eligible technicians in radius. |
| **`ACCEPTED`** | Technician clicks "Accept Job" | Technician | Job locked to technician, SMS/push notification sent to customer. |
| **`DISPATCHED`** | Technician taps "Start Trip" | Technician | Socket.IO live GPS stream begins; customer radar view updates with live ETA. |
| **`IN_PROGRESS`** | Technician arrives and starts work | Technician | Timer starts; parts and repair checklist activated. |
| **`COMPLETED`** | Technician finishes repair + OTP/Signature | Both | Payment captured, digital invoice generated, rating modal displayed. |
| **`CANCELLED`** | Booking aborted by customer or admin | Customer / Admin | Refund triggered, technician status set back to available. |
