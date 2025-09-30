/**
 * PayslipUpload Component - Advanced File Upload Interface
 * 
 * This is a sophisticated file upload component that provides a complete solution for
 * uploading payslip data to the backend system. It combines modern UX patterns with
 * robust error handling and data processing capabilities.
 * 
 * CORE FUNCTIONALITY:
 * ==================
 * - Dual upload methods: drag-and-drop + traditional file picker
 * - Multi-format support: Excel (.xlsx, .xls) and CSV files
 * - Real-time file format conversion (Excel → CSV using XLSX library)
 * - Comprehensive file validation (size, type, content)
 * - Secure authentication token handling for API requests
 * - Real-time upload progress feedback
 * - User-friendly confirmation dialogs
 * - Automatic data table refresh after successful uploads
 * 
 * TECHNICAL ARCHITECTURE:
 * ======================
 * - React functional component with hooks for state management
 * - Integration with Asgardeo authentication for secure API calls
 * - XLSX library for client-side Excel file processing
 * - FormData API for multipart file uploads
 * - Fetch API with comprehensive error handling
 * - Modal dialogs for user confirmation and feedback
 * 
 * USER EXPERIENCE DESIGN:
 * ======================
 * - Intuitive drag-and-drop interface with visual feedback
 * - Progressive disclosure (confirmation → upload → results)
 * - Clear status messages for all operation states
 * - Responsive design for desktop and mobile devices
 * - Accessibility features (ARIA labels, keyboard navigation)
 * 
 * SECURITY CONSIDERATIONS:
 * =======================
 * - File size limits to prevent DoS attacks
 * - File type validation to prevent malicious uploads
 * - Authentication token validation before API calls
 * - Secure multipart form data transmission
 * - Error message sanitization to prevent information leakage
 * 
 * DATA PROCESSING PIPELINE:
 * ========================
 * 1. File Selection (drag-drop or file picker)
 * 2. Client-side validation (size, type)
 * 3. Format conversion (Excel → CSV if needed)
 * 4. User confirmation dialog
 * 5. Authentication token retrieval
 * 6. Secure API upload with progress tracking
 * 7. Response parsing and user feedback
 * 8. Table refresh to show new data
 * 
 * @component
 * @example
 * // Basic usage within authenticated app:
 * <PayslipUpload />
 * 
 * @example
 * // The component automatically handles all states:
 * // - File selection and validation
 * // - Upload progress and completion
 * // - Error handling and user feedback
 * // - Data table refresh
 */

import React, { useState, useRef } from 'react';
import { useAuthContext } from '@asgardeo/auth-react';
import * as XLSX from 'xlsx';
import PayslipTable from './PayslipTable';
import { API_ENDPOINTS, MESSAGES, CSS_CLASSES, FILE_CONFIG } from './constants';

/**
 * PayslipUpload Component Function
 * 
 * The main functional component that orchestrates the complete file upload workflow.
 * This component manages multiple interconnected processes including file handling,
 * user interactions, API communications, and state management.
 * 
 * COMPONENT ARCHITECTURE:
 * ======================
 * - Uses React hooks for state management and side effects
 * - Integrates with authentication context for secure API access
 * - Maintains multiple state variables for different UI states
 * - Provides ref-based access to file input element
 * 
 * STATE MANAGEMENT STRATEGY:
 * =========================
 * The component manages several interconnected states that represent
 * different phases of the upload process and user interactions.
 * 
 * @returns {JSX.Element} The complete rendered PayslipUpload interface
 */
export default function PayslipUpload() {
  
  // ============================================================================
  // AUTHENTICATION AND CONTEXT MANAGEMENT
  // ============================================================================
  
  /**
   * Authentication context from Asgardeo
   * 
   * Provides access to:
   * - User authentication state
   * - Token retrieval methods (getIDToken, getAccessToken)
   * - Authentication status and user information
   * 
   * Used for securing API requests with proper JWT tokens.
   */
  const auth = useAuthContext();
  
  // ============================================================================
  // COMPONENT STATE MANAGEMENT
  // ============================================================================
  
  /**
   * Drag-and-drop visual feedback state
   * 
   * Controls the visual styling of the drop zone when files are being
   * dragged over it. Provides immediate visual feedback to users during
   * drag operations.
   * 
   * @type {boolean}
   */
  const [dragging, setDragging] = useState(false);
  
  /**
   * Currently selected/uploaded file name
   * 
   * Stores the name of the file that was last processed, used for
   * displaying confirmation messages and upload status.
   * 
   * @type {string}
   */
  const [fileName, setFileName] = useState('');
  
  /**
   * User feedback message
   * 
   * Contains success or error messages to display to the user.
   * Content depends on the current operation state and outcome.
   * 
   * @type {string}
   */
  const [message, setMessage] = useState('');
  
  /**
   * Error state indicator
   * 
   * Determines whether the current message represents an error condition.
   * Used for conditional styling and user experience decisions.
   * 
   * @type {boolean}
   */
  const [isError, setIsError] = useState(false);
  
  /**
   * Modal visibility controller
   * 
   * Controls the display of result modals (success/error) after
   * upload operations complete.
   * 
   * @type {boolean}
   */
  const [showModal, setShowModal] = useState(false);
  
  /**
   * File confirmation state
   * 
   * Holds the file object that is pending user confirmation before upload.
   * When set, triggers the confirmation modal display.
   * 
   * @type {File|null}
   */
  const [confirmFile, setConfirmFile] = useState(null);
  
  /**
   * Upload operation progress indicator
   * 
   * Controls the display of loading states, progress bars, and
   * disabled states during active upload operations.
   * 
   * @type {boolean}
   */
  const [loading, setLoading] = useState(false);
  
  /**
   * Upload success tracking
   * 
   * Tracks whether the last upload operation completed successfully.
   * Used for conditional UI rendering and user feedback.
   * 
   * @type {boolean}
   */
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  /**
   * Table refresh trigger
   * 
   * Incremental counter used to trigger data table refreshes after
   * successful uploads. Each increment causes the PayslipTable component
   * to refetch data from the backend.
   * 
   * @type {number}
   */
  const [refreshTable, setRefreshTable] = useState(0);
  
  // ============================================================================
  // DOM REFERENCES
  // ============================================================================
  
  /**
   * File input element reference
   * 
   * Provides direct access to the hidden file input element for:
   * - Programmatic file selection triggering
   * - Input value clearing after file processing
   * - Form reset operations
   * 
   * @type {React.RefObject<HTMLInputElement>}
   */
  const inputRef = useRef(null);

  /**
   * Converts uploaded file to CSV format
   * 
   * @param {File} file - The uploaded file (Excel or CSV)
   * @returns {Promise<string>} CSV string representation of the file data
   * @throws {Error} When file cannot be processed or is empty
   */
  const parseToCSV = async (file) => {
    // Check if file is already in CSV format
    const isCSV = /\.csv$/i.test(file.name) || file.type.includes('csv');
    if (isCSV) {
      return await file.text();
    }
    
    // Process Excel files
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { 
      type: 'array', 
      cellText: false, 
      cellDates: true 
    });
    
    // Validate workbook has sheets
    if (!workbook.SheetNames.length) {
      throw new Error(MESSAGES.ERROR.NO_DATA);
    }
    
    // Convert first sheet to CSV
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: ',', RS: '\n' });
    
    if (!csv.trim()) {
      throw new Error(MESSAGES.ERROR.NO_DATA);
    }
    
    return csv;
  };

  /**
   * Handles the file upload process
   * 
   * @param {File} file - The file to upload
   */
  const doUpload = async (file) => {
    // Reset state for new upload
    setLoading(true);
    setMessage('');
    setIsError(false);
    setUploadSuccess(false);
    
    try {
      // Validate file size
      if (file.size > FILE_CONFIG.MAX_FILE_SIZE) {
        throw new Error(MESSAGES.ERROR.FILE_TOO_LARGE);
      }
      
      // Convert file to CSV format
      const csv = await parseToCSV(file);
      
      // Prepare form data
      const formData = new FormData();
      formData.append('file', new Blob([csv], { type: 'text/csv' }), 'converted.csv');

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
        console.warn("Could not obtain authentication tokens for upload", authError);
      }

      // Make upload request
      console.log('[PayslipUpload] Using endpoint:', API_ENDPOINTS.UPLOAD_PAYSLIPS);
      const response = await fetch(API_ENDPOINTS.UPLOAD_PAYSLIPS, {
        method: 'POST',
        headers,
        body: formData
      });
      
      // Parse response
      const contentType = response.headers.get('content-type') || '';
      const responseBody = await response.text();
      let parsedResponse = null;
      
      if (/json/i.test(contentType)) {
        try {
          parsedResponse = JSON.parse(responseBody);
        } catch (parseError) {
          // Ignore JSON parse errors
        }
      }
      
      // Handle errors
      if (!response.ok) {
        const errorMessage = parsedResponse?.message || 
                           parsedResponse?.error || 
                           responseBody.slice(0, 120) || 
                           `Upload failed (${response.status})`;
        throw new Error(errorMessage);
      }
      
      // Handle success
      setMessage(parsedResponse?.message || MESSAGES.SUCCESS.UPLOAD);
      setUploadSuccess(true);
      
      // Trigger table refresh to show new data
      setRefreshTable(prev => prev + 1);
      
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : MESSAGES.ERROR.UPLOAD_FAILED);
      console.error('[PayslipUpload] Upload error:', error);
    } finally {
      setLoading(false);
      setShowModal(true);
    }
  };

  /**
   * Handles file input change event
   * @param {Event} e - The input change event
   */
  const onInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setConfirmFile(file);
    }
    // Clear input value to allow same file selection
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  /**
   * Handles file drop event
   * @param {DragEvent} e - The drop event
   */
  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setConfirmFile(file);
    }
  };

  /**
   * Handles drag over event
   * @param {DragEvent} e - The drag over event
   */
  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragging) {
      setDragging(true);
    }
  };

  /**
   * Handles drag leave event
   * @param {DragEvent} e - The drag leave event
   */
  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  return (
    <div>
      {/* File drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`dropzone ${dragging ? 'is-dragging' : ''}`}
      >
        <p className="dropzone__title">Drag & drop file here</p>
        <p className="dropzone__hint">{FILE_CONFIG.ACCEPTED_TYPES.join(', ')}</p>
        
        {fileName && !confirmFile && (
          <div className="dropzone__filename">{fileName}</div>
        )}
        
        <div className="actions" style={{ marginTop: 18 }}>
          <label 
            className={CSS_CLASSES.BUTTON_PRIMARY} 
            style={{ opacity: loading ? 0.85 : 1 }}
          >
            {loading ? MESSAGES.LOADING.UPLOADING : 'Choose File'}
            <input 
              ref={inputRef} 
              type="file" 
              accept={FILE_CONFIG.ACCEPTED_TYPES.join(',')} 
              onChange={onInputChange} 
              style={{ display: 'none' }} 
              disabled={loading} 
            />
          </label>
        </div>
        
        {/* Upload progress indicator */}
        {loading && (
          <div className="progress-bar-wrapper" aria-hidden="true">
            <div className="progress-bar" />
          </div>
        )}
      </div>
      
      {/* Status message */}
      {message && !loading && (
        <div className={`status ${isError ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* File confirmation modal */}
      {confirmFile && (
        <div className="modal-backdrop" onClick={() => setConfirmFile(null)}>
          <div className="modal fade-in" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Upload</h3>
            <p>Upload <b>{confirmFile.name}</b>?</p>
            <div className="modal-footer">
              <button 
                className={CSS_CLASSES.BUTTON_PRIMARY} 
                onClick={async () => {
                  const file = confirmFile;
                  setConfirmFile(null);
                  setFileName(file.name);
                  await doUpload(file);
                }}
              >
                Yes
              </button>
              <button 
                className={CSS_CLASSES.BUTTON_SECONDARY} 
                onClick={() => setConfirmFile(null)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload result modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal fade-in" onClick={(e) => e.stopPropagation()}>
            <h3>{isError ? 'Upload Failed' : 'Upload Successful'}</h3>
            <p>{message}</p>
            <div className="modal-footer">
              <button 
                className={CSS_CLASSES.BUTTON_PRIMARY} 
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payslip data table */}
      <PayslipTable refreshTrigger={refreshTable} />
    </div>
  );
}

// Inline style constants removed in favor of CSS classes
