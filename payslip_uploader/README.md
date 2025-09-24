# Payslip Uploader Application

A React-based web application for uploading and managing payslip data. This application allows users to upload Excel (.xlsx, .xls) or CSV files containing payslip information and view the data in a formatted table.

## Features

- **Secure Authentication**: Integrated with Asgardeo OAuth2/OIDC for secure user authentication
- **File Upload**: Support for Excel (.xlsx, .xls) and CSV file formats
- **Drag & Drop Interface**: User-friendly drag-and-drop file upload functionality
- **Data Validation**: File format validation and error handling
- **Real-time Display**: Uploaded payslip data is displayed in a responsive table
- **Currency Formatting**: Monetary values formatted in Sri Lankan Rupees (LKR)
- **Responsive Design**: Mobile-friendly and responsive user interface

## Technology Stack

- **Frontend**: React 18 with modern hooks and functional components
- **Authentication**: Asgardeo Auth React SDK
- **File Processing**: XLSX library for Excel file parsing
- **Styling**: CSS with modern flexbox and grid layouts
- **API Communication**: Fetch API with authentication token handling

## Project Structure

```
src/
├── App.js                 # Main application component
├── App.css               # Application styles
├── index.js              # Application entry point
├── PayslipUpload.js      # File upload component
├── PayslipTable.js       # Data display table component
└── constants/
    └── index.js          # Application constants and configuration
```

## Components

### App.js
- Main application component
- Handles authentication state management
- Renders sign-in page or main interface based on auth status
- Provides user welcome message and sign-out functionality

### PayslipUpload.js
- File upload component with drag-and-drop support
- Handles file validation and format conversion
- Manages upload progress and status messaging
- Includes confirmation modals for user actions

### PayslipTable.js
- Displays uploaded payslip data in table format
- Fetches data from backend API with authentication
- Handles loading states and error messaging
- Provides refresh functionality for data updates

### constants/index.js
- Centralized configuration and constants
- API endpoints, file configuration, and UI messages
- CSS class names and table configuration
- Authentication settings

## File Format Requirements

The application expects CSV/Excel files with the following column headers:
- `employee_id`: Unique identifier for the employee
- `designation`: Job title or position
- `name`: Employee full name
- `department`: Department or division
- `pay_period`: Pay period (e.g., "2024-01", "January 2024")
- `basic_salary`: Base salary amount
- `allowances`: Additional allowances
- `deductions`: Total deductions
- `net_salary`: Final salary after deductions

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) to view the application

### Configuration

Update the authentication configuration in `src/index.js`:
- `signInRedirectURL`: Your application's URL for post-login redirect
- `signOutRedirectURL`: Your application's URL for post-logout redirect
- `clientID`: Your Asgardeo application client ID
- `baseUrl`: Your Asgardeo organization base URL

Update API endpoints in `src/constants/index.js`:
- `API_ENDPOINTS.PAYSLIPS`: Your backend API endpoint for payslip operations

## Minimal Hardening
This starter mirrors the hardened parsing & content-type checks from the admin portal.
