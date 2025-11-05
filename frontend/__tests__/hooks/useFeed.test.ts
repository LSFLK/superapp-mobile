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

import { renderHook, waitFor } from '@testing-library/react-native';
import { useFeed } from '@/hooks/useFeed';
import useNewsFeed from '@/hooks/useNewsFeed';
import useEventsFeed from '@/hooks/useEventsFeed';

// Mock the dependencies
jest.mock('@/hooks/useNewsFeed');
jest.mock('@/hooks/useEventsFeed');

const mockUseNewsFeed = useNewsFeed as jest.MockedFunction<typeof useNewsFeed>;
const mockUseEventsFeed = useEventsFeed as jest.MockedFunction<typeof useEventsFeed>;

describe('useFeed Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should return loading state initially', () => {
    mockUseNewsFeed.mockReturnValue({
      newsItems: [],
      loading: true,
    });
    mockUseEventsFeed.mockReturnValue({
      eventItems: [],
      loading: true,
    });

    const { result } = renderHook(() => useFeed());

    expect(result.current.loading).toBe(true);
    expect(result.current.shouldShowSkeleton).toBe(true);
    expect(result.current.isMinTimeElapsed).toBe(false);
  });

  it('should set isMinTimeElapsed to true after 1 second', async () => {
    mockUseNewsFeed.mockReturnValue({
      newsItems: [],
      loading: false,
    });
    mockUseEventsFeed.mockReturnValue({
      eventItems: [],
      loading: false,
    });

    const { result } = renderHook(() => useFeed());

    expect(result.current.isMinTimeElapsed).toBe(false);

    // Fast-forward time by 1 second
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(result.current.isMinTimeElapsed).toBe(true);
    });
  });

  it('should return news and events items', () => {
    const mockNewsItems = [
      { title: 'News 1', link: 'http://example.com/1', pubDate: '2025-01-01', description: 'Description 1' },
      { title: 'News 2', link: 'http://example.com/2', pubDate: '2025-01-02', description: 'Description 2' },
    ];
    const mockEventItems = [
      { id: '1', type: 'event', title: 'Event 1', date: '2025-01-15', teaser: 'Teaser', url: 'http://example.com/event1', location: 'Location 1', imageUrl: '', resourceUrl: '' },
    ];

    mockUseNewsFeed.mockReturnValue({
      newsItems: mockNewsItems as any,
      loading: false,
    });
    mockUseEventsFeed.mockReturnValue({
      eventItems: mockEventItems as any,
      loading: false,
    });

    const { result } = renderHook(() => useFeed());

    expect(result.current.newsItems).toEqual(mockNewsItems);
    expect(result.current.eventItems).toEqual(mockEventItems);
  });

  it('should detect empty state when no items are present', () => {
    mockUseNewsFeed.mockReturnValue({
      newsItems: [],
      loading: false,
    });
    mockUseEventsFeed.mockReturnValue({
      eventItems: [],
      loading: false,
    });

    const { result } = renderHook(() => useFeed());

    expect(result.current.isEmpty).toBe(true);
  });

  it('should not be empty when items are present', () => {
    mockUseNewsFeed.mockReturnValue({
      newsItems: [{ title: 'News 1', link: 'http://example.com/1', pubDate: '2025-01-01', description: 'Desc' }] as any,
      loading: false,
    });
    mockUseEventsFeed.mockReturnValue({
      eventItems: [],
      loading: false,
    });

    const { result } = renderHook(() => useFeed());

    expect(result.current.isEmpty).toBe(false);
  });

  it('should show skeleton when loading or time not elapsed', () => {
    mockUseNewsFeed.mockReturnValue({
      newsItems: [],
      loading: false,
    });
    mockUseEventsFeed.mockReturnValue({
      eventItems: [],
      loading: false,
    });

    const { result } = renderHook(() => useFeed());

    // Initially, time not elapsed
    expect(result.current.shouldShowSkeleton).toBe(true);

    // Even when loading is false, skeleton shows until time elapsed
    expect(result.current.loading).toBe(false);
    expect(result.current.shouldShowSkeleton).toBe(true);
  });

  it('should cleanup timer on unmount', () => {
    mockUseNewsFeed.mockReturnValue({
      newsItems: [],
      loading: false,
    });
    mockUseEventsFeed.mockReturnValue({
      eventItems: [],
      loading: false,
    });

    const { unmount } = renderHook(() => useFeed());

    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
