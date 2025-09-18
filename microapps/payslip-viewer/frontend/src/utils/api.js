import { terminal } from 'virtual:terminal';
/**
 * API utility functions for payslip viewer
 * Clean and reusable API functions with proper error handling
 */

// API base URL - can be configured via environment variable
// Use proxy during development to bypass CORS
const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = isDevelopment 
  ? '/api/proxy/gov-superapp/microappbackendprodbranch/v1.0'  // Use Vite proxy during development
  : import.meta.env.VITE_API_BASE_URL;

// Log which API base URL is being used
// if (typeof terminal !== 'undefined' && terminal.log) {
//   terminal.log(`API Base URL: ${API_BASE_URL} (Development mode: ${isDevelopment})`);
// }

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
    // Add timeout to prevent hanging requests
    signal: AbortSignal.timeout(30000), // 30 second timeout
  };

  try {
    // terminal.log(`Making API request to ${url} with options:`, defaultOptions);
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    // terminal.log(`Received response from ${url}:`, {
    //   status: response.status,
    //   statusText: response.statusText,
    //   headers: Object.fromEntries(response.headers.entries()),
    //   ok: response.ok
    // });
    
    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.text();
        terminal.log(`Error response body:`, errorData);
        errorMessage += ` - ${errorData}`;
      } catch (parseError) {
        terminal.log(`Could not parse error response:`, parseError);
      }
      throw new ApiError(errorMessage, response.status, 'HTTP_ERROR');
    }
    
    // Parse JSON response
    const data = await response.json();
    // terminal.log(`Parsed response data:`, data);
    
    // Handle API errors
    if (data.status === 'error') {
      throw new ApiError(
        data.message || 'An error occurred',
        response.status,
        data.errorCode
      );
    }
    
    return data;
  } catch (error) {
    // // Enhanced error logging
    // terminal.log(`API request error:`, {
    //   name: error.name,
    //   message: error.message,
    //   stack: error.stack,
    //   status: error.status || 'unknown',
    //   errorCode: error.errorCode || 'unknown',
    //   url: url,
    //   timestamp: new Date().toISOString()
    // });
    
    // Re-throw API errors
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle network errors with more specific messaging
    if (error.name === 'TypeError') {
      if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        throw new ApiError(
          `Network error: ${error.message}. This could be due to CORS policy, network connectivity, or server unavailability.`, 
          0, 
          'NETWORK_ERROR'
        );
      }
      if (error.message.includes('NetworkError')) {
        throw new ApiError('Network error: Request blocked by browser security policy.', 0, 'BROWSER_BLOCK_ERROR');
      }
    }
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      throw new ApiError('Server returned invalid JSON response.', 0, 'JSON_PARSE_ERROR');
    }
    
    // Handle timeout errors
    if (error.name === 'AbortError') {
      throw new ApiError('Request timeout - the server is not responding.', 0, 'TIMEOUT_ERROR');
    }
    
    // Handle other errors
    throw new ApiError(`Unexpected error: ${error.message}`, 500, 'UNKNOWN_ERROR');
  }
}

/**
 * Fetch payslip data using microapp token
 * @param {string} microappToken - Microapp token for authentication
 * @param {string} payPeriod - Optional pay period (YYYY-MM format)
 * @returns {Promise<Object>} Response containing payslip data
 */
export async function fetchPayslip(microappToken, payPeriod = null) {
  if (!microappToken || typeof microappToken !== 'string') {
    throw new ApiError('Microapp token is required', 400, 'VALIDATION_ERROR');
  }
  
  const endpoint = payPeriod 
    ? `/payslip?payPeriod=${encodeURIComponent(payPeriod)}`
    : '/payslip';
    
  const options = {
    headers: {
      'x-jwt-assertion': microappToken,
    },
  };
    
  return apiRequest(endpoint, options);
}

/**
 * Check API health
 * @returns {Promise<Object>} Health status response
 */
export async function checkApiHealth() {
  return apiRequest('/health');
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
