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
import { renderHook, act } from '@testing-library/react-native';
import { useMicroApp } from '@/hooks/useMicroApp';
import { WebViewMessageEvent } from 'react-native-webview';

jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('react-native-webview', () => ({
  WebView: () => null,
}));

jest.mock('expo-auth-session/providers/google', () => ({
  useAuthRequest: () => [null, null, jest.fn()],
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/services/authService', () => ({
  tokenExchange: jest.fn(() => Promise.resolve('test-token')),
  logout: jest.fn(),
}));

jest.mock('@/services/googleService', () => jest.fn(() => Promise.resolve({ status: true, userInfo: {} })));

jest.mock('@/utils/bridgeRegistry', () => ({
  getBridgeHandler: jest.fn(() => jest.fn()),
  getResolveMethod: jest.fn(),
  getRejectMethod: jest.fn(),
}));

describe('useMicroApp', () => {
  const params = {
    webViewUri: 'https://example.com',
    appName: 'Test App',
    clientId: 'test-client-id',
    exchangedToken: 'test-exchanged-token',
    appId: 'test-app-id',
  };

  it('should initialize with the correct state', () => {
    const { result } = renderHook(() => useMicroApp(params));

    expect(result.current.isScannerVisible).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(result.current.webUri).toBe('');
    expect(result.current.isDeveloper).toBe(false);
    expect(result.current.isTotp).toBe(false);
  });

  it('should handle messages from webview', async () => {
    const { result } = renderHook(() => useMicroApp(params));
    const event = {
      nativeEvent: {
        data: JSON.stringify({ topic: 'test-topic', data: { foo: 'bar' }, requestId: '123' }),
      },
    } as WebViewMessageEvent;

    await act(async () => {
      await result.current.onMessage(event);
    });

    expect(require('@/utils/bridgeRegistry').getBridgeHandler).toHaveBeenCalledWith('test-topic');
  });
});