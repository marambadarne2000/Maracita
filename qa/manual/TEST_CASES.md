# Manual Test Cases

| ID | Feature | Steps | Expected result | Status |
| --- | --- | --- | --- | --- |
| AUTH-01 | Sign up | Enter valid name, email and password; submit. | Account is created and onboarding opens. | Not run |
| AUTH-02 | Sign in | Enter valid email and password. | Private workspace opens. | Not run |
| AUTH-03 | Invalid sign in | Enter a valid email with an incorrect password. | Clear error appears; no workspace data is shown. | Not run |
| AUTH-04 | Password recovery | Request a reset link; open it; choose a new password. | Password updates and new credentials work. | Not run |
| AUTH-05 | Sign out | Select Sign out. | Session ends and private pages require sign-in. | Not run |
| SETUP-01 | Business setup | Add one team member and one service. | Both records appear in setup and scheduling. | Not run |
| CUST-01 | Customer search | Add a fictional customer; search by name, phone, email and ID. | The correct customer profile is returned. | Not run |
| SCHED-01 | Create appointment | Select customer, staff, service and available time. | Appointment is saved in the schedule. | Not run |
| SCHED-02 | Prevent overlap | Create a second appointment for the same staff member at an overlapping time. | System blocks the booking with a clear message. | Not run |
| FLOW-01 | Cancellation/waitlist | Cancel an appointment with a matching waitlist entry. | Smart Rescue creates a follow-up signal. | Not run |
| PAY-01 | Payment record | Record a payment for an appointment. | Payment and receipt record appear in customer history. | Not run |
| FEED-01 | Feedback | Complete a paid appointment and open the generated survey link. | Feedback is saved and appears in Feedback. | Not run |
| DATA-01 | Data export | Open My data and download export. | A JSON file downloads without passwords or session tokens. | Not run |
| QA-01 | Quality Lab | Open Quality check and run all checks. | Six runtime health checks show their results. | Not run |
