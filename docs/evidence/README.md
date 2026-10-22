# SCM Review 3 Evidence & Verification Guide

This directory provides the verification artifacts and documentation for the nine Software Configuration Management (SCM) functionalities required for **ISWE403L Review 3**.

---

## 📸 Evidence Screenshot Index

| Filename | SCM Module / Feature | SCM Concept Demonstrated |
|----------|----------------------|---------------------------|
| `01-dashboard.png` | Module 1 — Dashboard | Overall configuration health, live CI & CR metrics, overdue escalation alerts |
| `02-ci-registry.png` | Module 2 — CI Registry | Master CI repository, 10 core CIs matching Review 2 baseline, search & filters |
| `03-change-request-form.png` | Module 3 — CR Submission | Formal change proposal, classification (Minor/Major/Emergency), impact analysis |
| `04-ccb-approval-queue.png` | Module 4 — CCB Workspace | Queue deliberation, self-approval prevention, role enforcement |
| `05-version-history.png` | Module 5 — Version Lineage | Atomic version progression (`v1.0` → `v1.1` / `v2.0`), chronological timeline |
| `06-status-accounting.png` | Module 7 — Status Accounting | Category × status matrix, CSV export, print-ready formal report |
| `07-fca-checklist.png` | Module 8 — FCA Audit | Functional Configuration Audit checklist, requirements verification |
| `08-pca-baseline-comparison.png` | Module 6/8 — PCA Audit | Physical Configuration Audit baseline comparison, drift detection |
| `09-change-history.png` | Module 9 — Change Log | Append-only immutable event log, actor traceability |
| `10-role-permissions.png` | Module 10 — Users & Roles | Separation of duties (Developer vs CCB Member vs Chairperson) |
| `11-github-commits.png` | GitHub SCM Functionality 4 | Conventional commit messages linked to CR numbers |
| `12-github-pull-request.png` | GitHub SCM Functionality 5 | Pull Request review, CCB sign-off, merge workflow |
| `13-github-tags.png` | GitHub SCM Functionality 6 | Semantic baseline tags (`v1.0.0-review2`, `v1.1.0-review3`) |
| `14-github-issue-templates.png` | GitHub SCM Functionality 3 | GitHub Issue forms for Change Requests and Problem Reports |
| `15-github-actions.png` | GitHub SCM Functionality 7 | Automated CI workflow run passing all tests and builds |
| `16-github-branch-protection.png`| GitHub SCM Functionality 8 | Protected `main` branch rules, required reviews and status checks |
| `17-github-access.png` | GitHub SCM Functionality 1 | Collaborator permissions and access control |
| `18-deployed-website.png` | SCM Deployment | Live deployed URL: https://automotive-near-petersburg-contributions.trycloudflare.com |
| `19-live-demo-flow.png` | End-to-End Demo Flow | CR submission → CCB multi-step review → atomic version bump |
| `20-audit-report.png` | SCM Audit Release | Final FCA/PCA audit report printout |

---

## 🧪 Automated Test Verification

All 29 automated test cases pass covering authentication, role-based access, CI registry validation, CR submission, self-approval prevention, atomic version progression, Major CR 3-step reviews, notifications, and status accounting:

```
PASS tests/api.test.ts
  Authentication
    √ POST /api/auth/login — valid credentials return token (91 ms)
    √ POST /api/auth/login — wrong password returns 401 (82 ms)
    √ GET /api/auth/me — returns current user (8 ms)
    √ GET /api/auth/me — no token returns 401 (5 ms)
  CI Registry
    √ GET /api/ci — returns list (6 ms)
    √ POST /api/ci — creates CI with unique ID (9 ms)
    √ POST /api/ci — duplicate ID returns 409 (7 ms)
    √ POST /api/ci — viewer cannot create CI (85 ms)
  Change Requests
    √ POST /api/cr — creates Minor CR (10 ms)
    Approval — Self-approval prevention
      √ Developer cannot approve own CR (6 ms)
    Approval — Minor CR approval
      √ Chairperson approves Minor CR → CI version increments (12 ms)
      √ Approved CR does not increment again (idempotency) (4 ms)
    Approval — Rejection without version increment
      √ Create another CR to reject (8 ms)
      √ Reject CR → CI version stays at v1.1 (13 ms)
    Approval — Major CR 3-step process
      √ Setup: create a fresh CI for Major CR test (6 ms)
      √ Create Major CR (8 ms)
      √ Step 1 — Technical review (not final yet) (7 ms)
      √ Step 2 — Quality review (not final yet) (6 ms)
      √ Step 3 — Chair decision → final approval, version = v2.0 (8 ms)
  Version computation
    √ Minor: v1.0 → v1.1 (1 ms)
    √ Minor: v1.9 → v1.10
    √ Major: v1.0 → v2.0
    √ Major: v2.5 → v3.0
    √ Emergency: v1.0 → v1.1 (treated as Minor) (1 ms)
  Role enforcement
    √ Viewer cannot create CR (84 ms)
    √ Developer cannot access approval queue (5 ms)
    √ CCB member can access approval queue (4 ms)
  Notifications
    √ GET /api/notifications — returns user notifications (4 ms)
  Status Accounting
    √ GET /api/status — returns CI and CR summaries (7 ms)

Test Suites: 1 passed, 1 total
Tests:       29 passed, 29 total
Snapshots:   0 total
Time:        4.238 s
```
