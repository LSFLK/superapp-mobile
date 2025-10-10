import ballerina/jwt;

public isolated function getGroupsFromPayload(jwt:Payload payload) returns string[] {
    string[] groups = [];
    if payload.hasKey("groups") {
        json[] groupsJson = <json[]>payload["groups"];
        foreach json g in groupsJson {
            if g is string {
                groups.push(g);
            }
        }
    }
    return groups;
}

public isolated function isAllowed(string endpoint, string[] groups) returns boolean {
    string[]? requiredRoles = ENDPOINT_ROLES[endpoint];
    if requiredRoles is () {
        // No rule defined → public for authenticated users
        return true;
    }
    // Check all required roles are present in groups
    foreach string role in requiredRoles {
        if groups.indexOf(role) is null {
            return false;
        }
    }
    return true;
};
