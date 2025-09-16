<<<<<<< HEAD
// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.
=======
>>>>>>> 5b8687358412d7783d27a172e47e38deb9ccc564
const createAuthRequestBody = ({
  grantType,
  code,
  redirectUri,
  clientId,
  codeVerifier,
  refreshToken,
  subjectToken,
  subjectTokenType,
  requestedTokenType,
  scope,
}: {
  grantType:
    | "authorization_code"
    | "refresh_token"
    | "urn:ietf:params:oauth:grant-type:token-exchange";
  code?: string;
  redirectUri?: string;
  clientId?: string;
  codeVerifier?: string;
  refreshToken?: string;
  subjectToken?: string;
  subjectTokenType?: "urn:ietf:params:oauth:token-type:jwt";
  requestedTokenType?: "urn:ietf:params:oauth:token-type:access_token";
  scope?: string;
}): string => {
  return new URLSearchParams({
    grant_type: grantType,
    ...(code && { code }),
    ...(redirectUri && { redirect_uri: redirectUri }),
    ...(clientId && { client_id: clientId }),
    ...(codeVerifier && { code_verifier: codeVerifier }),
    ...(refreshToken && { refresh_token: refreshToken }),
    ...(subjectToken && { subject_token: subjectToken }),
    ...(subjectTokenType && { subject_token_type: subjectTokenType }),
    ...(requestedTokenType && { requested_token_type: requestedTokenType }),
    ...(scope && { scope }),
  }).toString();
};

export default createAuthRequestBody;
