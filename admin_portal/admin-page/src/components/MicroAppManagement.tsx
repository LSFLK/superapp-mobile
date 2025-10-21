/**
 * MicroAppManagement Component
 */
import React, { useEffect, useState, useCallback } from "react";
import { useAuthContext } from "@asgardeo/auth-react";
import type { AuthContextInterface } from "@asgardeo/auth-react";
import UploadMicroApp from "./UploadMicroApp";
import Button from "./common/Button";
import Loading from "./common/Loading";
import Card from "./common/Card";
import { COLORS, COMMON_STYLES } from "../constants/styles";
import { getEndpoint } from "../constants/api";
import { API_KEYS } from "../constants/apiKeys";

// UploadMicroApp already exports its props type; use the component directly with that type

type MicroApp = {
  micro_app_id?: string;
  app_id?: string;
  name?: string;
  version?: string;
  description?: string;
};

// Common container keys likely used by various backends for array payloads.
// Use case-insensitive lookup to avoid duplicate variants like "microApps" vs "microapps".
const CONTAINER_KEYS_LOWER = [
  "items",
  "data",
  "content",
  "results",
  "records",
  "list",
  "microapps",
] as const;

// UploadMicroApp is now fully typed

export default function MicroAppManagement(): React.ReactElement | null {
  // Authentication context for secure API calls
  const auth: AuthContextInterface = useAuthContext();

  // Component state management
  const [showUpload, setShowUpload] = useState<boolean>(false);
  const [microApps, setMicroApps] = useState<MicroApp[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [listError, setListError] = useState<string>("");

  const fetchMicroApps = useCallback(async () => {
    setLoadingList(true);
    setListError("");

    try {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (auth?.state?.isAuthenticated) {
        // Use access token for both Authorization and x-jwt-assertion (invoker).
        if (typeof auth.getAccessToken === "function") {
          try {
            const access = await auth.getAccessToken();
            if (access) {
              headers["Authorization"] = `Bearer ${access}`;
              headers["x-jwt-assertion"] = access;
            }
          } catch (e) {
            const err = e instanceof Error ? e : new Error(String(e));
            console.warn("Authentication token acquisition failed:", err);
          }
        }
      }

      const endpoint = getEndpoint(API_KEYS.MICROAPPS_LIST);
      console.log("[MicroAppManagement] Fetching micro-apps from", endpoint);
      const res = await fetch(endpoint, { headers });

      if (!res.ok) {
        throw new Error(`Failed to load micro-apps (${res.status})`);
      }

      // Attempt robust JSON parsing and normalization
      type MicroAppsContainer = {
        items?: MicroApp[];
        data?: MicroApp[] | Record<string, unknown>;
        content?: MicroApp[];
        results?: MicroApp[];
        records?: MicroApp[];
        list?: MicroApp[];
        microapps?: MicroApp[];
        [k: string]: unknown;
      };
      let data: MicroApp[] | MicroAppsContainer | null = null;
      try {
        data = (await res.json()) as MicroApp[] | MicroAppsContainer;
      } catch (err) {
        console.error("[MicroAppManagement] Non-JSON response from endpoint", {
          endpoint,
        });
        throw new Error("Unexpected response format (non-JSON)");
      }

      // Case-insensitive getter for object properties
      const getCaseInsensitive = (
        obj: Record<string, any>,
        key: string,
      ): any => {
        const found = Object.keys(obj).find(
          (k) => k.toLowerCase() === key.toLowerCase(),
        );
        return found ? obj[found] : undefined;
      };

      const normalize = (
        d: MicroApp[] | MicroAppsContainer | null,
      ): MicroApp[] => {
        if (Array.isArray(d)) return d;
        if (!d || typeof d !== "object") return [];

        const obj = d as Record<string, any>;
        // Check common container keys (case-insensitive) including a single nested level
        for (const containerKey of CONTAINER_KEYS_LOWER) {
          const containerValue = getCaseInsensitive(obj, containerKey);
          if (Array.isArray(containerValue)) return containerValue as MicroApp[];
          if (containerValue && typeof containerValue === "object") {
            const nestedObject = containerValue as Record<string, any>;
            for (const nestedKey of CONTAINER_KEYS_LOWER) {
              const nestedValue = getCaseInsensitive(nestedObject, nestedKey);
              if (Array.isArray(nestedValue)) return nestedValue as MicroApp[];
            }
          }
        }
        return [];
      };

      const normalized = normalize(data);
      console.log(
        "[MicroAppManagement] Received micro-apps count:",
        normalized.length,
      );
      setMicroApps(normalized);
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "Error loading apps";
      setListError(errorMessage);
      console.error("Micro-app fetch error:", e);
    } finally {
      setLoadingList(false);
    }
  }, [auth]);

  useEffect(() => {
    fetchMicroApps();
  }, [fetchMicroApps]);

  return (
    <div style={{ color: COLORS.primary, lineHeight: 1.15 }}>
      {!showUpload && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h2 style={{ margin: 0, color: COLORS.primary }}>
            Available Micro Apps
          </h2>
          <div style={{ display: "flex", gap: 0, marginTop: 0 }}>
            <Button onClick={fetchMicroApps} disabled={loadingList}>
              {loadingList ? "Refreshing…" : "Refresh"}
            </Button>

            <Button onClick={() => setShowUpload((s) => !s)}>
              {showUpload ? "Close Upload" : "Add new"}
            </Button>
          </div>
        </div>
      )}

      {showUpload && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 12,
          }}
        >
          <Button onClick={() => setShowUpload(false)}>Close</Button>
        </div>
      )}

      {listError && !showUpload && (
        <Card
          style={{
            ...(COMMON_STYLES?.alertError || {
              background: COLORS.errorSurfaceBackground || "#2d1f1f",
              border: `1px solid ${COLORS.errorSurfaceBorder || "#5a2f2f"}`,
              color: COLORS.errorSurfaceText || "#fca5a5",
              borderRadius: 12,
            }),
            padding: 12,
            marginBottom: 16,
          }}
        >
          {listError}
        </Card>
      )}

      {showUpload && (
        <Card style={{ padding: 16, marginBottom: 20 }}>
          <UploadMicroApp
            onUploaded={() => {
              fetchMicroApps();
              setShowUpload(false);
            }}
          />
        </Card>
      )}

      {!showUpload && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 12,
          }}
        >
          {loadingList && microApps.length === 0 && (
            <Loading message="Loading micro-apps…" />
          )}

          {!loadingList && microApps.length === 0 && !listError && (
            <Card
              style={{
                padding: 16,
                background: COLORS.inverted,
                color: COLORS.invertedText,
              }}
            >
              No micro-apps found.
            </Card>
          )}

          {microApps.map((app) => (
            <Card
              key={app.micro_app_id || app.app_id || Math.random().toString(36)}
              style={{
                padding: 16,
                background: COLORS.cardBackground,
                border: `1px solid ${COLORS.borderAlt || COLORS.border}`,
                cursor: "default",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                borderRadius: 14,
                boxShadow: "0 3px 8px -2px rgba(0,58,103,0.15)",
              }}
            >
              <div style={{ display: "flex", gap: 12 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    background: COLORS.borderAlt || "#e6f4ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    borderRadius: 8,
                    color: COLORS.accent || "#1677ff",
                  }}
                >
                  {(app.name ? app.name : "?").slice(0, 2).toUpperCase()}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: COLORS.text }}>
                    {(() => {
                      if (typeof app.name === "string" && app.name.length > 1) {
                        return app.name;
                      }
                      if (!app.name) {
                        return app.micro_app_id || app.app_id || "";
                      }
                      return app.micro_app_id || app.app_id || app.name;
                    })()}
                  </div>
                  {typeof app.version === "string" && app.version.trim() ? (
                    <div style={{ color: COLORS.textMuted, fontSize: 12 }}>
                      v{app.version}
                    </div>
                  ) : null}
                </div>
              </div>

              <div
                style={{
                  color: COLORS.textSubtle || "#595959",
                  fontSize: 12,
                  flexGrow: 1,
                }}
              >
                {app.description || "No description"}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
