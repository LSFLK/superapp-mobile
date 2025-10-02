import { BridgeFunction } from "./bridgeTypes";

/**
 * Security Audit Bridge Handler
 * 
 * This handler provides security monitoring and audit capabilities for micro-apps.
 * It allows authorized apps to report security events and request security status.
 */
export const BRIDGE_FUNCTION: BridgeFunction = {
  topic: "security_audit",
  handler: async (params, context) => {
    try {
      const { action, data } = params;

      switch (action) {
        case "report_security_event":
          // Log security events from micro-apps (e.g., suspicious activity)
          console.warn(`[SECURITY EVENT] App ${context.appID}:`, data);
          context.resolve({ logged: true });
          break;

        case "get_security_status":
          // Return security status information
          context.resolve({
            bridgeSecured: true,
            originValidated: true,
            appId: context.appID,
            timestamp: Date.now()
          });
          break;

        case "validate_content":
          // Validate content before displaying (basic XSS prevention)
          if (typeof data.content !== 'string') {
            context.reject("Invalid content type");
            return;
          }

          // Basic XSS pattern detection
          const xssPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe\b/gi
          ];

          const hasSuspiciousContent = xssPatterns.some(pattern => 
            pattern.test(data.content)
          );

          if (hasSuspiciousContent) {
            console.warn(`[SECURITY] Suspicious content detected in app ${context.appID}`);
            context.resolve({ 
              safe: false, 
              reason: "Potentially malicious content detected" 
            });
          } else {
            context.resolve({ safe: true });
          }
          break;

        default:
          context.reject(`Unknown security audit action: ${action}`);
      }
    } catch (error) {
      console.error(`[SECURITY] Bridge security audit error:`, error);
      context.reject(error instanceof Error ? error.message : String(error));
    }
  }
};