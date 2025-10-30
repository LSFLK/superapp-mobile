/**
 * MicroApps Service
 *
 * Service for managing micro applications
 */

import { apiService } from "./api.service";
import type { MicroApp } from "../types/microapp.types";

export const microAppsService = {
  /**
   * Get all micro apps
   */
  async getAll(): Promise<MicroApp[]> {
    return apiService.get<MicroApp[]>("/micro-apps");
  },

  /**
   * Get a specific micro app by ID
   */
  async getById(appId: string): Promise<MicroApp> {
    return apiService.get<MicroApp>(`/micro-apps/${appId}`);
  },

  /**
   * Create or update a micro app
   */
  async upsert(microApp: MicroApp): Promise<void> {
    return apiService.post<void>("/micro-apps", microApp);
  },

  /**
   * Add a new version to an existing micro app
   */
  async addVersion(
    appId: string,
    version: {
      version: string;
      build: number;
      releaseNotes: string;
      iconUrl: string;
      downloadUrl: string;
    },
  ): Promise<void> {
    return apiService.post<void>(`/micro-apps/${appId}/versions`, version);
  },

  /**
   * Delete a micro app
   */
  async delete(appId: string): Promise<void> {
    return apiService.delete<void>(`/micro-apps/${appId}`);
  },
};
