import React, { useEffect, useState } from "react";
// import UploadExcel from "./components/UploadExcel"; // removed from UI per new menu
// import UploadMicroApp from "./components/UploadMicroApp"; // handled inside MicroAppManagement
import UserProfile from "./components/UserProfile";
import MicroAppManagement from "./components/MicroAppManagement";
import { useAuthContext } from "@asgardeo/auth-react";
import MenuBar from "./components/MenuBar";
import { Layout } from "antd";

const { Content } = Layout;

function App() {
  const ctx = useAuthContext();
  const state = ctx?.state;
  const signIn = ctx?.signIn;
  const signOut = ctx?.signOut;

  const isAuthed = Boolean(state?.isAuthenticated);
  const username = state?.username || "";
  const emailLocalPart = username.includes("@") ? username.split("@")[0] : "";
  const firstName = ( state?.displayName || emailLocalPart || state?.given_name || username || "").split(" ")[0];

  const [activeKey, setActiveKey] = useState("microapp");

  useEffect(() => {
    if (isAuthed) {
      console.log("User is authenticated:", username);
    }
  }, [isAuthed, username]);

  const onNavigate = (key) => setActiveKey(key);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {isAuthed ? (
        <>
          {/* Left sidebar */}
          <MenuBar onNavigate={onNavigate} isAuthed={isAuthed} onSignOut={signOut} activeKey={activeKey} />

          {/* Main content area */}
          <Layout>
            <Content style={{ padding: "16px" }}>
              <div className="container" style={{ marginTop: 0, marginBottom: 8 }}>
                <div className="greeting">Hi {firstName},</div>
              </div>

              <main className="container" style={{ paddingBottom: 48 }}>
                {activeKey === "microapp" && (
                  <section className="card">
                    <MicroAppManagement />
                  </section>
                )}

                {activeKey === "profile" && (
                  <section className="card">
                    <UserProfile state={state} />
                  </section>
                )}
              </main>
            </Content>
          </Layout>
        </>
      ) : (
        <Layout>
          <Content style={{ padding: "16px" }}>
            <main className="container" style={{ paddingBottom: 48 }}>
              <section className="card" style={{ textAlign: "center" }}>
                <h2 style={{ marginTop: 0, color: "#fff" }}>Please Sign In</h2>
                <p style={{ color: "var(--muted)", marginTop: 0 }}>
                  You must be logged in to use the admin portal.
                </p>
                <button className="btn btn--primary" onClick={() => signIn && signIn()}>
                  Sign In
                </button>
              </section>
            </main>
          </Content>
        </Layout>
      )}
    </Layout>
  );
}

export default App;
