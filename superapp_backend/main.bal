// import ballerina/io;

// public function main() {
//     io:println("Hello, World!");
// }

import ballerina/http;

configurable int port = ?; // Choreo will inject PORT

service / on new http:Listener(port) {
    resource function get health() returns string {
        return "ok";
    }
}