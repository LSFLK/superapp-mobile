import superapp_mobile_service.database;

type UserInfoService distinct object {
    public isolated function getUserInfoByEmail(string email) returns User|error?;
    public isolated function getAllUsers() returns User[]|error?;
    public isolated function saveUser(User user) returns error?;
    public isolated function saveUsers(User[] users) returns error?;
    public isolated function deleteUserByEmail(string email) returns error?;
};

isolated distinct class DatabaseAsUserInfoService {
    *UserInfoService;

    public isolated function getUserInfoByEmail(string email) returns User|error? {
        return database:getUserInfoByEmail(email);
    }

    public isolated function getAllUsers() returns User[]|error? {
        return database:getAllUsers();
    }

    public isolated function saveUser(User user) returns error? {
        return database:createUserInfo(user.workEmail, user.firstName, user.lastName, user.userThumbnail, user.location);
    }

    public isolated function saveUsers(User[] users) returns error? {
        return database:createBulkUsers(users);
    }

    public isolated function deleteUserByEmail(string email) returns error? {
        return database:deleteUser(email);
    }
}

isolated distinct class HRentityAsUserInfoService {
    *UserInfoService;

    public isolated function getUserInfoByEmail(string email) returns User|error {
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

public isolated function createUserInfoService(string 'type) returns UserInfoService|error {
    if ('type == "database") {
        return new DatabaseAsUserInfoService();
    }
    if ('type == "hr-entity") {
        return new HRentityAsUserInfoService();
    }
    return error("Unknown user info service type");
}