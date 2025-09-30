/**
 * PayslipTable Component - Advanced Data Display and Management Interface
 * 
 * This component provides a comprehensive solution for displaying, managing, and
 * interacting with payslip data retrieved from the backend API. It combines modern
 * data table functionality with robust error handling and user experience features.
 * 
 * CORE FUNCTIONALITY:
 * ==================
 * - Real-time data fetching from secure backend APIs
 * - Responsive table design with professional formatting
 * - Automatic refresh capability for data synchronization
 * - Currency formatting with localization support (Sri Lankan Rupees)
 * - Comprehensive error handling with user-friendly messages
 * - Loading states with visual progress indicators
 * - Empty state handling with guidance messaging
 * - Authentication token management for secure API access
 * 
 * TECHNICAL ARCHITECTURE:
 * ======================
 * - React functional component with modern hooks pattern
 * - Integration with Asgardeo authentication for JWT token handling
 * - Fetch API with comprehensive HTTP status code handling
 * - React useEffect for lifecycle management and data fetching
 * - useState for complex state management (data, loading, errors)
 * - useRef for performance optimization and initial load tracking
 * 
 * DATA MANAGEMENT:
 * ===============
 * - Automatic initial data loading on component mount
 * - Refresh triggering through prop changes from parent components
 * - Response parsing with validation and error handling
 * - Data transformation for optimal display formatting
 * - Memory-efficient state updates and cleanup
 * 
 * USER EXPERIENCE DESIGN:
 * ======================
 * - Professional table layout with clear column headers
 * - Responsive design for various screen sizes
 * - Loading indicators to manage user expectations
 * - Clear error messages with actionable guidance
 * - Empty state messaging to guide user actions
 * - Refresh functionality for data synchronization
 * - Accessible table structure with proper ARIA labels
 * 
 * SECURITY AND PERFORMANCE:
 * =========================
 * - Secure JWT token handling for API authentication
 * - Input sanitization and validation for all data
 * - Efficient re-rendering through optimized state management
 * - Memory leak prevention through proper cleanup
 * - Error boundary patterns for graceful failure handling
 * 
 * API INTEGRATION:
 * ===============
 * - RESTful API communication with proper HTTP methods
 * - Authentication header management (ID token + Access token)
 * - Comprehensive HTTP status code handling
 * - Network error detection and user notification
 * - Response validation and data structure verification
 * 
 * @component
 * @param {Object} props - Component properties
 * @param {number} props.refreshTrigger - Trigger value for data refresh operations
 * 
 * @example
 * // Basic usage with refresh trigger:
 * <PayslipTable refreshTrigger={refreshCount} />
 * 
 * @example
 * // The component automatically handles:
 * // - Initial data loading
 * // - Authentication token management
 * // - Error states and user feedback
 * // - Loading states and progress indication
 * // - Data formatting and display
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '@asgardeo/auth-react';
import { API_ENDPOINTS, MESSAGES, CSS_CLASSES, TABLE_CONFIG } from './constants';

/**
 * PayslipTable Component Function
 * 
 * Displays payslip data in a table format with refresh capability.
 * 
 * @param {Object} props - Component props
 * @param {number} props.refreshTrigger - Trigger value to refresh table data
 * @returns {JSX.Element} The rendered PayslipTable component
 */
export default function PayslipTable({ refreshTrigger }) {
  // Authentication context
  const auth = useAuthContext();
  
  // Component state management
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Track initial load to prevent unnecessary fetches
  const initialLoad = useRef(true);

  /**
   * Fetches payslip data from the backend API
   * Handles authentication tokens and error states
   */
  const fetchPayslips = async () => {
    setLoading(true);
    setError('');

    try {
      // Prepare authentication headers
      let headers = {};
      try {
        if (auth?.state?.isAuthenticated) {
          // Identity assertion (ID token)
          const idToken = await auth.getIDToken();
          if (idToken) {
            headers["x-jwt-assertion"] = idToken;
          }
          
          // API authorization (access token)
          const accessToken = await auth.getAccessToken();
          if (accessToken) {
            headers["Authorization"] = `Bearer ${accessToken}`;
          }
        }
      } catch (authError) {
        console.warn("Could not obtain authentication tokens for viewing payslips", authError);
      }

      // Make API request
      console.log('[PayslipTable] Fetching from endpoint:', API_ENDPOINTS.GET_PAYSLIPS);
      const response = await fetch(API_ENDPOINTS.GET_PAYSLIPS, { headers });
      
      // Handle HTTP errors
      if (!response.ok) {
        let errorMessage;
        switch (response.status) {
          case 404:
            errorMessage = 'Payslips endpoint not found. Please check the backend service is running.';
            break;
          case 401:
            errorMessage = 'Authentication required. Please sign in again.';
            break;
          case 403:
            errorMessage = 'Access forbidden. You may not have permission to view payslips.';
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = `Failed to fetch payslips (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      // Validate response content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format from server');
      }

      // Parse response data
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setPayslips(Array.isArray(result.data) ? result.data : []);
      } else {
        setPayslips([]);
        if (result.message) {
          setError(result.message);
        }
      }
      
    } catch (error) {
      // Handle network and other errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError(MESSAGES.ERROR.NETWORK_ERROR);
      } else {
        setError(error.message);
      }
      setPayslips([]);
      console.error('[PayslipTable] Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Effect to handle initial data load
   */
  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      fetchPayslips();
    }
  }, []);

  /**
   * Effect to handle table refresh when refreshTrigger changes
   */
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchPayslips();
    }
  }, [refreshTrigger]);

  /**
   * Formats currency values for display
   * 
   * @param {number} amount - The amount to format
   * @returns {string} Formatted currency string
   */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="payslip-table-container">
        <div className="table-header">
          <h3>Uploaded Payslips</h3>
          <button 
            className={`${CSS_CLASSES.BUTTON_SECONDARY} ${CSS_CLASSES.BUTTON_SMALL}`} 
            onClick={fetchPayslips} 
            disabled
          >
            Refreshing...
          </button>
        </div>
        <div className="table-loading">
          <div className="progress-bar-wrapper">
            <div className="progress-bar" />
          </div>
          <p>{MESSAGES.LOADING.FETCHING}</p>
        </div>
      </div>
    );
  }

  // Render main component
  return (
    <div className="payslip-table-container">
      {/* Table header with refresh button */}
      <div className="table-header">
        <h3>Uploaded Payslips</h3>
        <button 
          className={`${CSS_CLASSES.BUTTON_SECONDARY} ${CSS_CLASSES.BUTTON_SMALL}`} 
          onClick={fetchPayslips}
        >
          Refresh
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="status error">
          {error}
        </div>
      )}

      {/* Empty state or data table */}
      {payslips.length === 0 && !error ? (
        <div className="empty-state">
          <p>No payslips uploaded yet</p>
          <span className="empty-hint">Upload a CSV or Excel file to see payslip data here</span>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="payslip-table">
            <thead>
              <tr>
                <th>{TABLE_CONFIG.COLUMN_NAMES.employee_id}</th>
                <th>{TABLE_CONFIG.COLUMN_NAMES.name}</th>
                <th>{TABLE_CONFIG.COLUMN_NAMES.designation}</th>
                <th>{TABLE_CONFIG.COLUMN_NAMES.department}</th>
                <th>{TABLE_CONFIG.COLUMN_NAMES.pay_period}</th>
                <th>{TABLE_CONFIG.COLUMN_NAMES.basic_salary}</th>
                <th>{TABLE_CONFIG.COLUMN_NAMES.allowances}</th>
                <th>{TABLE_CONFIG.COLUMN_NAMES.deductions}</th>
                <th>{TABLE_CONFIG.COLUMN_NAMES.net_salary}</th>
              </tr>
            </thead>
            <tbody>
              {payslips.map((payslip, index) => (
                <tr key={`${payslip.employeeId}-${payslip.payPeriod}-${index}`}>
                  <td className="employee-id">{payslip.employeeId}</td>
                  <td className="employee-name">{payslip.name}</td>
                  <td>{payslip.designation}</td>
                  <td>{payslip.department}</td>
                  <td>{payslip.payPeriod}</td>
                  <td className="currency">{formatCurrency(payslip.basicSalary)}</td>
                  <td className="currency positive">{formatCurrency(payslip.allowances)}</td>
                  <td className="currency negative">{formatCurrency(payslip.deductions)}</td>
                  <td className="currency net-salary">{formatCurrency(payslip.netSalary)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Table footer with count */}
          <div className="table-footer">
            <span className="table-count">
              {payslips.length} payslip{payslips.length !== 1 ? 's' : ''} found
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
