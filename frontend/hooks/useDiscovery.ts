import { TOKEN_URL } from "@/constants/Constants";
import { useAutoDiscovery } from "expo-auth-session";

export const useDiscovery = () => {
  if (!TOKEN_URL) {
    throw new Error(
      "TOKEN_URL is not defined. Check your environment variables."
    );
  }
  return useAutoDiscovery(TOKEN_URL);
};
