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

import { useEffect, useState } from "react";
import { fetchLibraryArticles } from "@/services/libraryService";
import { LibraryArticle } from "@/types/library.types";
import { LIBRARY_ARTICLE_FETCH_LIMIT } from "@/constants/Constants";
import useDebounce from "./useDebounce";

/**
 * Hook for managing library articles with pagination and search
 */
export const useLibrary = () => {
  const [articles, setArticles] = useState<LibraryArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchingMore, setFetchingMore] = useState<boolean>(false);
  const [start, setStart] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const debouncedQuery = useDebounce(searchQuery, 500);

  const fetchArticles = async (
    isInitial: boolean = false,
    query: string = ""
  ) => {
    if (!hasMore && !isInitial) return;

    if (isInitial) {
      setLoading(true);
      setStart(0);
      setHasMore(true);
    } else {
      setFetchingMore(true);
    }

    try {
      const data = await fetchLibraryArticles(isInitial, start, query);
      const newArticles: LibraryArticle[] = data;
      
      if (isInitial) {
        setArticles(newArticles);
      } else {
        setArticles((prev) => [...prev, ...newArticles]);
      }

      if (newArticles.length < LIBRARY_ARTICLE_FETCH_LIMIT) {
        setHasMore(false);
      } else {
        setStart((prev) => prev + LIBRARY_ARTICLE_FETCH_LIMIT);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (isInitial) {
        setLoading(false);
      } else {
        setFetchingMore(false);
      }
    }
  };

  useEffect(() => {
    const handleQuery = async () => {
      const trimmedQuery = debouncedQuery.trim();

      if (trimmedQuery.length === 0) {
        fetchArticles(true);
        return;
      }

      if (trimmedQuery.length < 3) return;

      fetchArticles(true, trimmedQuery);
    };

    handleQuery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const loadMore = () => {
    if (!fetchingMore && hasMore) {
      fetchArticles(false, debouncedQuery);
    }
  };

  return {
    articles,
    loading,
    fetchingMore,
    searchQuery,
    setSearchQuery,
    loadMore,
  };
};
