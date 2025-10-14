/**
 * PayslipUpload Component - Advanced File Upload Interface (TypeScript)
 */

import { useState, useRef } from 'react';
import { useAuthContext } from '@asgardeo/auth-react';
import * as XLSX from 'xlsx';
import PayslipTable from './PayslipTable';
import { API_ENDPOINTS, MESSAGES, CSS_CLASSES, FILE_CONFIG } from './constants';

export default function PayslipUpload() {
  const auth = useAuthContext();

  const [dragging, setDragging] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [confirmFile, setConfirmFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [refreshTable, setRefreshTable] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const parseToCSV = async (file: File): Promise<string> => {
    const isCSV = /\.csv$/i.test(file.name) || file.type.includes('csv');
    if (isCSV) {
      return await file.text();
    }

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, {
      type: 'array',
      cellText: false,
      cellDates: true,
    });

    if (!workbook.SheetNames.length) {
      throw new Error(MESSAGES.ERROR.NO_DATA);
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: ',', RS: '\n' });

    if (!csv.trim()) {
      throw new Error(MESSAGES.ERROR.NO_DATA);
    }

    return csv;
  };

  const doUpload = async (file: File): Promise<void> => {
    setLoading(true);
    setMessage('');
    setIsError(false);
    setUploadSuccess(false);

    try {
      if (file.size > FILE_CONFIG.MAX_FILE_SIZE) {
        throw new Error(MESSAGES.ERROR.FILE_TOO_LARGE);
      }

      const csv = await parseToCSV(file);

      const formData = new FormData();
      formData.append('file', new Blob([csv], { type: 'text/csv' }), 'converted.csv');

      const headers: Record<string, string> = {};
      try {
        if (auth?.state?.isAuthenticated) {
          const idToken = await auth.getIDToken?.();
          if (idToken) headers['x-jwt-assertion'] = idToken;

          const accessToken = await auth.getAccessToken?.();
          if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
        }
      } catch (authError) {
      }
      const response = await fetch(API_ENDPOINTS.UPLOAD_PAYSLIPS, {
        method: 'POST',
        headers,
        body: formData,
      });

      const contentType = response.headers.get('content-type') || '';
      const responseBody = await response.text();
      let parsedResponse: any = null;

      if (/json/i.test(contentType)) {
        try {
          parsedResponse = JSON.parse(responseBody);
        } catch {
          // ignore parse errors
        }
      }

      if (!response.ok) {
        const errorMessage =
          parsedResponse?.message ||
          parsedResponse?.error ||
          responseBody.slice(0, 120) ||
          `Upload failed (${response.status})`;
        throw new Error(errorMessage);
      }

      setMessage(parsedResponse?.message || MESSAGES.SUCCESS.UPLOAD);
      setUploadSuccess(true);
      setRefreshTable((prev) => prev + 1);
    } catch (e: unknown) {
      setIsError(true);
      setMessage(e instanceof Error ? e.message : MESSAGES.ERROR.UPLOAD_FAILED);
      // eslint-disable-next-line no-console
      console.error('[PayslipUpload] Upload error:', e);
    } finally {
      setLoading(false);
      setShowModal(true);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      setConfirmFile(file);
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    const file = e.dataTransfer.files?.[0] ?? null;
    if (file) {
      setConfirmFile(file);
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragging) {
      setDragging(true);
    }
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
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

        {fileName && !confirmFile && <div className="dropzone__filename">{fileName}</div>}

        <div className="actions" style={{ marginTop: 18 }}>
          <label className={CSS_CLASSES.BUTTON_PRIMARY} style={{ opacity: loading ? 0.85 : 1 }}>
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

        {loading && (
          <div className="progress-bar-wrapper" aria-hidden="true">
            <div className="progress-bar" />
          </div>
        )}
      </div>

      {message && !loading && <div className={`status ${isError ? 'error' : 'success'}`}>{message}</div>}

      {confirmFile && (
        <div className="modal-backdrop" onClick={() => setConfirmFile(null)}>
          <div className="modal fade-in" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Upload</h3>
            <p>
              Upload <b>{confirmFile.name}</b>?
            </p>
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
              <button className={CSS_CLASSES.BUTTON_SECONDARY} onClick={() => setConfirmFile(null)}>
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal fade-in" onClick={(e) => e.stopPropagation()}>
            <h3>{isError ? 'Upload Failed' : 'Upload Successful'}</h3>
            <p>{message}</p>
            <div className="modal-footer">
              <button className={CSS_CLASSES.BUTTON_PRIMARY} onClick={() => setShowModal(false)}>
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
