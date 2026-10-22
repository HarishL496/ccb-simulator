# CCB Control Center — Configuration Management Simulator

**Course:** ISWE403L — Software Configuration Management  
**Institution:** Vellore Institute of Technology (VIT)  
**Project Title:** Change Request Approval Board (CCB) Simulator with Configuration Item Registry  
**Author / GitHub:** [HarishL496](https://github.com/HarishL496)  
**Target Repository:** [https://github.com/HarishL496/ccb-simulator](https://github.com/HarishL496/ccb-simulator)  
**Public Live Deployment:** [https://fri-burlington-disclaimer-carry.trycloudflare.com](https://fri-burlington-disclaimer-carry.trycloudflare.com)  
**Standard Compliance:** IEEE 828 SCM Standard & SWEBOK Configuration Management Knowledge Area  

---

## 🏛️ System Architecture

```
ccb-simulator/
├── frontend/                 # React 18 + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── api/             # REST API Client with JWT Auth
│   │   ├── components/      # Sidebar, Header, Modals, StatusBadges
│   │   ├── hooks/           # useAuth context & state
│   │   ├── pages/           # 12 SCM Modules (Dashboard, CIRegistry, Approvals...)
│   │   └── types/           # SCM Data Models & Enums
│   └── vite.config.ts       # Proxy configuration to :4000 backend
├── backend/                  # Node.js + Express + TypeScript + SQLite
│   ├── src/
│   │   ├── db/              # Database schema, migrations, seed, better-sqlite3
│   │   ├── middleware/      # JWT Authentication & Role-Based Access Control
│   │   ├── models/          # SCM Entity Definitions
│   │   ├── routes/          # REST Endpoints (/ci, /cr, /approvals, /baselines...)
│   │   └── utils/           # Atomic version increment & SLA calculations
│   └── tests/               # Automated Jest & Supertest test suite (29 tests)
├── .github/
│   ├── workflows/ci.yml     # Automated CI pipeline for lint, test, and build
│   └── ISSUE_TEMPLATE/      # Formal Change Request (CR) and Problem Report (PR) templates
└── docs/
    └── evidence/            # SCM Review 3 9-Functionality Evidence Matrix & reports
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- Git (v2.40+)

### 1. Backend Setup
```bash
cd backend
npm install
npm run seed       # Seeds 10 CIs, 8 users, Review 2 baseline BL-001, and sample CRs
npm run dev        # Starts Express API at http://localhost:4000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev        # Starts Vite React application at http://localhost:5173
```

### 3. Run Automated Tests
```bash
cd backend
npm test           # Runs all 29 automated Jest & Supertest API tests
```

---

## 📋 Evaluation Personas & Credentials

The system implements Role-Based Access Control (RBAC) with strict separation of duties:

| Role | Username | Password | Responsibilities |
|------|----------|----------|-------------------|
| **Admin** | `admin` | `Admin@123` | Full administrative control, user provisioning |
| **Chairperson** | `chairperson` | `Chair@123` | Final CCB sign-off, emergency CR decisions, baseline freezing |
| **CCB Tech Reviewer** | `ccb_tech` | `CCB1@123` | Technical feasibility analysis (Step 1 of Major CRs) |
| **CCB Quality Reviewer** | `ccb_quality` | `CCB2@123` | Quality & regression risk evaluation (Step 2 of Major CRs) |
| **Developer (Member A)** | `member_a` | `DevA@123` | Proposes Change Requests, modifies assigned CIs |
| **Developer (Member B)** | `member_b` | `DevB@123` | Proposes Change Requests, modifies assigned CIs |
| **Developer (Member C)** | `member_c` | `DevC@123` | Proposes Change Requests, modifies assigned CIs |
| **Viewer / Auditor** | `viewer` | `Viewer@123` | Read-only audit access for FCA/PCA and status accounting |

*(Note: The top header includes a 1-click **Role Switcher** for instant persona switching during evaluation).*

---

## 📊 Review 2 Baseline Configuration Items (Seed Match)

Initial status accounting strictly mirrors Review 2 specification: **10 Total CIs — 5 Approved, 4 In Progress, 1 Pending**:

| # | CI ID | Configuration Item Name | Owner | Lifecycle Status | Approval Status | Current Version |
|---|-------|-------------------------|-------|------------------|-----------------|-----------------|
| 1 | `CI-001` | Requirements Document | Member A | Complete | Approved | `v1.0` |
| 2 | `CI-002` | Design (ER Diagram / UI Wireframes) | Member A | Complete | Approved | `v1.0` |
| 3 | `CI-003` | Source Code — CI Registry Module | Member A | In Progress | Not Approved | `v1.0` |
| 4 | `CI-004` | Source Code — Change Request Module | Member B | In Progress | Not Approved | `v1.0` |
| 5 | `CI-005` | Source Code — CCB Approval Module | Member B | In Progress | Not Approved | `v1.0` |
| 6 | `CI-006` | Database (CI / CR Schema) | Member C | Complete | Approved | `v1.0` |
| 7 | `CI-007` | Test Cases | Member C | In Progress | Not Approved | `v1.0` |
| 8 | `CI-008` | User Manual | Member A | Pending | Not Approved | `v1.0` |
| 9 | `CI-009` | Project Report | Member B | Complete | Approved | `v1.0` |
| 10 | `CI-010` | Version History Log | Member C | Complete | Approved | `v1.0` |

---

## 🎯 Review 3 — Nine SCM Functionalities Matrix

| # | SCM Functionality | Implementation in CCB Simulator | Verification Evidence |
|---|-------------------|----------------------------------|------------------------|
| **1** | **Repository Structure & SCM Configuration** | Full-stack monorepo with Express backend, Vite React frontend, SQLite persistence, and docs | Root repo structure, `package.json`, database schemas |
| **2** | **Branching Strategy & Workflows** | Feature branch workflow (`main`, `develop`, `feature/*`) | Git branch model, protected `main` branch |
| **3** | **Formal Change Requests & Issue Tracking** | Structured GitHub Issue templates for CR and Problem Reports (PR) matching CCB schema | `.github/ISSUE_TEMPLATE/change-request.yml`, `problem-report.yml` |
| **4** | **Commit Traceability & Conventional Messages** | Standardized commits (`feat`, `fix`, `docs`, `test`, `refactor`) linked to CRs | `git log`, conventional commit history |
| **5** | **Pull Requests & Peer Review Approval** | Multi-party PR review workflow with required CCB approvals before merge | Pull requests on GitHub, approval audit trail |
| **6** | **Milestone Baselines & Release Tagging** | Semantic version tags marking official baseline releases (`v1.0.0-review2`, `v1.1.0-review3`) | Git release tags, `baselines` and `baseline_items` tables |
| **7** | **Automated CI/CD Pipeline** | GitHub Actions workflow executing lint, TypeScript type-check, Jest unit tests, and build | `.github/workflows/ci.yml`, automated test runner |
| **8** | **Branch Protection & Governance Policies** | Enforced reviews, status checks required before merge, self-approval prevention | GitHub branch protection rules, API middleware |
| **9** | **Configuration Status Accounting & SCM Audits** | Real-time CSA matrix by category, CSV exports, and Functional & Physical Audits (FCA/PCA) | Module 7 (Status Accounting), Module 8 (Audit Centre) |

---

## 🛡️ CCB Deliberation Rules & Policies

1. **Self-Approval Prevention:** Requesters are strictly prohibited by API-enforced rules from approving or rejecting their own Change Requests.
2. **Minor Changes (SLA <24h):** Evaluated and decided by any single CCB member. On approval, atomically increments the minor version (`v1.0` → `v1.1`).
3. **Major Changes (SLA <48h):** Enforces a mandatory 3-step review sequence:
   - Step 1: Technical Review by `ccb_tech`
   - Step 2: Quality Review by `ccb_quality`
   - Step 3: Executive Decision by `chairperson`
   - On approval, atomically increments the major version (`v1.0` → `v2.0`).
4. **Emergency Changes (SLA <4h):** Decided immediately by the `chairperson`. Atomically increments version and flags the change for post-incident review at the next formal board meeting.
5. **Mandatory Explanation:** Every approval, rejection, or deferral requires a written technical rationale (minimum 10 characters) preserved permanently in the audit history.
