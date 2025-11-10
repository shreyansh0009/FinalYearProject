# 🔐 Decentralized Automated Document Verification System

[![Ethereum](https://img.shields.io/badge/Blockchain-Ethereum-3C3C3D?style=for-the-badge&logo=ethereum)](https://ethereum.org/)
[![Solidity](https://img.shields.io/badge/Smart_Contract-Solidity-363636?style=for-the-badge&logo=solidity)](https://soliditylang.org/)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)

> **A blockchain-powered document verification system that combats fraud and ensures authenticity through decentralized, tamper-proof credential management.**

This repository contains a full-stack decentralized application (dApp) designed to revolutionize document verification by leveraging blockchain technology. The system provides a trustless, automated, and immutable method for issuing, managing, and verifying official documents, creating a secure and transparent ecosystem for educational institutions, government agencies, and organizations.

---

## 📋 Table of Contents

- [🎯 Problem Statement](#-problem-statement)
- [✨ Solution](#-solution)
- [🚀 Key Features](#-key-features)
- [🏗️ System Architecture](#️-system-architecture)
- [⚙️ Technology Stack](#️-technology-stack)
- [📁 Project Structure](#-project-structure)
- [🔧 Installation & Setup](#-installation--setup)
- [👥 User Roles & Permissions](#-user-roles--permissions)
- [📊 Database Schema](#-database-schema)
- [� Smart Contract](#-smart-contract)
- [🎨 UI Screenshots](#-ui-screenshots)
- [🔒 Security Features](#-security-features)
- [🚦 API Endpoints](#-api-endpoints)
- [🧪 Testing](#-testing)
- [📝 Future Enhancements](#-future-enhancements)
- [👨‍💻 Contributors](#-contributors)
- [📄 License](#-license)

---

## 🎯 Problem Statement

In today's digital age, document fraud remains a critical challenge:

- **🚨 Widespread Fraud**: Fake degrees, certificates, and credentials are increasingly common
- **⏱️ Time-Consuming Verification**: Manual verification processes take days or weeks
- **💰 High Costs**: Traditional verification requires significant resources and manpower
- **🔍 Lack of Transparency**: No unified system to track document authenticity
- **📄 Centralized Risks**: Single points of failure and potential data manipulation

---

## ✨ Solution

Our decentralized document verification system provides:

✅ **Blockchain Immutability** - Documents stored on Ethereum blockchain cannot be altered or forged  
✅ **Instant Verification** - Verify document authenticity in seconds, not days  
✅ **Zero Trust Required** - Cryptographic proof eliminates need for trusted third parties  
✅ **Complete Transparency** - Full audit trail of all document operations  
✅ **Cost Effective** - Automated processes reduce verification costs by up to 90%  
✅ **Global Accessibility** - Verify documents from anywhere in the world  

---

## 🚀 Key Features

### 🔐 Core Functionality

- **Document Issuance**: Secure upload and blockchain registration of documents
- **SHA-256 Hashing**: Cryptographic document fingerprinting
- **Smart Contract Integration**: Automated verification via Ethereum smart contracts
- **Role-Based Access Control (RBAC)**: Admin, Issuer, and Student roles
- **Real-time Status Tracking**: PENDING → ISSUED → VERIFIED workflow
- **Document Rejection**: Issuers can reject invalid documents with reasons

### 💼 Role-Specific Features

#### 👨‍💼 Admin Dashboard
- Department management (Create, View, Manage)
- Issuer registration and Ethereum address linking
- User management (View all students, issuers)
- System-wide document overview with complete audit trail
- Comprehensive analytics and reporting

#### 👩‍🏫 Issuer Dashboard
- Pending document approval queue
- Department-wide student overview
- Individual student document tracking
- Document approval/rejection with blockchain recording
- "My Students" - Track registered students and their documents

#### 👨‍🎓 Student Dashboard
- Secure document upload with file validation
- Document status tracking (Pending/Issued/Rejected)
- Personal document library
- Download issued certificates
- Real-time notifications

### 🔒 Security Features

- **JWT Authentication**: Secure access and refresh token mechanism
- **HTTP-Only Cookies**: Protection against XSS attacks
- **bcrypt Password Hashing**: 15-round salted password encryption
- **Ethereum Address Validation**: Blockchain identity verification
- **Multer File Upload Security**: File type and size validation
- **MongoDB Injection Prevention**: Parameterized queries via Mongoose

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            |
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           |
│  │    Admin     │  │    Issuer    │  │   Student    │           |
│  │  Dashboard   │  │  Dashboard   │  │  Dashboard   │           |
│  └──────────────┘  └──────────────┘  └──────────────┘           |
│         │                  │                  │                 |
│         └──────────────────┴──────────────────┘                 |
│                         │                                       |
│                    React Router                                 |
│                    Axios Client                                 |
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │   API Gateway    │
                    │  (Express.js)    │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│  Authentication│  │   Controllers   │  │  Blockchain    │
│   Middleware   │  │   - User        │  │   Service      │
│   - verifyJWT  │  │   - Document    │  │  (ethers.js)   │
│   - isAdmin    │  │   - Department  │  │                │
│   - isIssuer   │  │                 │  │                │
└───────┬────────┘  └────────┬────────┘  └───────┬────────┘
        │                    │                    │
        │           ┌────────▼────────┐           │
        │           │   MongoDB       │           │
        │           │   Database      │           │
        │           │  - Users        │           │
        │           │  - Documents    │           │
        │           │  - Departments  │           │
        │           └─────────────────┘           │
        │                                         │
        └──────────────────┬──────────────────────┘
                           │
                  ┌────────▼────────┐
                  │  Ethereum       │
                  │  Blockchain     │
                  │  (Polygon Amoy) │
                  │  Smart Contract │
                  └─────────────────┘
```

---

## ⚙️ Technology Stack

### Frontend Technologies
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![React Router](https://img.shields.io/badge/React_Router_v7-CA4245?style=for-the-badge&logo=react-router&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)

### Backend Technologies
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js_v5-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB_v8-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongoose&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white)

### Blockchain Technologies
![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white)
![Solidity](https://img.shields.io/badge/Solidity_^0.8.20-363636?style=for-the-badge&logo=solidity&logoColor=white)
![Hardhat](https://img.shields.io/badge/Hardhat-FFF04D?style=for-the-badge&logo=hardhat&logoColor=black)
![Ethers.js](https://img.shields.io/badge/Ethers.js_v6-2535A0?style=for-the-badge&logo=ethereum&logoColor=white)

### Cloud & Storage
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

### Development Tools
![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)
![Nodemon](https://img.shields.io/badge/Nodemon-76D04B?style=for-the-badge&logo=nodemon&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)

### Network
- **Testnet**: Polygon Amoy Testnet
- **Contract Address**: `0xDBfd73aB895C94184Dcd8555327aE2b41D667c5D`

---

## 📁 Project Structure

```
FinalYearProject/
│
├── blockchain/                    # Smart Contract Layer
│   ├── contracts/
│   │   └── DocumentVerification.sol   # Main smart contract
│   ├── scripts/
│   │   └── deploy.js              # Deployment script
│   ├── test/                      # Contract tests
│   ├── hardhat.config.js          # Hardhat configuration
│   └── package.json
│
├── server/                        # Backend API
│   ├── src/
│   │   ├── controllers/           # Business logic
│   │   │   ├── user.controller.js
│   │   │   ├── document.controller.js
│   │   │   └── department.controller.js
│   │   ├── models/                # Database schemas
│   │   │   ├── user.model.js
│   │   │   ├── document.model.js
│   │   │   └── department.model.js
│   │   ├── routes/                # API endpoints
│   │   │   ├── user.routes.js
│   │   │   ├── document.route.js
│   │   │   └── department.route.js
│   │   ├── middlewares/           # Authentication & Authorization
│   │   │   └── auth.middleware.js
│   │   ├── utils/                 # Helper functions
│   │   │   ├── ethersService.js   # Blockchain integration
│   │   │   ├── fileUpload.js      # Cloudinary service
│   │   │   ├── asyncHandler.js
│   │   │   ├── apiError.js
│   │   │   └── apiResponse.js
│   │   ├── database/
│   │   │   └── connection.js      # MongoDB connection
│   │   ├── app.js                 # Express app setup
│   │   └── index.js               # Server entry point
│   └── package.json
│
├── client/                        # Frontend Application
│   ├── src/
│   │   ├── pages/                 # Page components
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── IssuerDashboard.jsx
│   │   │   └── StudentDashboard.jsx
│   │   ├── components/            # Reusable components
│   │   ├── context/               # React Context
│   │   │   └── AuthContext.jsx
│   │   ├── api/                   # API service layer
│   │   │   └── api.js
│   │   ├── assets/                # Static assets
│   │   ├── App.jsx                # Root component
│   │   ├── main.jsx               # Entry point
│   │   └── index.css              # Global styles
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── .env.example                   # Environment variables template
└── README.md                      # This file
```

---

## 🔧 Installation & Setup

### Prerequisites

Ensure you have the following installed:
- **Node.js** (v18+ recommended)
- **npm** or **yarn**
- **MongoDB** (or MongoDB Atlas account)
- **MetaMask** browser extension
- **Git**

### Step 1: Clone the Repository

```bash
git clone https://github.com/shreyansh0009/FinalYearProject.git
cd FinalYearProject
```

### Step 2: Setup Environment Variables

Create `.env` files in both `server` and `client` directories:

#### **Server `.env`**
```env
# Server Configuration
PORT=8000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# JWT Secrets
SECRET_ACCESS_TOKEN=your_access_token_secret_here
SECRET_REFRESH_TOKEN=your_refresh_token_secret_here

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Blockchain
ETHEREUM_RPC_URL=https://rpc-amoy.polygon.technology/
CONTRACT_ADDRESS=0xDBfd73aB895C94184Dcd8555327aE2b41D667c5D
ADMIN_PRIVATE_KEY=your_admin_private_key_here
```

#### **Client `.env`**
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### Step 3: Install Dependencies

#### Install Backend Dependencies
```bash
cd server
npm install
```

#### Install Frontend Dependencies
```bash
cd ../client
npm install
```

#### Install Blockchain Dependencies
```bash
cd ../blockchain
npm install
```

### Step 4: Setup MongoDB

1. Create a MongoDB Atlas account at [mongodb.com](https://www.mongodb.com/)
2. Create a new cluster
3. Get your connection string
4. Add it to your server `.env` file

### Step 5: Deploy Smart Contract (Optional)

If you want to deploy your own contract:

```bash
cd blockchain
npx hardhat compile
npx hardhat run scripts/deploy.js --network polygonAmoy
```

Update the `CONTRACT_ADDRESS` in your `.env` file with the new address.

### Step 6: Start the Application

#### Terminal 1 - Start Backend Server
```bash
cd server
npm start
```
Server will run on `http://localhost:8000`

#### Terminal 2 - Start Frontend
```bash
cd client
npm run dev
```
Frontend will run on `http://localhost:5173`

### Step 7: Access the Application

1. Open your browser and navigate to `http://localhost:5173`
2. You'll see the homepage with login option
3. Login credentials will be provided by your admin

---

## 👥 User Roles & Permissions

### 🔴 Admin Role

**Capabilities:**
- ✅ Create and manage departments
- ✅ Register and manage issuers
- ✅ Grant issuer roles on blockchain
- ✅ View all users (students and issuers)
- ✅ View all documents with complete audit trail
- ✅ System-wide analytics and reporting
- ✅ Monitor blockchain transactions

**Restricted Actions:**
- ❌ Cannot directly issue or reject documents
- ❌ Cannot register students (only issuers can)

### 🟢 Issuer Role

**Capabilities:**
- ✅ Register students in their department
- ✅ View all pending documents in their department
- ✅ Approve/Reject documents with blockchain recording
- ✅ View all students in their department
- ✅ Track document statistics (issued, pending, rejected)
- ✅ View "My Students" - students they registered
- ✅ Access complete student document history

**Restricted Actions:**
- ❌ Cannot create departments
- ❌ Cannot register other issuers
- ❌ Cannot approve documents from other departments
- ❌ Cannot access admin analytics

### 🔵 Student Role

**Capabilities:**
- ✅ Upload documents for verification
- ✅ View their uploaded documents
- ✅ Track document status (Pending/Issued/Rejected)
- ✅ Download issued certificates
- ✅ View rejection reasons
- ✅ Re-upload rejected documents

**Restricted Actions:**
- ❌ Cannot approve their own documents
- ❌ Cannot view other students' documents
- ❌ Cannot access admin or issuer features
- ❌ Cannot register other users

---

## 📊 Database Schema

### User Model
```javascript
{
  username: String (unique, required),
  email: String (unique, required),
  fullName: String (required),
  password: String (hashed, required),
  userType: String (enum: ['ADMIN', 'ISSUER', 'STUDENT']),
  department: ObjectId (ref: 'Department'),
  ethereumAddress: String (required for issuers),
  registeredBy: ObjectId (ref: 'User'),
  refreshToken: String,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### Document Model
```javascript
{
  owner: ObjectId (ref: 'User', required),
  department: ObjectId (ref: 'Department', required),
  issuer: ObjectId (ref: 'User'),
  documentName: String (required),
  storageUrl: String (Cloudinary URL, required),
  documentHash: String (SHA-256, unique, required),
  status: String (enum: ['PENDING', 'ISSUED', 'REJECTED']),
  issuedAt: DateTime,
  rejectedAt: DateTime,
  rejectionReason: String,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### Department Model
```javascript
{
  name: String (unique, required),
  shortCode: String (unique, required),
  createdAt: DateTime,
  updatedAt: DateTime
}
```

---

## 🔗 Smart Contract

### DocumentVerification.sol

**Key Functions:**

```solidity
// Admin sets issuer role
function setIssuer(address _issuerAddress, bool _isIssuer) 
    public onlyAdmin

// Admin issues document on behalf of issuer
function issueDocumentOnBehalf(bytes32 _docHash, address _issuerAddress) 
    public onlyAdmin

// Verify document authenticity
function verifyDocument(bytes32 _docHash) 
    public view returns (address)

// Check if address has issuer role
function isIssuer(address _address) 
    public view returns (bool)
```

**Events:**
- `IssuerToggled(address indexed issuerAddress, bool isIssuer)`
- `DocumentIssued(bytes32 indexed docHash, address indexed issuer)`

**Deployed Contract:**
- **Network:** Polygon Amoy Testnet
- **Address:** `0xDBfd73aB895C94184Dcd8555327aE2b41D667c5D`
- **Explorer:** [View on PolygonScan](https://amoy.polygonscan.com/address/0xDBfd73aB895C94184Dcd8555327aE2b41D667c5D)

---

## 🔒 Security Features

### Authentication & Authorization
- ✅ **JWT-based authentication** with access and refresh tokens
- ✅ **HTTP-only cookies** to prevent XSS attacks
- ✅ **Role-based access control** (RBAC) middleware
- ✅ **bcrypt password hashing** with 15 rounds

### Data Security
- ✅ **SHA-256 document hashing** for immutable fingerprints
- ✅ **Blockchain immutability** prevents document tampering
- ✅ **Encrypted private key storage** for admin wallet
- ✅ **CORS protection** for cross-origin requests
- ✅ **Multer file validation** for secure uploads

### Smart Contract Security
- ✅ **Solidity ^0.8.20** with built-in overflow protection
- ✅ **Role-based modifiers** (onlyAdmin, onlyIssuer)
- ✅ **Duplicate hash prevention**
- ✅ **Event logging** for transparency

---

## 🚦 API Endpoints

### Authentication
```
POST   /api/v1/users/login              # User login
POST   /api/v1/users/logout             # User logout
POST   /api/v1/users/refresh-accessToken # Refresh token
GET    /api/v1/users/current            # Get current user
```

### Admin Endpoints
```
POST   /api/v1/users/register-issuer    # Register new issuer
POST   /api/v1/users/regrant-issuer-role # Grant blockchain issuer role
GET    /api/v1/users/all                # Get all users
POST   /api/v1/departments/createDept   # Create department
GET    /api/v1/departments              # Get all departments
GET    /api/v1/documents/all            # Get all documents
```

### Issuer Endpoints
```
POST   /api/v1/users/register-student   # Register student
GET    /api/v1/users/my-students        # Get my registered students
GET    /api/v1/users/department-students # Get all dept students
GET    /api/v1/documents/pending        # Get pending documents
PATCH  /api/v1/documents/approve/:id    # Approve document
PATCH  /api/v1/documents/reject/:id     # Reject document
```

### Student Endpoints
```
POST   /api/v1/documents/upload         # Upload document
GET    /api/v1/documents/my-documents   # Get my documents
```

### Public Endpoints
```
POST   /api/v1/documents/verify         # Verify document hash
```

---

## 🧪 Testing

### Run Smart Contract Tests
```bash
cd blockchain
npx hardhat test
```

### Test Backend API
```bash
cd server
npm test
```

### Manual Testing with Postman
Import the API collection from `postman_collection.json` (if available)

---

## 📝 Future Enhancements

### Phase 1 (Short-term)
- [ ] **Email Notifications** - Notify users of document status changes
- [ ] **QR Code Generation** - Generate QR codes for quick verification
- [ ] **Bulk Upload** - Allow issuers to upload multiple documents
- [ ] **Advanced Analytics** - Dashboard charts and statistics
- [ ] **Document Templates** - Pre-defined document types

### Phase 2 (Mid-term)
- [ ] **Mobile Application** - React Native mobile app
- [ ] **Multi-language Support** - i18n implementation
- [ ] **Document Expiry** - Set validity periods for documents
- [ ] **Batch Processing** - Process multiple approvals at once
- [ ] **IPFS Integration** - Decentralized document storage

### Phase 3 (Long-term)
- [ ] **AI-based Document Validation** - Auto-detect fake documents
- [ ] **Multi-chain Support** - Deploy on multiple blockchains
- [ ] **DAO Governance** - Community-driven decision making
- [ ] **NFT Certificates** - Issue documents as NFTs
- [ ] **Third-party API** - Allow external systems to integrate

---

## 👨‍💻 Contributors

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/shreyansh0009">
        <img src="https://github.com/shreyansh0009.png" width="100px;" alt="Shreyansh"/>
        <br />
        <sub><b>Shreyansh</b></sub>
      </a>
      <br />
      <sub>Full Stack Developer</sub>
    </td>
  </tr>
</table>

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Ethereum Foundation** for blockchain infrastructure
- **Polygon** for affordable testnet transactions
- **MongoDB** for reliable database services
- **Cloudinary** for secure file storage
- **OpenZeppelin** for smart contract security standards

---

## 📞 Contact & Support

For questions, suggestions, or support:

- **GitHub Issues**: [Create an issue](https://github.com/shreyansh0009/FinalYearProject/issues)
- **Email**: shreyansh0009@example.com
- **LinkedIn**: [Connect on LinkedIn](https://linkedin.com/in/shreyansh0009)

---

## ⭐ Star This Repository

If you find this project helpful or interesting, please consider giving it a ⭐ star on GitHub!

---

<div align="center">
  <b>Made with ❤️ by Saurabh Shreyansh for secure and transparent document verification</b>
  <br/>
  <sub>© 2025 Decentralized Document Verification System</sub>
</div>

