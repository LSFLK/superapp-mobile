// If you need to add any other roles to a specific endpoint the mapping should be added here.
public const map<string[]> ENDPOINT_ROLES = {
    "/micro-apps/upload": [SUPERAPP_ADMIN_ROLE]
};
