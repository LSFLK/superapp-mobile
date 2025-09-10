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
import { LIBRARY_ARTICLE_FALLBACK_IMAGE } from "@/constants/Constants";
import React, { useState } from "react";
import { Image, ImageResizeMode, ImageStyle } from "react-native";

const RemoteFallbackImage = ({
  source,
  fallback = LIBRARY_ARTICLE_FALLBACK_IMAGE,
  style,
  resizeMode = "cover",
}: {
  source: string;
  fallback?: string;
  style: ImageStyle;
  resizeMode?: ImageResizeMode;
}) => {
  const [error, setError] = useState(false);

  return (
    <Image
      source={error || !source ? { uri: fallback } : { uri: source }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setError(true)}
    />
  );
};

export default RemoteFallbackImage;
