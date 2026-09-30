# FieldFix Documentation & SRS Deliverables

This directory contains system design artifacts and documentation for the **FieldFix** project.

## Directory Structure

```
docs/
├── diagrams/
│   ├── class_diagram.mdj             # StarUML Class Diagram source
│   ├── use_case_diagram.mdj          # StarUML Use Case Diagram source
│   ├── er_diagram.png                # Entity-Relationship Diagram (dbdiagram.io / Prisma Visualizer)
│   └── state_transition_diagram.png  # Job Status State-Transition Diagram (draw.io / Lucidchart)
└── srs/
    ├── SRS_Specification.md          # Software Requirements Specification (SRS)
    └── Appendix_B.md                 # SRS Appendix B: Database Schemas & Data Dictionary
```

## SRS Deliverables Status
- [x] **Prisma Database Schema**: Defined in [`backend/prisma/schema.prisma`](file:///c:/Users/USER/Desktop/SE_lab/FieldFix/backend/prisma/schema.prisma)
- [x] **Seed Data & Initial Users**: Implemented in [`backend/prisma/seed.ts`](file:///c:/Users/USER/Desktop/SE_lab/FieldFix/backend/prisma/seed.ts)
- [x] **ER Diagram & Data Dictionary**: Available in [`docs/ER_DIAGRAM.md`](file:///c:/Users/USER/Desktop/SE_lab/FieldFix/docs/ER_DIAGRAM.md)
- [x] **State Transition Lifecycle**: Available in [`docs/STATE_TRANSITION.md`](file:///c:/Users/USER/Desktop/SE_lab/FieldFix/docs/STATE_TRANSITION.md)
- [x] **Admin Dispatch UI & Subpages**: Implemented in `admin-dashboard/src/pages/` (Landing, Login, Register, Dispatch Board, Technicians, Booking Details, Analytics, Customer Portal)
