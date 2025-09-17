import { AUTH_CONFIG } from "@/config/authConfig";
import { setAuth, setAuthWithCheck } from "@/context/slices/authSlice";
import { AppDispatch } from "@/context/store";
import { processNativeAuthResult } from "@/services/authService";
import { AuthorizeResult, authorize } from "react-native-app-auth";
import { useDispatch } from "react-redux";

export const useSignInWithAsgardeo = () => {
  const dispatch = useDispatch<AppDispatch>();

  const signIn = async () => {
    try {
      const authState: AuthorizeResult = await authorize(AUTH_CONFIG);
      const authData = await processNativeAuthResult(authState);
      if (authData) {
        dispatch(setAuth(authData));
        dispatch(setAuthWithCheck(authData));
      }
    } catch (error) {
      console.error("Authentication failed:", error);
    }
  };

  return signIn;
};