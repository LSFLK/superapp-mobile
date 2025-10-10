/**
 * MicroAppManagement Component
 * 
 * The main interface for managing micro-applications in the SuperApp ecosystem.
 * Provides functionality to view, upload, and manage micro-apps through a clean,
 * card-based interface.
 * 
 * Features:
 * - Display grid of available micro-applications
 * - Upload new micro-app packages (ZIP files)
 * - Real-time loading states and error handling
 * - Authentication-aware API calls
 * - Responsive grid layout
 * - Refresh functionality for up-to-date data
 * 
 * Key Workflows:
 * 1. List View: Shows all available micro-apps in a card grid
 * 2. Upload Mode: Provides interface for uploading new micro-apps
 * 3. Error Handling: Graceful error display and recovery
 * 4. Authentication: Uses Asgardeo tokens for secure API calls
 * 
 * State Management:
 * - showUpload: Controls visibility of upload interface
 * - microApps: Array of micro-app data from backend
 * - loadingList: Loading state for micro-app fetching
 * - listError: Error state for failed operations
 */

import React, { useEffect, useState, useCallback } from "react";
import { useAuthContext } from "@asgardeo/auth-react";
import UploadMicroApp from "./UploadMicroApp";
import Button from "./common/Button";
import Loading from "./common/Loading";
import Card from "./common/Card";
import { COLORS } from "../constants/styles";
import { getEndpoint } from "../constants/api";

export default function MicroAppManagement() {
  // Authentication context for secure API calls
  const auth = useAuthContext();
  
  // Component state management
  const [showUpload, setShowUpload] = useState(false); // Controls upload panel visibility
  const [microApps, setMicroApps] = useState([]);      // Array of micro-app data
  const [loadingList, setLoadingList] = useState(false); // Loading state for API calls
  const [listError, setListError] = useState("");      // Error message display

  /**
   * Fetch Micro-Applications from Backend
   * 
   * Retrieves the list of available micro-applications from the backend API.
   * Includes authentication headers and proper error handling.
   * 
   * Authentication Flow:
   * 1. Check if user is authenticated via Asgardeo
   * 2. Retrieve ID token and access token
   * 3. Include tokens in API request headers
   * 4. Handle authentication failures gracefully
   * 
   * Error Handling:
   * - Network failures
   * - Authentication errors
   * - Invalid response format
   * - Backend service unavailability
   */
  const fetchMicroApps = useCallback(async () => {
    setLoadingList(true);
    setListError("");
    
    try {
      // Prepare authentication headers
      const headers = {};
      if (auth?.state?.isAuthenticated) {
        if (typeof auth?.getAccessToken === 'function') {
          try {
            // Use the access token for both Authorization and x-jwt-assertion
            const access = await auth.getAccessToken();
            if (access) {
              headers["Authorization"] = `Bearer ${access}`;
              headers["x-jwt-assertion"] = access; // make same as Bearer
            }
          } catch (e) {
            // Non-fatal: continue without tokens (backend may reject)
            console.warn("Authentication token acquisition failed:", e);
          }
        } else {
          // Guard against malformed auth context in tests
          console.warn("Authentication token acquisition failed:", new Error("getAccessToken is not a function"));
        }
      }
      
      // Make API request to fetch micro-apps
      const endpoint = getEndpoint('MICROAPPS_LIST');
      const res = await fetch(endpoint, { headers });
      
      if (!res.ok) {
        throw new Error(`Failed to load micro-apps (${res.status})`);
      }
      
      // Parse response and handle different response formats
      const data = await res.json();
      if (Array.isArray(data)) {
        setMicroApps(data);
      } else if (Array.isArray(data?.items)) {
        setMicroApps(data.items); // Handle paginated response format
      } else if (Array.isArray(data?.data)) {
        setMicroApps(data.data); // Handle nested data container { data: [] }
      } else {
        setMicroApps([]); // Fallback for unexpected format
      }
      
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Error loading apps";
      setListError(errorMessage);
      console.error("Micro-app fetch error:", e);
    } finally {
      setLoadingList(false);
    }
  }, [auth]);

  // Load micro-apps when component mounts
  useEffect(() => { 
    fetchMicroApps(); 
  }, [fetchMicroApps]);

  return (
    <div style={{ color: COLORS.primary, lineHeight: 1.15 }}>
      {/* Header Controls - Only visible when not in upload mode */}
      {!showUpload && (
        <div style={{ 
          display: "flex", 
          flexWrap: "wrap", 
          gap: 8, 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: 12 
        }}>
          <h2 style={{ margin: 0, color: COLORS.primary }}>Available Micro Apps</h2>
          <div style={{ display: "flex", gap: 8 }}>
            {/* Refresh button to reload micro-app list */}
            <Button
              onClick={fetchMicroApps}
              disabled={loadingList}
            >
              {loadingList ? "Refreshing…" : "Refresh"}
            </Button>
            
            {/* Toggle button for upload interface */}
            <Button onClick={() => setShowUpload(s => !s)}>
              {showUpload ? "Close Upload" : "Add new"}
            </Button>
          </div>
        </div>
      )}

      {/* Upload Mode Controls - Only visible during upload */}
      {showUpload && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <Button onClick={() => setShowUpload(false)}>
            Close
          </Button>
        </div>
      )}

      {/* Error Display - Show API errors when not in upload mode */}
      {listError && !showUpload && (
        <Card style={{ 
          background: "#2d1f1f", 
          border: "1px solid #5a2f2f", 
          color: "#fca5a5", 
          padding: 12, 
          marginBottom: 16 
        }}>
          {listError}
        </Card>
      )}

      {/* Upload Interface - Embedded upload component */}
      {showUpload && (
        <Card style={{ padding: 16, marginBottom: 20 }}>
          <UploadMicroApp 
            onUploaded={() => { 
              fetchMicroApps(); // Refresh list after successful upload
              setShowUpload(false); // Close upload panel
            }} 
          />
        </Card>
      )}

      {/* Micro-Apps Grid Display - Main content area */}
      {!showUpload && (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", 
          gap: 12 
        }}>
          {/* Loading State - Show when fetching data and no existing data */}
          {loadingList && microApps.length === 0 && (
            <Loading message="Loading micro-apps…" />
          )}
          
          {/* Empty State - Show when no apps available and not loading */}
          {!loadingList && microApps.length === 0 && !listError && (
            <Card style={{ padding: 16, background: "#111" }}>
              No micro-apps found.
            </Card>
          )}
          
          {/* Micro-App Cards - Render each micro-app as a card */}
          {microApps.map(app => (
            <Card
              key={app.micro_app_id || app.app_id} // Use available ID field
              style={{ 
                padding: 16, 
                background: '#f5faff', 
                border: '1px solid #e6f4ff', 
                cursor: 'default', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 8, 
                borderRadius: 14, 
                boxShadow: '0 3px 8px -2px rgba(0,58,103,0.15)' 
              }}
            >
              {/* App Header with Icon and Basic Info */}
              <div style={{ display: 'flex', gap: 12 }}>
                {/* App Icon - Generated from name initials */}
                <div style={{ 
                  width: 48, 
                  height: 48, 
                  background: '#e6f4ff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: 600, 
                  borderRadius: 8, 
                  color: '#1677ff' 
                }}>
                  {(app.name ? app.name : '?').slice(0,2).toUpperCase()}
                </div>
                
                {/* App Name and Version */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#262626' }}>
                    {(() => {
                      // Avoid duplicate single-letter name conflicting with initials (e.g., name === 'A')
                      if (typeof app.name === 'string' && app.name.length > 1) {
                        return app.name;
                      }
                      if (!app.name) {
                        return app.micro_app_id || app.app_id || '';
                      }
                      // Single-character name: prefer showing ID to keep text unique in DOM
                      return app.micro_app_id || app.app_id || app.name;
                    })()}
                  </div>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                    v{app.version || '—'}
                  </div>
                </div>
              </div>
              
              {/* App Description */}
              <div style={{ color: '#595959', fontSize: 12, flexGrow: 1 }}>
                {app.description || 'No description'}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
