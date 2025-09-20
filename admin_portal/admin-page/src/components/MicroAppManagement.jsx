import React, { useState } from "react";
import UploadMicroApp from "./UploadMicroApp";
import UploadExcel from "./UploadExcel";

export default function MicroAppManagement() {
  const [showUpload, setShowUpload] = useState(false); // micro app zip upload
  const [showPayslipUpload, setShowPayslipUpload] = useState(false); // payslip excel upload

  const openPayslipUpload = () => setShowPayslipUpload(true);
  const closePayslipUpload = () => setShowPayslipUpload(false);
  const closeZipUpload = () => setShowUpload(false);

  const onCardKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPayslipUpload();
    }
  };

  if (showPayslipUpload) {
    // Only show greeting (handled by App), close button and the payslip upload form here
    return (
      <div className="card" style={{ padding: 16, color: "#262626" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 8 }}>
          <button className="btn" onClick={closePayslipUpload}>Close</button>
        </div>
        <UploadExcel />
      </div>
    );
  }

  if (showUpload) {
    // Focused ZIP upload view: only header (with close) and the upload component
    return (
      <div className="card" style={{ padding: 16, color: "#262626" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontWeight: 600 }}></div>
          <button className="btn" onClick={closeZipUpload}>Close</button>
        </div>
        <UploadMicroApp />
      </div>
    );
  }

  return (
    <div style={{ color: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ margin: 0, color: "#fff" }}>Available Micro Apps</h2>
        <button className="btn btn--primary" onClick={() => setShowUpload(true)}>
          Add new
        </button>
      </div>

      <h3 style={{ marginTop: 0, color: "#fff" }}></h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
        {/* Payslip Viewer card - clickable */}
        <div
          className="card"
          onClick={openPayslipUpload}
          onKeyDown={onCardKeyDown}
          role="button"
          tabIndex={0}
          style={{ padding: 16, background: "#fafafa", border: "1px solid #f0f0f0", cursor: "pointer" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <img src="/payslip-viewer.svg" alt="Payslip Viewer" width={48} height={48} style={{ borderRadius: 8 }} />
            <div>
              <div style={{ fontWeight: 600, color: "#262626" }}>Payslip Viewer</div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}></div>
            </div>
          </div>
          <div style={{ color: "#595959", fontSize: 12 }}>
            
          </div>
        </div>
      </div>
    </div>
  );
}
