/**
 * Main App Component - Root Application Container (TypeScript)
 */

import type React from 'react';
import { useAuthContext } from '@asgardeo/auth-react';
import PayslipUpload from './PayslipUpload';
import RoleBasedAccessControl from './components/RoleBasedAccessControl';
import { CSS_CLASSES } from './constants';
import './styles.css';

type AuthState = {
  isAuthenticated?: boolean;
  username?: string;
  displayName?: string;
  given_name?: string;
};

type AuthCtx = {
  state?: AuthState;
  signIn?: () => Promise<void> | void;
  signOut?: () => Promise<void> | void;
};

export default function App(): React.ReactElement {
  const auth = useAuthContext() as unknown as AuthCtx;

  const isAuthenticated = Boolean(auth?.state?.isAuthenticated);
  const username = auth?.state?.username || '';
  const displayName = auth?.state?.displayName || username.split('@')[0] || 'User';

  if (!isAuthenticated) {
    return (
      <div className="app-shell">
        <div className={CSS_CLASSES.CARD}>
          <div className="auth-container">
            <h1 className="title">Payslip Upload Portal</h1>
            <p className="subtitle">Please sign in to access the payslip upload functionality.</p>

            <div className="auth-actions">
              <button
                className={CSS_CLASSES.BUTTON_PRIMARY}
                onClick={() => auth?.signIn?.()}
                aria-label="Sign in using Asgardeo authentication"
              >
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
    // <RoleBasedAccessControl requiredGroup="Finance_dept">
    <div className="app-shell">
      <div className={CSS_CLASSES.CARD}>
        {/* ===== APPLICATION HEADER ===== */}
        <div className={CSS_CLASSES.HEADER_SECTION}>
          <div className={CSS_CLASSES.HEADER_CONTENT}>
            <h1 className="title">Payslip Upload</h1>

            <div className={CSS_CLASSES.USER_INFO}>
              <span className="welcome-text">Welcome, {displayName}</span>
              <button
                className={`${CSS_CLASSES.BUTTON_SECONDARY} ${CSS_CLASSES.BUTTON_SMALL}`}
                onClick={() => auth?.signOut?.()}
                aria-label="Sign out and end current session"
                title="Sign out from the application"
              >
                Sign Out
              </button>
            </div>
          </div>

          <p className="subtitle">
            Upload an <strong>Excel</strong> or <strong>CSV</strong> file.
          </p>
        </div>

        {/* ===== MAIN UPLOAD FUNCTIONALITY ===== */}
        <PayslipUpload />

        {/* ===== DIVIDER ===== */}
        <hr className="hr" />

        {/* ===== FOOTER INFORMATION ===== */}
        <div className="footer-note">
          Ensure the column headers follow the required format:{' '}
          <code className="inline">
            employee_id, designation, name, department, pay_period, basic_salary, allowances, deductions, net_salary
          </code>
        </div>
      </div>
    </div>
    // </RoleBasedAccessControl>
  );
}
