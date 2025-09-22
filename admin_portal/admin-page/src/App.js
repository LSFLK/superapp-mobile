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
      // Fetch and print the access token once authenticated
      (async () => {
        try {
          const token = await ctx?.getAccessToken?.();
          if (token) {
            console.log("==== ADMIN PORTAL ACCESS TOKEN (Asgardeo) ====");
            console.log(ctx.getAccessToken());
            console.log("================================================");
          } else {
            console.warn("Access token not available yet.");
          }
        } catch (e) {
          console.error("Failed to retrieve access token", e);
        }
      })();
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
                  <section
                    style={{
                      background: '#f2f9ff',
                      border: '1px solid #d0ecff',
                      borderRadius: 16,
                      padding: 20,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                    }}
                  >
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
          <Content style={{ padding: 0, minHeight: '100vh' }}>
            <div
              style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px 16px',
                background: 'linear-gradient(135deg,#f0f8ff 0%, #e6f4ff 60%, #d9edff 100%)'
              }}
            >
              <section
                className="card"
                style={{
                  textAlign: 'center',
                  background: '#e6f4ff',
                  border: '1px solid #bae0ff',
                  color: '#003a67',
                  maxWidth: 420,
                  width: '100%',
                  boxShadow: '0 6px 24px -4px rgba(0,58,103,0.15)',
                }}
              >
                <h2 style={{ marginTop: 0, color: '#003a67' }}>Please Sign In</h2>
                <p style={{ color: '#09589c', marginTop: 0 }}>
                  You must be logged in to use the admin portal.
                </p>
                <button
                  className="btn btn--primary"
                  style={{
                    minWidth: 160,
                    border: 'none',
                    boxShadow: 'none',
                    outline: 'none',
                  }}
                  onClick={() => signIn && signIn()}
                  onFocus={(e) => {
                    // Provide accessible focus feedback without border
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(24,144,255,0.45)';
                  }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  Sign In
                </button>
              </section>
            </div>
          </Content>
        </Layout>
      )}
    </Layout>
  );
}

export default App;
