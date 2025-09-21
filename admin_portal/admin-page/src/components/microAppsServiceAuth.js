// Lightweight indirection to allow service functions to obtain auth context
// without passing it explicitly through many layers. Upload component already
// uses useAuthContext directly; here we expose a setter so a top-level component
// can register the current context instance.

let authCtx = null;
export function registerAuthContext(ctx) {
  authCtx = ctx;
}
export function getAuthContext() {
  return authCtx;
}
