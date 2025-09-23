import React from 'react';
import { useAuthContext } from '@asgardeo/auth-react';
import PayslipUpload from './PayslipUpload';
import './styles.css';

export default function App() {
  const auth = useAuthContext();
  const isAuthenticated = auth?.state?.isAuthenticated;
  const username = auth?.state?.username || '';
  const displayName = auth?.state?.displayName || username.split('@')[0] || 'User';

  if (!isAuthenticated) {
    return (
      <div className="app-shell">
        <div className="card fade-in">
          <div className="auth-container">
            <h1 className="title">Payslip Upload Portal</h1>
            <p className="subtitle">Please sign in to access the payslip upload functionality.</p>
            
            <div className="auth-actions">
              <button className="btn" onClick={() => auth?.signIn()}>
                Sign In with Asgardeo
              </button>
            </div>
            
            <div className="auth-note">
              <p>You need to be authenticated to upload and view payslip data.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <><>
      <span className="welcome-text">Welcome, {displayName}</span>
    </><div className="app-shell">
        <div className="card fade-in">
          <div className="header-section">

            <div className="header-content">
              <h1 className="title">Payslip Upload</h1>
              <div className="user-info">

                <button className="btn secondary small" onClick={() => auth?.signOut()}>
                  Sign Out
                </button>
              </div>
            </div>
            <p className="subtitle">Upload an <strong>Excel</strong> or <strong>CSV</strong> file.</p>
          </div>

          <PayslipUpload />

          <hr className="hr" />
          {/* <div className="footer-note">Ensure the column headers follow the required format. <code className="inline">employee_id, designation, name, department, pay_period, basic_salary, allowances, deductions, net_salary</code></div> */}
        </div>
      </div></>
  );
}
