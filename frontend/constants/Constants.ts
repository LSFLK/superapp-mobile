import { Platform } from "react-native";

export const CLIENT_ID = process.env.EXPO_PUBLIC_CLIENT_ID ?? "";
export const REDIRECT_URI = process.env.EXPO_PUBLIC_REDIRECT_URI ?? "";
export const TOKEN_URL = process.env.EXPO_PUBLIC_TOKEN_URL ?? "";
export const LOGOUT_URL = process.env.EXPO_PUBLIC_LOGOUT_URL ?? "";
export const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL ?? "https://41200aa1-4106-4e6c-babf-311dce37c04a-dev.e1-us-east-azure.choreoapis.dev/gov-superapp/superapp-backend-auth-les/v1.0";

export const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "";
export const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? "";
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";

//Authenticator Micro App ID
export const AUTHENTICATOR_APP_ID =
  process.env.EXPO_PUBLIC_AUTHENTICATOR_APP_ID ?? "";

export const SUCCESS = "success";
export const APPS = "apps";
export const AUTH_DATA = "authData";
export const DOWNLOADED = "downloaded";
export const NOT_DOWNLOADED = "not-downloaded";
export const USER_CONFIGURATIONS = "user-configurations";
export const APP_LIST_CONFIG_KEY = "superapp.apps.list";
export const USER_INFO = "user-info";
export const LAST_ACTIVE_PATH_KEY = "last-active-path";
export const BASE_URL_WEB = "https://opensource.lk/";
export const LIBRARY_ARTICLE_FALLBACK_IMAGE =
  process.env.EXPO_PUBLIC_LIBRARY_ARTICLE_FALLBACK_IMAGE ?? "";
export const DEVELOPER_APP_DEFAULT_URL =
  process.env.EXPO_PUBLIC_DEVELOPER_APP_DEFAULT_URL ?? "";

export const GOOGLE_ACCESS_TOKEN_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_ACCESS_TOKEN_KEY ?? "";
export const GOOGLE_REFRESH_TOKEN_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_REFRESH_TOKEN_KEY ?? "";
export const GOOGLE_USER_INFO_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_USER_INFO_KEY ?? "";
export const GOOGLE_SCOPES = [
  "openid",
  "profile",
  "email",
  "https://www.googleapis.com/auth/drive.appdata",
];
export const GOOGLE_USER_INFO_URL =
  process.env.EXPO_PUBLIC_GOOGLE_USER_INFO_URL ?? "";
export const GOOGLE_TOKEN_URL = process.env.EXPO_PUBLIC_GOOGLE_TOKEN_URL ?? "";
export const GOOGLE_DRIVE_UPLOAD_URL =
  process.env.EXPO_PUBLIC_GOOGLE_DRIVE_UPLOAD_URL ?? "";
export const GOOGLE_DRIVE_LIST_FILES_URL =
  process.env.EXPO_PUBLIC_GOOGLE_DRIVE_LIST_FILES_URL ?? "";

export const GOOGLE_DRIVE_FILE_DOWNLOAD_URL = (fileId: string) =>
  `${
    process.env.EXPO_PUBLIC_GOOGLE_DRIVE_FILE_DOWNLOAD_URL ?? ""
  }${fileId}?alt=media`;

export const GOOGLE_TOKEN_INFO_URL = (accessToken: string) =>
  `${process.env.EXPO_PUBLIC_GOOGLE_TOKEN_INFO_URL ?? ""}${accessToken}`;

// export const EVENTS_URL = process.env.EXPO_PUBLIC_EVENTS_URL ?? "";
// export const EVENTS_STORAGE_KEY = "cached_events_feed";
// export const EVENTS_TIMESTAMP_KEY = "cached_events_timestamp";

// export const NEWS_URL = process.env.EXPO_PUBLIC_NEWS_URL ?? "";
// export const NEWS_STORAGE_KEY = "cached_news_feed";
// export const NEWS_TIMESTAMP_KEY = "cached_news_timestamp";

export const isAndroid = Platform.OS === "android";
export const isIos = Platform.OS === "ios";