import { AUTH_DATA } from "@/constants/Constants";
import { refreshAccessToken } from "@/services/authService";
import axios, { AxiosRequestConfig } from "axios";
import { jwtDecode } from "jwt-decode";
import dayjs from "dayjs";
import AsyncStorage from "@react-native-async-storage/async-storage";

// General API request handler
export const apiRequest = async (
  config: AxiosRequestConfig,
  onLogout: () => Promise<void>
) => {
  let accessToken = await getAccessToken(); // Get stored access token

  // If no access token, return early
  if (!accessToken) return;

  // Check if token is expired before making request
  if (isAccessTokenExpired(accessToken)) {
    const newAuthData = await refreshAccessToken(onLogout);

    if (!newAuthData?.accessToken) {
      return; // Logout is triggered inside refreshAccessToken
    }
    accessToken = newAuthData.accessToken;
  }

  // Set Authorization Header
  config.headers = {
    ...config.headers,
    Authorization: `Bearer ${accessToken}`,
    "x-jwt-assertion": `${accessToken}`,
  };

  try {
    return await axios(config); // Make the API request
  } catch (error: any) {
    if (error.response?.status === 401) {
      const newAuthData = await refreshAccessToken(onLogout);
      if (newAuthData?.accessToken) {
        // Retry the request with the new token
        config.headers.Authorization = `Bearer ${newAuthData.accessToken}`;

        try {
          return await axios(config);
        } catch (retryError: any) {
          // 401 after refresh: Likely another issue, not token expiration
          throw retryError;
        }
      }
    }

    throw error;
  }
};

// Helper function to check if the token is expired
const isAccessTokenExpired = (accessToken: string): boolean => {
  try {
    const decoded = jwtDecode<{ exp: number }>(accessToken);
    return dayjs.unix(decoded.exp).isBefore(dayjs());
  } catch {
    return true; // Assume expired if decoding fails
  }
};

// Helper function to get the stored access token
const getAccessToken = async (): Promise<string> => {
  const storedData = await AsyncStorage.getItem(AUTH_DATA);
  if (!storedData) return "";
  return JSON.parse(storedData)?.accessToken || "";
};
