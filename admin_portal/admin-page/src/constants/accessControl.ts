// Access control related constants

// Singular named export for the superapp admin group
export const SUPERAPP_ADMIN_GROUP = "superapp_admin" as const;

// Default required groups for RBAC components
export const DEFAULT_REQUIRED_GROUPS = [SUPERAPP_ADMIN_GROUP] as const;
