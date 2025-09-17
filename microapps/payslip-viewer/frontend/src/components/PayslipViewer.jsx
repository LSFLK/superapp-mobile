import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { fetchPayslipByEmployee, getErrorMessage } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import PayslipCard from './PayslipCard';

export default function PayslipViewer() {
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employeeId, setEmployeeId] = useState(null); // Default fallback
  // const [consoleLogs, setConsoleLogs] = useState([]);

  useEffect(() => {
    // Get empID from native bridge if available
    const getNativeEmpId = () => {
      // setConsoleLogs((logs) => [...logs, 'Attempting to get empId from native bridge...']);
      // Check if we're running in native app (bridge available)
      if (window.nativebridge && typeof window.nativebridge === 'object' && Object.keys(window.nativebridge).length > 0) {
        // setConsoleLogs((logs) => [...logs, 'Native bridge detected. Requesting empId...']);
        // request empId
        if (window.nativebridge.requestEmpId) {
          window.nativebridge.requestEmpId();
          // setConsoleLogs((logs) => [...logs, 'EmpId request sent to native bridge. Waiting for response...']);
          // Listen for the response
          const handleEmpIdReceived = (event) => {
            setEmployeeId(event.detail);
            // setConsoleLogs((logs) => [...logs, `Received empId from native bridge: ${event.detail}`]);
          };
          
          window.addEventListener('nativeEmpIdReceived', handleEmpIdReceived);
          return null; // Will be set via event listener
        }
      } else {
        console.log('Native bridge not available (running in browser). Using fallback ID: EMP000');
      }

      return 'EMP000'; // Fallback ID for testing in browser
    };

    // Get initial empID
    const currentEmpId = getNativeEmpId();

    const loadPayslip = async (empId) => {
      if (!empId) return; // Don't load if empId is null (waiting for native response)
      
      try {
        setLoading(true);
        const response = await fetchPayslipByEmployee(empId);
        // console.log('Fetched employeeId:', empId);
        // console.log('API Response:', response);
        setPayslip(response.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    if (currentEmpId) {
      loadPayslip(currentEmpId);
    }

    // Cleanup event listeners
    return () => {
      window.removeEventListener('nativeEmpIdReceived', () => {});
      window.removeEventListener('resolveDeviceInfo', () => {});
    };
  }, []);

  // Reload payslip when employeeId changes
  useEffect(() => {
    if (employeeId && employeeId !== 'EMP003') {
      const loadPayslip = async () => {
        try {
          setLoading(true);
          const response = await fetchPayslipByEmployee(employeeId);
          console.log('Reloaded payslip for employeeId:', employeeId);
          setPayslip(response.data);
        } catch (err) {
          setError(getErrorMessage(err));
        } finally {
          setLoading(false);
        }
      };

      loadPayslip();
    }
  }, [employeeId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div>{consoleLogs}</div>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Payslip</h1>
          <p className="text-gray-600 text-sm">Employee ID: {employeeId}</p>
        </div>

        {/* Loading */}
        {loading && <LoadingSpinner text="Loading payslip..." size="lg" />}

        {/* Error */}
        {error && !loading && (
          <ErrorMessage
            message={error}
            type="error"
            dismissible
            onDismiss={() => setError(null)}
          />
        )}

        {/* Payslip */}
        {payslip && !loading && (
          <div className="animate-in fade-in duration-500">
            <PayslipCard payslip={payslip} showActions={false} />

            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Important Information</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>This payslip is for reference purposes only</li>
                    <li>For official documentation, please contact HR</li>
                    <li>All amounts are in LKR</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
