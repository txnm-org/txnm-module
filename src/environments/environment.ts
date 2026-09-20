export const environment = {
  production: false,
  // Routed through txnm-gateway-service (port 9090), not straight to txnm-mvp (8241) anymore -
  // see txnm-arch-docs/arch02_target_architecture.md, sequencing step 3.
  apiUrl: 'http://localhost:9090/api',
  // kc-auth-service via the same gateway, but its routes are /auth/** and /users/** at the
  // gateway root - NOT under /api (see txnm-gateway-service's route table). Kept as a separate
  // base rather than folding into apiUrl for that reason.
  authApiUrl: 'http://localhost:9090',
  appName: 'TXNM Development',
  version: '1.0.0'
};
