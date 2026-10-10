# 🚀 ApexBuild Platform

<p align="center">
  <img src="https://img.shields.io/badge/Status-In%20Development-blue" alt="Status" />
  <img src="https://img.shields.io/badge/Version-1.0.0-green" alt="Version" />
  <img src="https://img.shields.io/badge/License-Proprietary-red" alt="License" />
</p>

ApexBuild Platform is a unified, multi-tenant Business Operating System (OS) designed to power entirely distinct industry verticals from a single, centralized backend infrastructure. 

Instead of building disjointed apps for different industries, ApexBuild uses a **Super Admin Control Plane** to provision and route specific business types into their respective, highly customized Operating Systems.

---

## 🏗️ The Operating Systems

ApexBuild currently powers four distinct OS products, deeply tailored for their specific industries:

### 1. 🏗️ Contractor OS
A complete enterprise management system for construction contractors.
- **Features:** Project Management, Bill of Quantities (BOQ), Labour & Material tracking, RA Billing, Site Reports, and Measurements.

### 2. 📦 Supplier OS
A B2B marketplace and full ERP for building material suppliers.
- **Features:** Delivery logistics, Quotation/Invoice generation, Vendor & Purchase Management, Real-time Inventory Ledger.

### 3. 🔬 Diagnostics OS
An advanced Laboratory Information System (LIS) for pathology labs and diagnostic centers.
- **Features:** Patient Management, Test/Sample workflows, PDF Report generation, Inventory tracking, Home Collection logistics.

### 4. 🚚 Distributor OS
Logistics and supply chain management engineered for specialized distributors (e.g., Chicken Distributors).
- **Features:** Fleet & Vehicle tracking, Driver management, Live stock movement, Route estimations, Complex pricing logic.

### 👑 Super Admin Platform (The Control Plane)
The underlying architecture that manages the entire ApexBuild ecosystem.
- **Features:** Tenant (Business Account) creation, OS Product & Plan pricing setup, Subscription allocation, God-View Analytics, Master Data Management (MDM), and cross-tenant billing.

---

## 🛠️ Technology Stack

ApexBuild is built with modern, scalable web technologies to handle complex B2B workflows and high data volumes.

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS 4, PostCSS
- **Routing:** React Router v7
- **Data Visualization:** Recharts
- **Icons:** Lucide React
- **Document Generation:** html2canvas, jsPDF

### Backend
- **Framework:** Node.js, Express.js
- **Database:** MongoDB via Mongoose
- **Authentication:** JWT (JSON Web Tokens), bcryptjs
- **Security:** Helmet, Express Validator, CORS

---

## 🔐 Architecture & Multi-Tenancy

ApexBuild employs a rigorous **Multi-Tenant Architecture**:
1. **Organizations (Tenants):** Every business on the platform belongs to an `Organization` with a specific `businessType`.
2. **Subscriptions:** Organizations hold active `Subscriptions` to an `OSPlan` and `OSProduct`.
3. **Data Isolation:** All core data queries are strictly scoped to the `req.user.organizationId` via backend middlewares.
4. **Dynamic Routing:** Upon login, the platform identifies the user's business type and active subscription, dynamically routing them to their authorized OS environment without seeing cross-pollinated features.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (Local instance or MongoDB Atlas)

### 1. Backend Setup
```bash
cd backend
npm install

# Configure your environment variables
cp .env.example .env 
# (Ensure MONGO_URI, JWT_SECRET, and PORT are set)

# Run the development server
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install

# Run the Vite development server
npm run dev
```

### 3. Database Seeding (Optional)
To quickly bootstrap the OS products into the database:
```bash
cd backend
node seedOSProducts.js
```

---

## 📁 Directory Structure

```text
apexbuild-platform/
├── backend/                  # Node.js Express API
│   ├── src/
│   │   ├── controllers/      # Business logic per OS & SuperAdmin
│   │   ├── middlewares/      # Auth & Tenant isolation logic
│   │   ├── models/           # Mongoose schemas (70+ models)
│   │   ├── routes/           # API Endpoints per OS
│   │   └── server.js         # Entry point
│   └── seedOSProducts.js     # DB Seeding script
│
├── frontend/                 # React Application
│   ├── src/
│   │   ├── components/       # Reusable UI elements
│   │   ├── context/          # React Context (Auth)
│   │   └── pages/            # OS-specific UI views
│   │       ├── diagnostics/
│   │       ├── distributor/
│   │       ├── superadmin/
│   │       ├── supplier/
│   │       └── (Contractor pages directly in /pages)
│   ├── package.json
│   └── tailwind.config.js
│
└── *.md                      # Documentation & Feature Matrices
```

---

## 📄 License
This project is proprietary and confidential. Unauthorized copying, distribution, or use of this source code is strictly prohibited.
