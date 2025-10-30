export interface MicroAppVersion {
  version: string;
  build: number;
  releaseNotes: string;
  iconUrl: string;
  downloadUrl: string;
}

export interface MicroAppRole {
  role: string;
}

export interface MicroApp {
  appId: string;
  name: string;
  description: string;
  promoText: string;
  iconUrl: string;
  bannerImageUrl: string;
  isMandatory: number;
  versions: MicroAppVersion[];
  roles: MicroAppRole[];
}
