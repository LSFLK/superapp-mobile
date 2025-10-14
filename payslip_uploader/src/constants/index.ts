/**
 * Constants for Payslip Uploader Application (TypeScript)
 * Centralized configuration for API endpoints, file settings, UI messages, CSS classes, table settings, and auth.
 */

// API ENDPOINTS CONFIGURATION
export const API_ENDPOINTS = {
  UPLOAD_PAYSLIPS:
    'https://41200aa1-4106-4e6c-babf-311dce37c04a-prod.e1-us-east-azure.choreoapis.dev/gov-superapp/microappbackendprodbranch/v1.0/admin-portal/upload',
  GET_PAYSLIPS:
    'https://41200aa1-4106-4e6c-babf-311dce37c04a-prod.e1-us-east-azure.choreoapis.dev/gov-superapp/microappbackendprodbranch/v1.0/admin-portal/all',
} as const;

// FILE UPLOAD CONFIGURATION
export const FILE_CONFIG = {
  ACCEPTED_TYPES: ['.xlsx', '.xls', '.csv'] as readonly string[],
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  REQUIRED_COLUMNS: [
    'employee_id',
    'designation',
    'name',
    'department',
    'pay_period',
    'basic_salary',
    'allowances',
    'deductions',
    'net_salary',
  ] as const,
} as const;

// USER INTERFACE MESSAGES
export const MESSAGES = {
  SUCCESS: {
    UPLOAD: 'Payslips uploaded successfully!',
    DELETE: 'Payslip deleted successfully!',
  },
  ERROR: {
    UPLOAD_FAILED: 'Failed to upload payslips. Please try again.',
    DELETE_FAILED: 'Failed to delete payslip. Please try again.',
    FILE_TOO_LARGE: 'File size exceeds the maximum limit of 10MB.',
    INVALID_FILE_TYPE: 'Please select a valid Excel (.xlsx, .xls) or CSV file.',
    NO_DATA: 'No valid data found in the uploaded file.',
    NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  },
  LOADING: {
    UPLOADING: 'Uploading payslips...',
    DELETING: 'Deleting payslip...',
    FETCHING: 'Loading payslips...',
  },
} as const;

// CSS CLASS CONSTANTS
export const CSS_CLASSES = {
  BUTTON_PRIMARY: 'btn primary',
  BUTTON_SECONDARY: 'btn secondary',
  BUTTON_DANGER: 'btn danger',
  BUTTON_SMALL: 'btn small',
  CARD: 'card fade-in',
  HEADER_SECTION: 'header-section',
  HEADER_CONTENT: 'header-content',
  USER_INFO: 'user-info',
  LOADING: 'loading',
  ERROR: 'error',
  SUCCESS: 'success',
} as const;

// TABLE DISPLAY CONFIGURATION
export const TABLE_CONFIG = {
  ITEMS_PER_PAGE: 10,
  SORTABLE_COLUMNS: ['employee_id', 'name', 'department', 'pay_period', 'net_salary'] as const,
  COLUMN_NAMES: {
    employee_id: 'Employee ID',
    name: 'Name',
    designation: 'Designation',
    department: 'Department',
    pay_period: 'Pay Period',
    basic_salary: 'Basic Salary',
    allowances: 'Allowances',
    deductions: 'Deductions',
    net_salary: 'Net Salary',
  },
} as const;

// AUTHENTICATION CONFIGURATION
export const AUTH_CONFIG = {
  SIGNIN_REDIRECT_DELAY: 2000,
  TOKEN_REFRESH_BUFFER: 5,
} as const;

// Optional exported types (handy for TS consumers)
export type ApiEndpoints = typeof API_ENDPOINTS;
export type FileConfig = typeof FILE_CONFIG;
export type Messages = typeof MESSAGES;
export type CssClasses = typeof CSS_CLASSES;
export type TableConfig = typeof TABLE_CONFIG;
export type AuthConfig = typeof AUTH_CONFIG;
