import { AUTH_CONFIG } from "@/config/authConfig";
import { setAuth, setAuthWithCheck } from "@/context/slices/authSlice";
import { AppDispatch } from "@/context/store";
import { processNativeAuthResult } from "@/services/authService";
import { AuthorizeResult, authorize } from "react-native-app-auth";
import { useDispatch } from "react-redux";
// import { jwtDecode } from "jwt-decode";

export const useSignInWithAsgardeo = () => {
  const dispatch = useDispatch<AppDispatch>();

  const signIn = async () => {
    try {
      const authState: AuthorizeResult = await authorize(AUTH_CONFIG);
      const authData = await processNativeAuthResult(authState);
      
      if (authData) {
        dispatch(setAuth(authData));
        
        // Decode and display ID token details
          // const decodedIdToken = jwtDecode(authData.idToken);
          // console.log("=== ID TOKEN DETAILS ===");
          // console.log("Raw ID Token:", authData.idToken);
          // console.log("Decoded ID Token:", JSON.stringify(decodedIdToken, null, 2));
          
          // // Display specific claims if they exist
          // const token = decodedIdToken as any;
          // console.log("Email:", token.email);
          // console.log("Name:", token.name);
          
        
        console.log("Authentication successful:", authData.idToken);
        // dispatch(setAuthWithCheck(authData));
    } 
  } catch (error) {
      console.error("Authentication failed:", error);
    }

  return signIn;
}
};