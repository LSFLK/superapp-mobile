# User Information Service Interface.
public type UserInfoService distinct object {
    public isolated function getUserInfoByEmail(string email) returns User|error?;
    public isolated function getAllUsers() returns User[]|error?;
    public isolated function saveUser(User user) returns error?;
    public isolated function saveUsers(User[] users) returns error?;
    public isolated function deleteUserByEmail(string email) returns error?;
};

# User Service Factory: Create a User Information Service.
#
# + 'type - The type of user info service to create.
# + return - The created UserInfoService or an error if creation fails.
public isolated function createUserInfoService(string 'type) returns UserInfoService|error {
    string _type = 'type.toLowerAscii().trim();
    if (_type == DATABASE_USER_INFO_SERVICE) {
        return new DatabaseAsUserInfoService();
    }
    if (_type == ENTITY_USER_INFO_SERVICE) {
        return new EntityAsUserInfoService();
    }
    return error("Unknown user info service type");
}
