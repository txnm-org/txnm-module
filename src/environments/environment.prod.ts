export const environment = {
    production: true,
    apiUrl: 'http://13.233.254.231:8241/api',
    // Placeholder - txnm-gateway-service/kc-auth-service aren't deployed to this environment yet
    // (prod apiUrl above still hits txnm-mvp directly, unlike the dev gateway setup). Update once
    // they are; see txnm-arch-docs/arch03_frontend_auth_integration_gaps.md.
    authApiUrl: 'http://13.233.254.231:9090',
    appName: 'TXNM',
    version: '1.0.0'
};