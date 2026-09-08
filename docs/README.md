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

## SRS Appendix B Status
- [x] **Prisma Database Schema**: Defined in [`backend/prisma/schema.prisma`](file:///c:/Users/USER/Desktop/SE_lab/FieldFix/backend/prisma/schema.prisma)
- [ ] **ER Diagram Visualizer**: Export pending from dbdiagram.io / Prisma visualizer into `docs/diagrams/er_diagram.png`
- [ ] **State Transition Diagram**: Draft state-transition diagram for job status lifecycle (`PENDING` -> `ACCEPTED` -> `DISPATCHED` -> `IN_PROGRESS` -> `COMPLETED` / `CANCELLED`)
