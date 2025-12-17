// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.
export const RBAC_CONFIG = {
  /**
   * List of groups allowed to access the admin portal
   * User's token must contain at least one of these groups in the 'groups' claim
   */
  allowedGroups: ['superapp-admin', 'admin'] as const,
} as const;

/**
 * Check if user has access based on their groups
 * @param userGroups - Array of groups from user's token
 * @returns true if user belongs to at least one allowed group
 */
export function hasAccess(userGroups?: string[]): boolean {
  if (!userGroups || userGroups.length === 0) {
    return false;
  }

  return RBAC_CONFIG.allowedGroups.some(allowedGroup => 
    userGroups.includes(allowedGroup)
  );
}
