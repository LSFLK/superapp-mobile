import React, { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '@asgardeo/auth-react';

export default function PayslipTable({ refreshTrigger }) {
  const auth = useAuthContext();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const initialLoad = useRef(true);

  const endpoint = 'https://41200aa1-4106-4e6c-babf-311dce37c04a-prod.e1-us-east-azure.choreoapis.dev/gov-superapp/microappbackendprodbranch/v1.0/admin-portal/all';

  const fetchPayslips = async () => {
    if (!endpoint) {
      setError('View endpoint not configured (REACT_APP_PAYSLIP_VIEW_ENDPOINT)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Add authentication headers if available
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
      } catch (e) {
        console.warn("Could not obtain authentication tokens for viewing payslips", e);
      }

      console.log('[PayslipTable] Fetching from endpoint:', `${endpoint}`);
      const response = await fetch(`${endpoint}`, { headers });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Payslips endpoint not found. Please check the backend service is running.');
        } else if (response.status === 401) {
          throw new Error('Authentication required. Please sign in again.');
        } else if (response.status === 403) {
          throw new Error('Access forbidden. You may not have permission to view payslips.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(`Failed to fetch payslips (${response.status})`);
        }
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format from server');
      }

      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setPayslips(Array.isArray(result.data) ? result.data : []);
      } else {
        setPayslips([]);
        if (result.message) {
          setError(result.message);
        }
      }
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Unable to connect to server. Please check your internet connection and ensure the backend service is running.');
      } else {
        setError(err.message);
      }
      setPayslips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      fetchPayslips();
    }
  }, [endpoint]);

  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchPayslips();
    }
  }, [refreshTrigger]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="payslip-table-container">
        <div className="table-header">
          <h3>Uploaded Payslips</h3>
          <button className="btn secondary small" onClick={fetchPayslips} disabled>
            Refreshing...
          </button>
        </div>
        <div className="table-loading">
          <div className="progress-bar-wrapper">
            <div className="progress-bar" />
          </div>
          <p>Loading payslips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payslip-table-container">
      <div className="table-header">
        <h3>Uploaded Payslips</h3>
        <button className="btn secondary small" onClick={fetchPayslips}>
          Refresh
        </button>
      </div>

      {error && (
        <div className="status error">
          {error}
        </div>
      )}

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
                <th>Employee ID</th>
                <th>Name</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Pay Period</th>
                <th>Basic Salary</th>
                <th>Allowances</th>
                <th>Deductions</th>
                <th>Net Salary</th>
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
