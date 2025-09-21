import React, { useState } from "react";
import UploadMicroApp from "./UploadMicroApp";
import MicroAppsList from "./MicroAppsList";
import { registerAuthContext } from "./microAppsServiceAuth";
import { useAuthContext } from "@asgardeo/auth-react";
import UploadExcel from "./UploadExcel";

export default function MicroAppManagement() {
  const auth = useAuthContext();
  registerAuthContext(auth);
  const [showUpload, setShowUpload] = useState(false); // micro app zip upload
  const [showPayslipUpload, setShowPayslipUpload] = useState(false); // payslip excel upload
  const [listRefreshToken, setListRefreshToken] = useState(0);

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
        <UploadMicroApp onSuccess={() => {
          // increment token to trigger list reload when navigating back
          setListRefreshToken(t => t + 1);
        }} />
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
      <MicroAppsList refreshToken={listRefreshToken} />
    </div>
  );
}
