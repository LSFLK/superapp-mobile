/**
 * Constants for Payslip Uploader Application
 * 
 * This file serves as a centralized configuration hub for the entire payslip uploader application.
 * It contains all static values, configurations, and constants used across components to ensure
 * consistency and maintainability. By centralizing these values, we can easily modify behavior
 * without hunting through multiple files.
 * 
 * The constants are organized into logical groups:
 * - API_ENDPOINTS: All backend service URLs
 * - FILE_CONFIG: File upload and validation settings
 * - MESSAGES: User-facing text for different states
 * - CSS_CLASSES: Consistent styling classes
 * - TABLE_CONFIG: Data display configurations
 * - AUTH_CONFIG: Authentication-related settings
 */

// ============================================================================
// API ENDPOINTS CONFIGURATION
// ============================================================================
export const API_ENDPOINTS = {
  /**
   * Backend endpoint for uploading payslip files
   * 
   * This endpoint accepts multipart/form-data POST requests with CSV files
   * containing payslip information. The backend processes the CSV data and
   * stores it in the database for later retrieval.
   * 
   * Expected format: FormData with 'file' field containing CSV blob
   * Authentication: Requires JWT tokens (ID token + Access token)
   * 
   * @type {string}
   */
  UPLOAD_PAYSLIPS: 'https://41200aa1-4106-4e6c-babf-311dce37c04a-prod.e1-us-east-azure.choreoapis.dev/gov-superapp/microappbackendprodbranch/v1.0/admin-portal/upload',
  
  /**
   * Backend endpoint for retrieving stored payslip data
   * 
   * This endpoint returns all payslip records in JSON format. The response
   * includes employee information, salary details, and pay period data.
   * 
   * Method: GET
   * Response format: { status: 'success', data: PayslipRecord[] }
   * Authentication: Requires JWT tokens (ID token + Access token)
   * 
   * @type {string}
   */
  GET_PAYSLIPS: 'https://41200aa1-4106-4e6c-babf-311dce37c04a-prod.e1-us-east-azure.choreoapis.dev/gov-superapp/microappbackendprodbranch/v1.0/admin-portal/all',

};

// ============================================================================
// FILE UPLOAD CONFIGURATION
// ============================================================================
export const FILE_CONFIG = {
  /**
   * List of accepted file extensions for payslip uploads
   * 
   * The application supports both Excel formats (.xlsx, .xls) and CSV files.
   * Excel files are automatically converted to CSV format before upload using
   * the XLSX library. This ensures consistent data processing on the backend.
   * 
   * @type {string[]}
   */
  ACCEPTED_TYPES: ['.xlsx', '.xls', '.csv'],
  
  /**
   * Maximum allowed file size in bytes
   * 
   * Set to 10MB to prevent overly large file uploads that could:
   * - Consume excessive server resources
   * - Cause browser memory issues
   * - Lead to slow upload times
   * - Overwhelm the backend processing
   * 
   * @type {number} Size in bytes (10 * 1024 * 1024 = 10,485,760 bytes)
   */
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  
  /**
   * Required column headers for payslip data validation
   * 
   * These columns must be present in the uploaded CSV/Excel file for
   * successful processing. The order doesn't matter, but all columns
   * must exist with exact names (case-sensitive).
   * 
   * Each column serves a specific purpose:
   * - employee_id: Unique identifier for employee records
   * - designation: Job title/position information
   * - name: Employee full name for display
   * - department: Organizational unit/department
   * - pay_period: Salary period (e.g., "2024-01", "January 2024")
   * - basic_salary: Base salary amount before additions/deductions
   * - allowances: Additional compensation (bonuses, benefits, etc.)
   * - deductions: Subtracted amounts (taxes, insurance, etc.)
   * - net_salary: Final take-home amount after calculations
   * 
   * @type {string[]}
   */
  REQUIRED_COLUMNS: [
    'employee_id',
    'designation', 
    'name',
    'department',
    'pay_period',
    'basic_salary',
    'allowances',
    'deductions',
    'net_salary'
  ]
};

// ============================================================================
// USER INTERFACE MESSAGES
// ============================================================================
/**
 * Centralized collection of all user-facing messages in the application
 * 
 * Grouping messages by category (SUCCESS, ERROR, LOADING) makes it easy to:
 * - Maintain consistent messaging across the app
 * - Update text without searching through components
 * - Support future internationalization efforts
 * - Ensure proper tone and branding
 */
export const MESSAGES = {
  /**
   * Success messages displayed when operations complete successfully
   * These should be encouraging and confirm the action taken
   */
  SUCCESS: {
    /** Shown when file upload and processing completes without errors */
    UPLOAD: 'Payslips uploaded successfully!',
    /** Shown when a payslip record is deleted (future feature) */
    DELETE: 'Payslip deleted successfully!'
  },
  
  /**
   * Error messages displayed when operations fail
   * These should be helpful and suggest next steps when possible
   */
  ERROR: {
    /** Generic upload failure message when specific error is unknown */
    UPLOAD_FAILED: 'Failed to upload payslips. Please try again.',
    /** Error message for delete operations (future feature) */
    DELETE_FAILED: 'Failed to delete payslip. Please try again.',
    /** Shown when selected file exceeds the size limit defined in FILE_CONFIG */
    FILE_TOO_LARGE: 'File size exceeds the maximum limit of 10MB.',
    /** Shown when user selects unsupported file format */
    INVALID_FILE_TYPE: 'Please select a valid Excel (.xlsx, .xls) or CSV file.',
    /** Shown when file is empty or contains no processable data */
    NO_DATA: 'No valid data found in the uploaded file.',
    /** Shown when network/connectivity issues prevent API calls */
    NETWORK_ERROR: 'Network error. Please check your connection and try again.'
  },
  
  /**
   * Loading messages displayed during async operations
   * These keep users informed about ongoing processes
   */
  LOADING: {
    /** Shown during file upload and processing */
    UPLOADING: 'Uploading payslips...',
    /** Shown during delete operations (future feature) */
    DELETING: 'Deleting payslip...',
    /** Shown while fetching payslip data from backend */
    FETCHING: 'Loading payslips...'
  }
};

// ============================================================================
// CSS CLASS CONSTANTS
// ============================================================================
/**
 * Standardized CSS class names for consistent styling across components
 * 
 * Using constants for CSS classes provides several benefits:
 * - Prevents typos in class names
 * - Makes it easy to refactor styling
 * - Ensures consistent UI patterns
 * - Enables IDE autocompletion
 * - Facilitates theme changes
 */
export const CSS_CLASSES = {
  /**
   * Button variant classes for different visual hierarchies
   * These follow a consistent design system with primary, secondary, and danger states
   */
  /** Primary action buttons - most important actions (submit, save, confirm) */
  BUTTON_PRIMARY: 'btn primary',
  /** Secondary action buttons - less important actions (cancel, reset) */
  BUTTON_SECONDARY: 'btn secondary',
  /** Danger action buttons - destructive actions (delete, remove) */
  BUTTON_DANGER: 'btn danger',
  /** Smaller variant of buttons for compact layouts */
  BUTTON_SMALL: 'btn small',
  
  /**
   * Layout and structural classes for consistent component appearance
   */
  /** Main card container with fade-in animation */
  CARD: 'card fade-in',
  /** Header section container for titles and actions */
  HEADER_SECTION: 'header-section',
  /** Header content wrapper for proper spacing */
  HEADER_CONTENT: 'header-content',
  /** User information display area */
  USER_INFO: 'user-info',
  
  /**
   * State-based classes for visual feedback
   */
  /** Applied during loading states (spinners, progress indicators) */
  LOADING: 'loading',
  /** Applied to error messages and invalid states */
  ERROR: 'error',
  /** Applied to success messages and valid states */
  SUCCESS: 'success'
};

// ============================================================================
// TABLE DISPLAY CONFIGURATION
// ============================================================================
/**
 * Configuration settings for the payslip data table
 * 
 * These settings control how the payslip data is displayed and interacted with.
 * Centralizing table configuration makes it easy to adjust the user experience
 * without modifying component logic.
 */
export const TABLE_CONFIG = {
  /**
   * Number of payslip records to display per page
   * 
   * Set to a reasonable number to avoid overwhelming users with too much data
   * while minimizing the need for pagination. Can be adjusted based on user
   * feedback and performance considerations.
   * 
   * @type {number}
   */
  ITEMS_PER_PAGE: 10,
  
  /**
   * List of column keys that support sorting functionality
   * 
   * These columns can be clicked to sort the table data in ascending/descending order.
   * Only meaningful columns that users would want to sort are included.
   * Financial columns like salaries are useful for sorting by amount.
   * 
   * @type {string[]}
   */
  SORTABLE_COLUMNS: ['employee_id', 'name', 'department', 'pay_period', 'net_salary'],
  
  /**
   * Human-readable display names for table column headers
   * 
   * Maps internal column keys (from API/database) to user-friendly display names.
   * This separation allows for:
   * - Clean, professional column headers
   * - Easy localization in the future
   * - Flexibility to change display names without affecting data structure
   * 
   * @type {Object.<string, string>}
   */
  COLUMN_NAMES: {
    employee_id: 'Employee ID',
    name: 'Name',
    designation: 'Designation',
    department: 'Department',
    pay_period: 'Pay Period',
    basic_salary: 'Basic Salary',
    allowances: 'Allowances',
    deductions: 'Deductions',
    net_salary: 'Net Salary'
  }
};

// ============================================================================
// AUTHENTICATION CONFIGURATION
// ============================================================================
/**
 * Settings related to user authentication and session management
 * 
 * These values control the timing and behavior of authentication flows,
 * helping to balance user experience with security requirements.
 */
export const AUTH_CONFIG = {
  /**
   * Delay in milliseconds after successful sign-in before redirecting
   * 
   * Provides a brief moment for users to see the success state before
   * the interface changes. Improves perceived performance and reduces
   * jarring transitions.
   * 
   * @type {number}
   */
  SIGNIN_REDIRECT_DELAY: 2000,
  
  /**
   * Buffer time in minutes before token expiration to trigger refresh
   * 
   * Proactively refreshes authentication tokens before they expire to
   * prevent users from experiencing authentication failures during
   * active sessions. Set to 5 minutes as a safe buffer.
   * 
   * @type {number}
   */
  TOKEN_REFRESH_BUFFER: 5
};
