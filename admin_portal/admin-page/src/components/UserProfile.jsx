/**
 * UserProfile Component
 * 
 * Displays comprehensive user profile information by combining data from multiple sources:
 * 1. Asgardeo authentication context (basic profile info)
 * 2. Backend user service (extended profile details like employee ID, department)
 * 
 * Features:
 * - Fetches basic user info from Asgardeo identity provider
 * - Retrieves extended profile from backend user service
 * - Graceful error handling for service unavailability
 * - Loading states for async operations
 * - Fallback values for missing information
 * - Profile picture display when available
 * 
 * Data Sources:
 * - Asgardeo: given_name, family_name, locale, updated_at, picture
 * - Backend: first_name, last_name, employee_id, department
 * 
 * Props:
 * @param {Object} state - Authentication state from Asgardeo context
 * 
 * Error Handling:
 * - Network failures for both Asgardeo and backend calls
 * - Invalid JSON responses
 * - Service unavailability
 * - Missing user data
 */

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@asgardeo/auth-react";
import Loading from "./common/Loading";
import Card from "./common/Card";
import { COLORS } from "../constants/styles";
import { getEndpoint } from "../constants/api";

// Fetches richer user details from Asgardeo and displays them with fallbacks
export default function UserProfile({ state }) {
  // Authentication context for API calls
  const ctx = useAuthContext();
  
  // State management for user data from different sources
  const [basicInfo, setBasicInfo] = useState(null);     // Asgardeo basic user info
  const [loading, setLoading] = useState(true);         // Asgardeo fetch loading state
  const [error, setError] = useState("");               // Asgardeo fetch errors
  const [profileLoading, setProfileLoading] = useState(false); // Backend profile loading
  const [profileError, setProfileError] = useState(""); // Backend profile errors
  const [profile, setProfile] = useState(null);         // Backend profile data

  /**
   * Effect: Fetch Basic User Info from Asgardeo
   * 
   * Retrieves basic user profile information from the Asgardeo identity provider.
   * This includes standard OIDC profile claims like name, locale, and picture.
   * 
   * Error Handling:
   * - Service unavailability
   * - Network timeouts
   * - Invalid authentication context
   */
  useEffect(() => {
    let mounted = true; // Cleanup flag for async operations
    
    (async () => {
      try {
        if (ctx?.getBasicUserInfo) {
          const info = await ctx.getBasicUserInfo();
          if (mounted) setBasicInfo(info || null);
        }
      } catch (e) {
        console.error("Failed to fetch user info from Asgardeo:", e);
        if (mounted) setError("Could not fetch user details");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      mounted = false;
    };
  }, [ctx]);

  /**
   * Effect: Fetch Extended Profile from Backend Service
   * 
   * Retrieves additional user profile information from the backend user service.
   * This includes organization-specific data like employee ID and department.
   * 
   * Process:
   * 1. Wait for email from Asgardeo basic info
   * 2. Construct authenticated API request
   * 3. Parse and validate JSON response
   * 4. Handle various error conditions gracefully
   * 
   * Authentication:
   * - Uses ID token for user identity verification
   * - Uses access token for API authorization
   * - Graceful fallback if tokens unavailable
   */
  useEffect(() => {
    // Extract email from available sources (Asgardeo or auth state)
    const email = basicInfo?.email || state?.email || basicInfo?.username || state?.username;
    if (!email) return; // Wait for email to become available
    
    // Get backend base URL with environment variable support
    const base = getEndpoint('USERS_BASE') || getEndpoint('MICROAPPS_LIST').replace('/micro-apps', '');
    if (!base || base.trim() === "") {
      setProfileError("User service base URL not configured");
      return;
    }
    
    let abort = false; // Cleanup flag for async operations
    
    (async () => {
      setProfileLoading(true);
      setProfileError("");
      
      try {
        // Construct user profile endpoint with URL encoding
        const encoded = encodeURIComponent(email);
        const endpoint = `${base}/users/${encoded}`.replace(/([^:])\/\//g, '$1/');

        // Prepare authentication headers
        const headers = {};
        try {
          if (ctx?.state?.isAuthenticated) {
            // Include ID token for user identity verification
            const idToken = await ctx.getIDToken().catch(() => undefined);
            if (idToken) headers["x-jwt-assertion"] = idToken;
            
            // Include access token for API authorization
            const access = await ctx.getAccessToken().catch(() => undefined);
            if (access) headers["Authorization"] = `Bearer ${access}`;
          }
        } catch (_) { 
          /* Non-fatal: continue without tokens */ 
        }

        // Make authenticated API request
        const res = await fetch(endpoint, { headers });
        const contentType = res.headers.get('content-type') || '';
        
        // Read response body
        let bodyText = '';
        try { 
          bodyText = await res.text(); 
        } catch (_) { 
          bodyText = ''; 
        }
        
        // Handle non-success responses
        if (!res.ok) {
          const snippet = bodyText.slice(0, 180).replace(/\s+/g,' ').trim();
          throw new Error(`Profile fetch failed (${res.status}) ${snippet ? '- ' + snippet : ''}`);
        }
        
        // Parse JSON response
        let data;
        if (/json/i.test(contentType)) {
          try {
            data = JSON.parse(bodyText || 'null');
          } catch (e) {
            console.warn('[UserProfile] JSON parse error; body starts with:', bodyText.slice(0,120));
            throw new Error('Invalid JSON in profile response');
          }
        } else {
          // Handle unexpected content types (e.g., HTML error pages)
          console.warn('[UserProfile] Non-JSON profile response', { 
            endpoint, 
            contentType, 
            preview: bodyText.slice(0,200) 
          });
          throw new Error('Unexpected HTML response – check REACT_APP_USERS_BASE_URL');
        }
        
        // Update state if component still mounted
        if (!abort) setProfile(data);
        
      } catch (e) {
        if (!abort) {
          const errorMessage = e instanceof Error ? e.message : "Failed to load profile";
          setProfileError(errorMessage);
          console.error('Profile fetch error:', e);
        }
      } finally {
        if (!abort) setProfileLoading(false);
      }
    })();
    
    // Cleanup function to prevent state updates after unmount
    return () => { abort = true; };
  }, [basicInfo, state, ctx]);

  // Extract user profile fields with fallback values
  const givenName = basicInfo?.given_name || state?.given_name || "";
  const familyName = basicInfo?.family_name || state?.family_name || "";
  const locale = basicInfo?.locale || "";
  const updatedAt = basicInfo?.updated_at || "";
  const picture = basicInfo?.picture || "";

  return (
    <Card style={{ 
      background: COLORS.background, 
      border: `1px solid ${COLORS.border}`, 
      borderRadius: 20, 
      padding: 14 
    }}>
      <Card style={{ 
        background: COLORS.background, 
        border: `1px solid ${COLORS.border}`, 
        borderRadius: 16, 
        padding: 20, 
        boxShadow: '0 4px 12px -2px rgba(0,58,103,0.08)', 
        color: COLORS.primary 
      }}>
        <h2 style={{ marginTop: 0, marginBottom: 12, color: COLORS.primary }}>
          User Profile
        </h2>

        {/* Loading and Error States */}
        {loading && <Loading message="Loading user details…" />}
        {error && (
          <div style={{ color: COLORS.error, marginBottom: 12 }}>{error}</div>
        )}
        {profileLoading && <Loading message="Loading profile…" />}
        {profileError && (
          <div style={{ color: COLORS.error, marginBottom: 12 }}>{profileError}</div>
        )}

        {/* Profile Information Grid */}
        <div style={{ display: 'grid', gap: 8 }}>
          {/* Asgardeo Profile Fields */}
          {givenName && (
            <div>
              <b style={{ color: COLORS.primary }}>Given name:</b> {givenName}
            </div>
          )}
          {familyName && (
            <div>
              <b style={{ color: COLORS.primary }}>Family name:</b> {familyName}
            </div>
          )}
          {locale && (
            <div>
              <b style={{ color: COLORS.primary }}>Locale:</b> {locale}
            </div>
          )}
          {updatedAt && (
            <div>
              <b style={{ color: COLORS.primary }}>Updated:</b> {String(updatedAt)}
            </div>
          )}
          
          {/* Backend Profile Fields (Extended Information) */}
          {profile?.first_name && (
            <div>
              <b style={{ color: COLORS.primary }}>First name:</b> {profile.first_name}
            </div>
          )}
          {profile?.last_name && (
            <div>
              <b style={{ color: COLORS.primary }}>Last name:</b> {profile.last_name}
            </div>
          )}
          {profile?.user_id && (
            <div>
              <b style={{ color: COLORS.primary }}>Employee ID:</b> {profile.employee_id}
            </div>
          )}
          {profile?.department && (
            <div>
              <b style={{ color: COLORS.primary }}>Department:</b> {profile.department}
            </div>
          )}
        </div>

        {/* Profile Picture Display */}
        {picture && (
          <div style={{ marginTop: 12 }}>
            <img
              src={picture}
              alt="Profile"
              width={72}
              height={72}
              style={{ 
                borderRadius: 12, 
                border: "1px solid var(--border)" 
              }}
            />
          </div>
        )}
      </Card>
    </Card>
  );
}
