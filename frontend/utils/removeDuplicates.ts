// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.
import { UserConfig } from "@/context/slices/userConfigSlice";

//Removes duplicate values from the configValue array in user configurations
export const removeDuplicatesFromUserConfigs = (
  userConfigs: UserConfig[]
): UserConfig[] => {
  return userConfigs.map((config) => {
    if (!Array.isArray(config.configValue)) {
      return config;
    }

    // Handle string arrays
    if (
      config.configValue.length > 0 &&
      typeof config.configValue[0] === "string"
    ) {
      return {
        ...config,
        configValue: [...new Set(config.configValue as string[])],
      };
    }

    // Handle AppArrangement arrays - remove duplicates based on the 'name' property
    const arrangementArray = config.configValue as any[];
    const uniqueArrangements = arrangementArray.filter(
      (item, index, self) =>
        index === self.findIndex((arr) => arr.name === item.name)
    );

    return {
      ...config,
      configValue: uniqueArrangements,
    };
  });
};
