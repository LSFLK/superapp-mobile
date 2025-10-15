#!/usr/bin/env node
/**
 * Simple client credentials token fetcher for Asgardeo.
 * Requires env vars:
 *   ASGARDEO_BASE_URL  e.g. https://api.asgardeo.io/t/lsfproject
 *   ASGARDEO_CLIENT_ID
 *   ASGARDEO_CLIENT_SECRET
 *   ASGARDEO_SCOPE (optional, default: openid)
 */
import https from "https";
import { URLSearchParams } from "url";

const {
  ASGARDEO_BASE_URL,
  ASGARDEO_CLIENT_ID,
  ASGARDEO_CLIENT_SECRET,
  ASGARDEO_SCOPE = "openid",
} = process.env;

if (!ASGARDEO_BASE_URL || !ASGARDEO_CLIENT_ID || !ASGARDEO_CLIENT_SECRET) {
  console.error(
    "Missing required env vars. Provide ASGARDEO_BASE_URL, ASGARDEO_CLIENT_ID, ASGARDEO_CLIENT_SECRET",
  );
  process.exit(1);
}

const tokenEndpoint = `${ASGARDEO_BASE_URL.replace(/\/$/, "")}/oauth2/token`;

const body = new URLSearchParams({
  grant_type: "client_credentials",
  client_id: ASGARDEO_CLIENT_ID,
  client_secret: ASGARDEO_CLIENT_SECRET,
  scope: ASGARDEO_SCOPE,
}).toString();

const url = new URL(tokenEndpoint);

const opts = {
  method: "POST",
  hostname: url.hostname,
  path: url.pathname + url.search,
  headers: {
    "content-type": "application/x-www-form-urlencoded",
    "content-length": Buffer.byteLength(body),
  },
};

const req = https.request(opts, (res) => {
  let data = "";
  res.on("data", (c) => (data += c));
  res.on("end", () => {
    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
      try {
        const json = JSON.parse(data);
        console.log("ACCESS TOKEN (client_credentials):");
        console.log(json.access_token);
      } catch (e) {
        console.error("Failed to parse response", e, data);
        process.exit(1);
      }
    } else {
      console.error("Token request failed", res.statusCode, data);
      process.exit(1);
    }
  });
});
req.on("error", (e) => {
  console.error("Request error", e);
  process.exit(1);
});
req.write(body);
req.end();
