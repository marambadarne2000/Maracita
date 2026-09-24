# Maracita Manual QA Test Plan

## Objective

Verify the main appointment-management workflow from account access through customer follow-up.

## Scope

- Registration, sign-in, sign-out and password recovery
- Business setup, customers, services and staff
- Appointments, overlap prevention and status changes
- Payments, receipts, feedback and analytics
- Data export and access control

## Test environment

| Field | Value |
| --- | --- |
| Product | Maracita Cloud |
| Test type | Manual functional testing |
| Browser | Chrome, latest stable |
| Base URL | `https://maracita.awadi-mar34.workers.dev` |
| Test data | Fictional customers only |

## Entry criteria

- The application loads successfully.
- A QA test account and a fictional business workspace are available.

## Exit criteria

- Every test case in `TEST_CASES.md` has a recorded result.
- Any blocking defect has a bug report.
