/**
 * API utility functions for payslip viewer
 * Clean and reusable API functions with proper error handling
 */

// API base URL - can be configured via environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.39:8080/api/v1';

/**
 * Generic API error class for better error handling
 */
export class ApiError extends Error {
  constructor(message, status, errorCode = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    // Parse JSON response
    const data = await response.json();
    
    // Handle API errors
    if (!response.ok || data.status === 'error') {
      throw new ApiError(
        data.message || 'An error occurred',
        response.status,
        data.errorCode
      );
    }
    
    return data;
  } catch (error) {
    // Re-throw API errors
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new ApiError('Network error. Please check your connection.', 0, 'NETWORK_ERROR');
    }
    
    // Handle other errors
    throw new ApiError('An unexpected error occurred.', 500, 'UNKNOWN_ERROR');
  }
}

/**
 * Fetch all payslips
 * @returns {Promise<Object>} Response containing array of payslips
 */
export async function fetchAllPayslips() {
  return apiRequest('/payslips');
}

/**
 * Fetch payslip for specific employee
 * @param {string} employeeId - Employee ID to fetch payslip for
 * @param {string} payPeriod - Optional pay period (YYYY-MM format)
 * @returns {Promise<Object>} Response containing payslip data
 */
export async function fetchPayslipByEmployee(employeeId, payPeriod = null) {
  if (!employeeId || typeof employeeId !== 'string') {
    throw new ApiError('Employee ID is required', 400, 'VALIDATION_ERROR');
  }
  
  const endpoint = payPeriod 
    ? `/payslips/${encodeURIComponent(employeeId)}?payPeriod=${encodeURIComponent(payPeriod)}`
    : `/payslips/${encodeURIComponent(employeeId)}`;
    
  return apiRequest(endpoint);
}

/**
 * Check API health
 * @returns {Promise<Object>} Health status response
 */
export async function checkApiHealth() {
  return apiRequest('/payslips/health');
}

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: LKR)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'LKR') {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return `${currency} 0.00`;
  }
  
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format pay period for display
 * @param {string} payPeriod - Pay period in YYYY-MM format
 * @returns {string} Formatted pay period
 */
export function formatPayPeriod(payPeriod) {
  if (!payPeriod || typeof payPeriod !== 'string') {
    return 'N/A';
  }
  
  try {
    const [year, month] = payPeriod.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long'
    }).format(date);
  } catch (error) {
    return payPeriod; // Return original if formatting fails
  }
}

/**
 * Validate employee ID format
 * @param {string} employeeId - Employee ID to validate
 * @returns {boolean} True if valid format
 */
export function validateEmployeeId(employeeId) {
  if (!employeeId || typeof employeeId !== 'string') {
    return false;
  }
  
  // Format: 3 letters + 3-6 digits (ABC123)
  const regex = /^[A-Z]{3}\d{3,6}$/;
  return regex.test(employeeId.toUpperCase());
}

/**
 * Get error message for display
 * @param {Error} error - Error object
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(error) {
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }
  
  return 'An unexpected error occurred. Please try again.';
}
