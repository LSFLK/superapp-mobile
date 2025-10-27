# Entity User Service Implementation.
public isolated distinct class EntityAsUserInfoService {
    *UserInfoService;

    public isolated function getUserInfoByEmail(string email) returns User|error {
        // example:
        // return entity:fetchEmployeesBasicInfo(email);
        return error("Not implemented yet.");
    }

    public isolated function getAllUsers() returns User[]|error {
        return error("Not implemented yet.");
    }

    public isolated function saveUser(User user) returns error? {
        return error("Not implemented yet.");
    }

    public isolated function saveUsers(User[] users) returns error? {
        return error("Not implemented yet.");
    }

    public isolated function deleteUserByEmail(string email) returns error? {
        return error("Not implemented yet.");
    }
}
