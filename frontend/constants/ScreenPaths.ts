export enum ScreenPaths {
  STORE = "/(tabs)/apps/store",
  MICRO_APP = "/micro-app",
  PROFILE = "/(tabs)/profile",
  UPDATE = "/update",
  LOGIN = "/login"
}
function getScreenPath(screen: ScreenPaths): string {
  return screen;
}