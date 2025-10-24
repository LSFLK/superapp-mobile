// Types for MicroApp and MicroAppRole

export type MicroAppRole = {
  /**
   * Role/group name that has access to the microapp
   * @minLength 1
   */
  role: string;
};

export type MicroAppVersion = {
  version: string;
  build: number;
  releaseNotes: string;
  iconUrl: string;
  downloadUrl: string;
};

export type MicroApp = {
  name: string;
  description: string;
  promoText: string;
  appId: string;
  iconUrl: string;
  bannerImageUrl: string;
  isMandatory: number;
  versions: MicroAppVersion[];
  roles: MicroAppRole[];
};
