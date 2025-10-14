/**
 * PayslipTable Component - Advanced Data Display and Management Interface (TypeScript)
 */

import { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '@asgardeo/auth-react';
import { API_ENDPOINTS, MESSAGES, CSS_CLASSES, TABLE_CONFIG } from './constants';

type Props = {
  refreshTrigger: number;
};

export type Payslip = {
  employeeId: string;
  name: string;
  designation: string;
  department: string;
  payPeriod: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
};

type ApiSuccess = { status: 'success'; data?: unknown; message?: string };
type ApiFailure = { status?: string; data?: unknown; message?: string };
type ApiResponse = ApiSuccess | ApiFailure;

export default function PayslipTable({ refreshTrigger }: Props) {
  // Authentication context
  const auth = useAuthContext();

  // Component state management
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Track initial load to prevent unnecessary fetches
  const initialLoad = useRef(true);

  /**
   * Fetches payslip data from the backend API
   * Handles authentication tokens and error states
   */
  const fetchPayslips = async (): Promise<void> => {
    setLoading(true);
    setError('');

    try {
      // Prepare authentication headers
      const headers: Record<string, string> = {};
      try {
        if (auth?.state?.isAuthenticated) {
          const idToken = await auth.getIDToken?.();
          if (idToken) {
            headers['x-jwt-assertion'] = idToken;
          }

          const accessToken = await auth.getAccessToken?.();
          if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
          }
        }
      } catch (authError) {
      }
      const response = await fetch(API_ENDPOINTS.GET_PAYSLIPS, { headers });

      // Handle HTTP errors
      if (!response.ok) {
        let errorMessage: string;
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
      const result: ApiResponse = (await response.json()) as ApiResponse;

      if (result && (result as ApiSuccess).status === 'success' && (result as any).data) {
        const data = (result as any).data;
        setPayslips(Array.isArray(data) ? (data as Payslip[]) : []);
      } else {
        setPayslips([]);
        if (result && (result as any).message) {
          setError(String((result as any).message));
        }
      }
    } catch (e: unknown) {
      // Handle network and other errors
      let message = 'An unexpected error occurred';
      if (e instanceof Error) {
        if (e.name === 'TypeError' && e.message.includes('fetch')) {
          message = MESSAGES.ERROR.NETWORK_ERROR;
        } else {
          message = e.message;
        }
      }
      setError(message);
      setPayslips([]);
      // eslint-disable-next-line no-console
      console.error('[PayslipTable] Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Effect to handle initial data load
  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      void fetchPayslips();
    }
  }, []);

  // Effect to handle table refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      void fetchPayslips();
    }
  }, [refreshTrigger]);

  // Formats currency values for display
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
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
        <button className={`${CSS_CLASSES.BUTTON_SECONDARY} ${CSS_CLASSES.BUTTON_SMALL}`} onClick={fetchPayslips}>
          Refresh
        </button>
      </div>

      {/* Error message */}
      {error && <div className="status error">{error}</div>}

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
