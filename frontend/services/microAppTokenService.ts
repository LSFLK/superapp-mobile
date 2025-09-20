// import axios from "axios";
import { apiRequest } from "@/utils/requestHandler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import dayjs from "dayjs";
import { BASE_URL, MICROAPP_TOKEN_STORAGE_KEY } from "@/constants/Constants";

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
 * Interface for cached microapp token data
 */
interface CachedMicroAppToken extends MicroAppTokenResponse {
  emp_id: string;
  app_id: string;
  cachedAt: number;
}

/**
 * Helper function to check if a token is expired
 * 
 * @param token - The JWT token string
 * @returns boolean - true if token is expired, false otherwise
 */
const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<{ exp: number }>(token);
    return dayjs.unix(decoded.exp).isBefore(dayjs());
  } catch {
    return true; // Assume expired if decoding fails
  }
};

/**
 * Generate storage key for microapp token
 * 
 * @param emp_id - Employee ID
 * @param app_id - App ID
 * @returns string - Storage key for the token
 */
const getTokenStorageKey = (emp_id: string, app_id: string): string => {
  return `${MICROAPP_TOKEN_STORAGE_KEY}-${emp_id}-${app_id}`;
};

/**
 * Get cached microapp token from storage
 * 
 * @param emp_id - Employee ID
 * @param app_id - App ID
 * @returns Promise<CachedMicroAppToken | null> - Cached token data or null if not found
 */
const getCachedToken = async (emp_id: string, app_id: string): Promise<CachedMicroAppToken | null> => {
  try {
    const storageKey = getTokenStorageKey(emp_id, app_id);
    const cachedData = await AsyncStorage.getItem(storageKey);
    
    if (!cachedData) {
      return null;
    }

    const tokenData: CachedMicroAppToken = JSON.parse(cachedData);
    return tokenData;
  } catch (error) {
    console.error("Error getting cached token:", error);
    return null;
  }
};

/**
 * Save microapp token to storage
 * 
 * @param emp_id - Employee ID
 * @param app_id - App ID
 * @param tokenData - Token data to cache
 */
const saveTokenToCache = async (emp_id: string, app_id: string, tokenData: MicroAppTokenResponse): Promise<void> => {
  try {
    const storageKey = getTokenStorageKey(emp_id, app_id);
    const cachedData: CachedMicroAppToken = {
      ...tokenData,
      emp_id,
      app_id,
      cachedAt: Date.now()
    };

    await AsyncStorage.setItem(storageKey, JSON.stringify(cachedData));
    console.log(`Microapp token cached for app: ${app_id}, emp: ${emp_id}`);
  } catch (error) {
    console.error("Error saving token to cache:", error);
  }
};

/**
 * Fetches a microapp token from the backend with caching support
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

    // Check for cached token first
    const cachedToken = await getCachedToken(emp_id, app_id);
    if (cachedToken) {
      // Check if cached token is still valid
      if (!isTokenExpired(cachedToken.token)) {
        console.log(`Using cached microapp token for app: ${app_id}, emp: ${emp_id}`);
        return {
          token: cachedToken.token,
          expiresAt: cachedToken.expiresAt
        };
      } else {
        console.log(`Cached token expired for app: ${app_id}, emp: ${emp_id}. Fetching new token...`);
      }
    } else {
      console.log(`No cached token found for app: ${app_id}, emp: ${emp_id}. Fetching new token...`);
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

    // Use apiRequest to ensure authorization headers and token refresh are handled
    const response = await apiRequest(
      {
        url: fullUrl,
        method: "GET",
        timeout: 10000,
      },
      // This function doesn't have an onLogout callback in its signature; pass a noop
      async () => Promise.resolve()
    );

    if (!response || response.status !== 200) {
      throw new Error(`Failed to fetch microapp token: ${response?.status || "no response"}`);
    }

    const tokenData: MicroAppTokenResponse = response.data;

    if (!tokenData || !tokenData.token) {
      throw new Error("Invalid response: token field is missing");
    }

    // Cache the new token
    await saveTokenToCache(emp_id, app_id, tokenData);

    console.log(`Successfully fetched and cached microapp token for app: ${app_id}, emp: ${emp_id}`);
    
    return tokenData;

  } catch (error) {
    console.error("Error fetching microapp token:", error);
    
    // if (axios.isAxiosError(error)) {
    //   if (error.response) {
    //     // Server responded with an error status
    //     throw new Error(`Server error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
    //   } else if (error.request) {
    //     // Network error
    //     throw new Error("Network error: Unable to reach the server. Please check your internet connection.");
    //   }
    // }
    
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
    // If no expiration time, try to decode the JWT token
    return isTokenExpired(tokenData.token);
  }
  
  return Date.now() >= tokenData.expiresAt;
};

/**
 * Clear cached token for a specific app and employee
 * 
 * @param emp_id - Employee ID
 * @param app_id - App ID
 */
export const clearCachedToken = async (emp_id: string, app_id: string): Promise<void> => {
  try {
    const storageKey = getTokenStorageKey(emp_id, app_id);
    await AsyncStorage.removeItem(storageKey);
    console.log(`Cleared cached token for app: ${app_id}, emp: ${emp_id}`);
  } catch (error) {
    console.error("Error clearing cached token:", error);
  }
};

/**
 * Clear all cached microapp tokens
 */
export const clearAllCachedTokens = async (): Promise<void> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const tokenKeys = allKeys.filter(key => key.startsWith(MICROAPP_TOKEN_STORAGE_KEY));
    
    if (tokenKeys.length > 0) {
      await AsyncStorage.multiRemove(tokenKeys);
      console.log(`Cleared ${tokenKeys.length} cached microapp tokens`);
    }
  } catch (error) {
    console.error("Error clearing all cached tokens:", error);
  }
};

/**
 * Get cached token without making API call (for checking cache status)
 * 
 * @param emp_id - Employee ID
 * @param app_id - App ID
 * @returns Promise<MicroAppTokenResponse | null> - Cached token data or null if not found/expired
 */
export const getCachedMicroAppToken = async (emp_id: string, app_id: string): Promise<MicroAppTokenResponse | null> => {
  const cachedToken = await getCachedToken(emp_id, app_id);
  
  if (!cachedToken) {
    return null;
  }
  
  // Check if token is still valid
  if (isTokenExpired(cachedToken.token)) {
    // Token is expired, remove from cache
    await clearCachedToken(emp_id, app_id);
    return null;
  }
  
  return {
    token: cachedToken.token,
    expiresAt: cachedToken.expiresAt
  };
};