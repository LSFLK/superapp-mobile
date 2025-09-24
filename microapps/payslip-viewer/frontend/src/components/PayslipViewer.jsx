import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { fetchPayslip, getErrorMessage } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import PayslipCard from './PayslipCard';

export default function PayslipViewer() {
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [microappToken, setMicroappToken] = useState("No Microapp Token"); // Default fallback
  const [empID, setEmpID] = useState(null);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [showDebugInfo, setShowDebugInfo] = useState(false);


  const loadPayslip = async (token) => {
    if (!token || token === "No Microapp Token") {
      setError("No valid microapp token available");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetchPayslip(token);
      console.log('API Response:', response);
      
      // The payslip data is directly in the response, not nested under 'data'
      setPayslip(response);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {

    // Set loading to false when no native bridge is available (browser testing)
    if (!window.nativebridge || Object.keys(window.nativebridge).length === 0) {
      setLoading(false);
    }

    const initializeApp = async () => {
      try {
        // Check if we're running in native app (bridge available)
        if (window.nativebridge && typeof window.nativebridge === 'object' && Object.keys(window.nativebridge).length > 0) {
          // Get microapp token
          if (window.nativebridge.requestMicroAppToken) {
            try {
              const tokenData = await window.nativebridge.requestMicroAppToken({ app_id: "payslip-viewer" });
              setMicroappToken(tokenData.token);
              await loadPayslip(tokenData.token);
            } catch (error) {
              setError(`Failed to get microapp token: ${error}`);
            }
          }

          // Get employee ID
          if (window.nativebridge.requestEmpId) {
            try {
              const empId = await window.nativebridge.requestEmpId();
              setEmpID(empId);
            } catch (error) {
              console.error('Failed to get employee ID:', error);
            }
          }
        } else {
          console.log('Native bridge not available (running in browser).');
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        setError('Failed to initialize the application');
      }
    };

    initializeApp();

    // No cleanup needed for promises
  }, []);



  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Payslip</h1>
          <p className="text-gray-600 text-sm">Employee ID: {empID || 'Not Available'}</p>
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

        {/* No payslip loaded - show refresh button if we have a token */}
        {!payslip && !loading && !error && microappToken && microappToken !== "No Microapp Token" && (
          <div className="text-center space-y-2">
            <button
              onClick={() => loadPayslip(microappToken)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors mr-2"
            >
              Load Payslip
            </button>
          </div>
        )}

        {/* No token available */}
        {!payslip && !loading && microappToken === "No Microapp Token" && (
          <div className="text-center text-gray-600">
            <p>Something went wrong. Please refresh the app.</p>
          </div>
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
