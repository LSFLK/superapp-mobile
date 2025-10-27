import superapp_mobile_service.database;

# Database User Service Implementation.
public isolated distinct class DatabaseAsUserInfoService {
    *UserInfoService;

    public isolated function getUserInfoByEmail(string email) returns User|error? {
        return database:getUserInfoByEmail(email);
    }

    public isolated function getAllUsers() returns User[]|error? {
        return database:getAllUsers();
    }

    public isolated function saveUser(User user) returns error? {
        return database:upsertUserInfo(user);
    }

    public isolated function saveUsers(User[] users) returns error? {
        return database:upsertBulkUsers(users);
    }

    public isolated function deleteUserByEmail(string email) returns error? {
        return database:deleteUser(email);
    }
}
