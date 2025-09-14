// // Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
// //
// // WSO2 LLC. licenses this file to you under the Apache License,
// // Version 2.0 (the "License"); you may not use this file except
// // in compliance with the License.
// // You may obtain a copy of the License at
// //
// // http://www.apache.org/licenses/LICENSE-2.0
// //
// // Unless required by applicable law or agreed to in writing,
// // software distributed under the License is distributed on an
// // "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// // KIND, either express or implied.  See the License for the
// // specific language governing permissions and limitations
// // under the License.

// # Get the employee with the given work email.
// #
// # + workEmail - Email of the employee to retrieve
// # + return - Employee with the given email or an error if the employee retrieval is unsuccessful
// public isolated function fetchEmployeesBasicInfo(string workEmail) returns Employee|error {
//     string document = string `
//         query employeeQuery($workEmail: String!) {
//             employee(email: $workEmail) {
//                 workEmail
//                 firstName
//                 lastName
//                 employeeThumbnail
//                 location
//             }
//         }
//     `;

//     EmployeeResponse|error response = hrClient->execute(document, {workEmail});
//     if response is error {
//         return response;
//     }
//     return response.data.employee;
// }
