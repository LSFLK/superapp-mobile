// import React from "react";
// import UploadExcel from "./components/UploadExcel";

// function App() {
//   return (
//     <div className="App">
//       <h1>Payslip Management</h1>
//       <UploadExcel />
//     </div>
//   );
// }

// export default App;

import React, { useEffect } from "react";
import UploadExcel from "./components/UploadExcel";
import { useAuthContext } from "@asgardeo/auth-react";

function App() {
  const ctx = useAuthContext();
  const state = ctx?.state;
  const signIn = ctx?.signIn;
  const signOut = ctx?.signOut;

  const isAuthed = Boolean(state?.isAuthenticated);
  const username = state?.username || "";
  // Prefer email local-part (before @) if username is an email; otherwise fall back to displayName/given_name
  const emailLocalPart = username.includes("@") ? username.split("@")[0] : "";
  const firstName = ( state?.displayName || emailLocalPart || state?.given_name || username || "").split(" ")[0];

  useEffect(() => {
    if (isAuthed) {
      console.log("User is authenticated:", username);
    }
  }, [isAuthed, username]);

  return (
    <div>
      <nav className="navbar">
        <div className="container navbar__inner">
          <div className="brand">Payslip Management</div>
          <div className="actions">
            {isAuthed ? (
              <button className="btn btn--ghost" onClick={() => signOut && signOut()}>Logout</button>
            ) : null}
          </div>
        </div>
      </nav>

      {isAuthed && (
        <div className="container" style={{ marginTop: 16, marginBottom: 8 }}>
          <div className="greeting">Hi {firstName}</div>
        </div>
      )}

      <header className="hero container">
        <h1></h1>
        
      </header>

      <main className="container" style={{ paddingBottom: 48 }}>
        {isAuthed ? (
          <section className="card">
            <UploadExcel />
          </section>
        ) : (
          <section className="card" style={{ textAlign: "center" }}>
            <h2 style={{ marginTop: 0 }}>Please Sign In</h2>
            <p style={{ color: "var(--muted)", marginTop: 0 }}>
              You must be logged in to upload payslips.
            </p>
            <button className="btn btn--primary" onClick={() => signIn && signIn()}>
              Sign In
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
