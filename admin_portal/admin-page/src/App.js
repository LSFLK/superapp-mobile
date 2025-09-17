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

  useEffect(() => {
    if (isAuthed) {
      // User is authenticated, you can perform actions here
      console.log("User is authenticated:", username);
    }
  }, [isAuthed, username]);

  return (
    <div style={styles.appContainer}>
      <header style={styles.header}>
        <h1 style={styles.title}>Payslip Management</h1>
        <p style={styles.subtitle}>Upload and manage employee payslips with ease</p>
      </header>

      <main style={styles.main}>
        {!isAuthed ? (
          <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <button onClick={() => signIn && signIn()}>Login</button>
          </div>
        ) : (
          <div style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                <li>{username}</li>
              </ul>
              <button onClick={() => signOut && signOut()}>Logout</button>
            </div>
            <UploadExcel />
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  appContainer: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f4f7fb, #e9eef5)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontFamily: "Segoe UI, sans-serif",
    padding: "40px 20px",
  },
  header: {
    textAlign: "center",
    marginTop: "40px",
    marginBottom: "40px",
  },
  title: {
    fontSize: "36px",
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: "10px",
  },
  subtitle: {
    fontSize: "16px",
    color: "#555",
    marginTop: "0",
  },
  main: {
    display: "flex",
    justifyContent: "center",
    width: "100%",
  },
};

export default App;
