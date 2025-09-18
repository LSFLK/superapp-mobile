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

import axios from "axios";
import { BASE_URL } from "@/constants/Constants";

/**
 * Interface for microapp token request parameters
 */
export interface MicroAppTokenParams {
  emp_id: string;
  app_id: string;
}

/**
 * Interface for microapp token response
 */
export interface MicroAppTokenResponse {
  token: string;
  expiresAt?: number;
  // Add other fields as needed based on your backend response
}

/**
 * Fetches a microapp token from the backend
 * 
 * @param params - Object containing emp_id and app_id
 * @returns Promise<MicroAppTokenResponse> - The microapp token data
 * @throws Error if the request fails
 */
export const fetchMicroAppToken = async (
  params: MicroAppTokenParams
): Promise<MicroAppTokenResponse> => {
  try {
    const { emp_id, app_id } = params;

    if (!emp_id || !app_id) {
      throw new Error("Both emp_id and app_id are required parameters");
    }

    if (!BASE_URL) {
      throw new Error("BASE_URL is not defined. Check your environment variables.");
    }

    // Construct the URL with query parameters
    const url = `${BASE_URL}/micro-app-token`;
    const queryParams = new URLSearchParams({
      emp_id,
      micro_app_id: app_id
    });

    const fullUrl = `${url}?${queryParams.toString()}`;
    
    console.log(`Fetching microapp token from: ${fullUrl}`);

    const response = await axios.get(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 seconds timeout
    });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch microapp token: ${response.status} - ${response.statusText}`);
    }

    const tokenData: MicroAppTokenResponse = response.data;

    if (!tokenData.token) {
      throw new Error("Invalid response: token field is missing");
    }

    console.log(`Successfully fetched microapp token for app: ${app_id}, emp: ${emp_id}`);
    
    return tokenData;

  } catch (error) {
    console.error("Error fetching microapp token:", error);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with an error status
        throw new Error(`Server error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
      } else if (error.request) {
        // Network error
        throw new Error("Network error: Unable to reach the server. Please check your internet connection.");
      }
    }
    
    // Re-throw the original error if it's not an Axios error
    throw error;
  }
};

/**
 * Utility function to check if a token is expired (if expiration info is available)
 * 
 * @param tokenData - The token response data
 * @returns boolean - true if token is expired, false otherwise
 */
export const isMicroAppTokenExpired = (tokenData: MicroAppTokenResponse): boolean => {
  if (!tokenData.expiresAt) {
    return false; // If no expiration time, consider it valid
  }
  
  return Date.now() >= tokenData.expiresAt;
};