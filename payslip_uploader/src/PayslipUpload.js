import React, { useState, useRef } from 'react';
import { useAuthContext } from '@asgardeo/auth-react';
import * as XLSX from 'xlsx';
import PayslipTable from './PayslipTable';

export default function PayslipUpload(){
  const auth = useAuthContext();
  const [dragging,setDragging]=useState(false);
  const [fileName,setFileName]=useState('');
  const [message,setMessage]=useState('');
  const [isError,setIsError]=useState(false);
  const [showModal,setShowModal]=useState(false);
  const [confirmFile,setConfirmFile]=useState(null);
  const [loading,setLoading]=useState(false);
  const [uploadSuccess,setUploadSuccess]=useState(false);
  const [refreshTable,setRefreshTable]=useState(0);
  const inputRef=useRef(null);

  const endpoint = 'https://41200aa1-4106-4e6c-babf-311dce37c04a-prod.e1-us-east-azure.choreoapis.dev/gov-superapp/microappbackendprodbranch/v1.0/admin-portal/upload';

  const parseToCSV = async (file) => {
    const isCSV = /\.csv$/i.test(file.name) || file.type.includes('csv');
    if (isCSV) return await file.text();
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data,{type:'array',cellText:false,cellDates:true});
    if(!wb.SheetNames.length) throw new Error('No sheets in file');
    const ws = wb.Sheets[wb.SheetNames[0]];
    const csv = XLSX.utils.sheet_to_csv(ws,{FS:',',RS:'\n'});
    if(!csv.trim()) throw new Error('Sheet empty');
    return csv;
  };

  const doUpload = async(file)=>{
    setLoading(true); setMessage(''); setIsError(false); setUploadSuccess(false);
    try{
      if(!endpoint){ throw new Error('Upload endpoint not configured (REACT_APP_PAYSLIP_UPLOAD_ENDPOINT)'); }
      const csv = await parseToCSV(file);
      const formData = new FormData();
      formData.append('file', new Blob([csv],{type:'text/csv'}), 'converted.csv');

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
        console.warn("Could not obtain authentication tokens for upload", e);
      }

      console.log('[PayslipUpload] Using endpoint:', endpoint);
      const res = await fetch(endpoint,{method:'POST',headers,body:formData});
      const ct = res.headers.get('content-type')||'';
      const body = await res.text();
      let parsed = null;
      if(/json/i.test(ct)) { try { parsed = JSON.parse(body); } catch(e){ /* ignore */ } }
      if(!res.ok) throw new Error(parsed?.message || parsed?.error || body.slice(0,120) || `Upload failed (${res.status})`);
      setMessage(parsed?.message || 'Upload successful');
      setUploadSuccess(true);
      // Trigger table refresh
      setRefreshTable(prev => prev + 1);
    }catch(e){
      setIsError(true);
      setMessage(e instanceof Error ? e.message : 'Unknown error');
    }finally{
      setLoading(false);
      setShowModal(true);
    }
  };

  const onInputChange=(e)=>{ const f=e.target.files?.[0]; if(f){ setConfirmFile(f); } if(inputRef.current) inputRef.current.value=''; };
  const onDrop=(e)=>{ e.preventDefault(); e.stopPropagation(); setDragging(false); const f=e.dataTransfer.files?.[0]; if(f) setConfirmFile(f); };
  const onDragOver=(e)=>{ e.preventDefault(); e.stopPropagation(); if(!dragging) setDragging(true); };
  const onDragLeave=(e)=>{ e.preventDefault(); e.stopPropagation(); setDragging(false); };

  return (
    <div>
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`dropzone ${dragging ? 'is-dragging' : ''}`}
      >
        <p className="dropzone__title">Drag & drop file here</p>
        <p className="dropzone__hint">.xlsx, .xls, .csv</p>
        {fileName && !confirmFile && <div className="dropzone__filename">{fileName}</div>}
        <div className="actions" style={{marginTop:18}}>
          <label className="btn" style={{opacity:loading?0.85:1}}>
            {loading? 'Uploading…' : 'Choose File'}
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" onChange={onInputChange} style={{display:'none'}} disabled={loading} />
          </label>
        </div>
        {loading && (
          <div className="progress-bar-wrapper" aria-hidden="true">
            <div className="progress-bar" />
          </div>
        )}
      </div>
      {message && !loading && (
        <div className={`status ${isError? 'error':'success'}`}>{message}</div>
      )}

      {confirmFile && (
        <div className="modal-backdrop" onClick={()=> setConfirmFile(null)}>
          <div className="modal fade-in" onClick={(e)=>e.stopPropagation()}>
            <h3>Confirm Upload</h3>
            <p>Upload <b>{confirmFile.name}</b>?</p>
            <div className="modal-footer">
              <button className="btn" onClick={async()=>{ const f=confirmFile; setConfirmFile(null); setFileName(f.name); await doUpload(f); }}>Yes</button>
              <button className="btn secondary" onClick={()=> setConfirmFile(null)}>No</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={()=> setShowModal(false)}>
          <div className="modal fade-in" onClick={(e)=>e.stopPropagation()}>
            <h3>{isError? 'Upload Failed':'Upload Successful'}</h3>
            <p>{message}</p>
            <div className="modal-footer">
              <button className="btn" onClick={()=> setShowModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <PayslipTable refreshTrigger={refreshTable} />
    </div>
  );
}

// Inline style constants removed in favor of CSS classes
