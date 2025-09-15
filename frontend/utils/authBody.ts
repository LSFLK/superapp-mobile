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
