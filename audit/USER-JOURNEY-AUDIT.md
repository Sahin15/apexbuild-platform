# ApexBuild User Journey Audit

## Persona: OWNER / ADMIN
**Goal:** Log in, view company financial health, and add a new project.
**Current State:** 
1. The user goes to `/login` and clicks the button. It works visually but authenticates no one (mock).
2. The user sees the Dashboard. The metrics (`₹2.4 Cr` etc.) are hardcoded and do not reflect real DB data.
3. The user goes to Projects and clicks "Add Project". They fill the modal and click "Save". The modal closes but the project is not saved to the DB, and does not appear on refresh.
**Status:** **BROKEN (Needs API Integration)**

## Persona: PROJECT MANAGER
**Goal:** Create a BOQ for a newly assigned project.
**Current State:**
1. User navigates to a project detail page.
2. User clicks the "BOQ" tab.
3. User clicks "Add Item", fills out Earthwork details, and submits.
4. The item disappears into the void (no API call is made, BOQ is not updated).
**Status:** **BROKEN (Needs API Integration)**

## Persona: SITE ENGINEER
**Goal:** Submit a Daily Progress Report (DPR).
**Current State:**
1. User clicks "Site Reports".
2. UI is visible, but the "New Report" modal form (if it existed) or the data currently shown is strictly hardcoded. Submitting anything has no effect.
**Status:** **BROKEN (Needs Backend & Integration)**

## Conclusion
The frontend UI is beautiful but acts as an interactive prototype. The user journeys cannot be completed because State Management (React Context/Redux) and API calls (Axios) are completely absent.
