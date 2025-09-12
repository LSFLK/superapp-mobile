// Core payslip data model
public type Payslip record {|
    string employeeId;
    string name;
    string designation;
    string payPeriod; // Format: YYYY-MM
    float basicSalary;
    float allowances;
    float deductions;
    float netSalary;
    string? department?; // Optional field for future expansion
    string? location?; // Optional field for future expansion
|};

// API Response wrapper types
public type PayslipResponse record {|
    string status;
    string message;
    Payslip data;
|};

public type PayslipsResponse record {|
    string status;
    string message;
    Payslip[] data;
    int count;
|};

public type ErrorResponse record {|
    string status;
    string message;
    string errorCode;
    string? details?;
|};

public type HealthResponse record {|
    string status;
    string message;
    string timestamp;
    string version;
    string environment;
|};

// Request validation types
public type ValidationError record {|
    string fieldName;
    string message;
|};

// Authentication types for extensibility
public type AuthContext record {|
    string userId;
    string[] roles;
    string? token?;
    boolean isAuthenticated;
    string? department?; // For department-based filtering
|};

public type AuthConfig record {|
    boolean enabled;
    string? jwtSecret?;
    int tokenExpirySeconds;
    string[] publicEndpoints; // Endpoints that don't require auth
|};




