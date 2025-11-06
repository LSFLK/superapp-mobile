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
import { fetchLibraryArticles } from '@/services/libraryService';
import axios from 'axios';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('libraryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchLibraryArticles', () => {
    it('should fetch articles successfully', async () => {
      const mockArticles = [
        {
          id: '1',
          title: 'Test Article 1',
          description: 'Test Description 1',
          url: 'https://example.com/article1',
        },
        {
          id: '2',
          title: 'Test Article 2',
          description: 'Test Description 2',
          url: 'https://example.com/article2',
        },
      ];

      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          data: mockArticles,
        },
      });

      const result = await fetchLibraryArticles(true, 0, 'test query');

      expect(result).toEqual(mockArticles);
      expect(mockedAxios.post).toHaveBeenCalled();
    });

    it('should handle pagination correctly', async () => {
      const mockArticles = [
        {
          id: '3',
          title: 'Test Article 3',
          description: 'Test Description 3',
          url: 'https://example.com/article3',
        },
      ];

      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          data: mockArticles,
        },
      });

      const result = await fetchLibraryArticles(false, 10, 'test');

      expect(result).toBeDefined();
      expect(mockedAxios.post).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockedAxios.post.mockRejectedValue({
        response: { status: 500, statusText: 'Server Error' },
        message: 'Server error',
      });

      await expect(
        fetchLibraryArticles(true, 0, 'test')
      ).rejects.toThrow();
    });

    it('should handle empty results', async () => {
      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          data: [],
        },
      });

      const result = await fetchLibraryArticles(true, 0, '');

      expect(result).toEqual([]);
    });
  });
});
