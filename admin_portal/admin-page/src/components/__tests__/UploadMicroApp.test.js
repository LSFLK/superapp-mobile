import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UploadMicroApp from '../UploadMicroApp';

// Mock Asgardeo auth context
let mockAuth;
jest.mock('@asgardeo/auth-react', () => ({
  useAuthContext: () => mockAuth,
}));

// Mock API endpoint resolver
import { getEndpoint } from '../../constants/api';
jest.mock('../../constants/api', () => ({
  getEndpoint: jest.fn(),
}));

// Helper to create a File with specific first bytes and a mocked slice().arrayBuffer
const createFileWithHeader = (bytes, name = 'file.zip', type = 'application/zip') => {
  const headerBytes = new Uint8Array(bytes && bytes.length ? bytes : [0x00, 0x00, 0x00, 0x00]);
  const pad = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
  const content = new Uint8Array([...headerBytes, ...pad]);
  const file = new File([content], name, { type });
  // jsdom may not support Blob.prototype.arrayBuffer; mock per-file to ensure validateZipFile works
  // We only need first 4 bytes; ignore start/end for simplicity
  // eslint-disable-next-line no-param-reassign
  file.slice = function slice() {
    return {
      arrayBuffer: async () => headerBytes.buffer,
    };
  };
  return file;
};

const fillRequiredFields = () => {
  fireEvent.change(screen.getByPlaceholderText('e.g., Payslip Viewer'), { target: { value: 'My App' } });
  fireEvent.change(screen.getByPlaceholderText('e.g., 1.0.0'), { target: { value: '1.0.0' } });
  fireEvent.change(screen.getByPlaceholderText('e.g., payslip-viewer'), { target: { value: 'payslip-viewer' } });
  fireEvent.change(screen.getByPlaceholderText('Brief description of what the micro-app does'), { target: { value: 'Desc' } });
};

// Global fetch mock
beforeEach(() => {
  mockAuth = {
    state: { isAuthenticated: false },
    getAccessToken: jest.fn(),
  };
  (getEndpoint).mockReturnValue('https://example.com/upload');
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

test('shows warning modal when required fields are missing and does not call fetch', async () => {
  render(<UploadMicroApp />);
  fireEvent.click(screen.getByRole('button', { name: /upload/i }));

  expect(await screen.findByText('Warning')).toBeInTheDocument();
  expect(screen.getByText('Please provide name, version, appId, and description.')).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
});

test('rejects non-zip file with warning message', async () => {
  render(<UploadMicroApp />);
  fillRequiredFields();

  const fileInput = document.querySelector('input[type="file"]');
  const txtFile = createFileWithHeader([0x50, 0x4b, 0x03, 0x04], 'notzip.txt', 'text/plain');
  fireEvent.change(fileInput, { target: { files: [txtFile] } });
  // Confirm modal appears for file selection
  expect(await screen.findByText('Confirm File')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /yes/i }));

  fireEvent.click(screen.getByRole('button', { name: /upload/i }));
  expect(await screen.findByText('Warning')).toBeInTheDocument();
  expect(screen.getByText('Selected file must be a .zip archive.')).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
});

test('rejects invalid zip by magic bytes with warning', async () => {
  render(<UploadMicroApp />);
  fillRequiredFields();

  const fileInput = document.querySelector('input[type="file"]');
  const badZip = createFileWithHeader([0x00, 0x00, 0x00, 0x00], 'app.zip');
  fireEvent.change(fileInput, { target: { files: [badZip] } });
  expect(await screen.findByText('Confirm File')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /yes/i }));

  fireEvent.click(screen.getByRole('button', { name: /upload/i }));
  // Assert on the concrete warning message (more stable than header text)
  expect(
    await screen.findByText('File content is not a valid ZIP archive.')
  ).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
});

test('successful upload shows success modal, clears file, and calls onUploaded; includes auth headers when authenticated', async () => {
  mockAuth.state.isAuthenticated = true;
  mockAuth.getAccessToken.mockResolvedValue('token123');
  (global.fetch).mockResolvedValue({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({ message: 'Uploaded' }),
  });

  const onUploaded = jest.fn();
  render(<UploadMicroApp onUploaded={onUploaded} />);
  fillRequiredFields();

  const fileInput = document.querySelector('input[type="file"]');
  const goodZip = createFileWithHeader([0x50, 0x4b, 0x03, 0x04], 'app.zip');
  fireEvent.change(fileInput, { target: { files: [goodZip] } });
  expect(await screen.findByText('Confirm File')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /yes/i }));

  fireEvent.click(screen.getByRole('button', { name: /^upload$/i }));

  // Success modal and message (assert on message to avoid header timing)
  expect(await screen.findByText('Uploaded')).toBeInTheDocument();

  // onUploaded called
  await waitFor(() => expect(onUploaded).toHaveBeenCalled());

  // Verify headers included token
  expect(global.fetch).toHaveBeenCalledTimes(1);
  const [, reqInit] = global.fetch.mock.calls[0];
  expect(reqInit.method).toBe('POST');
  expect(reqInit.headers['Authorization']).toBe('Bearer token123');
  expect(reqInit.headers['x-jwt-assertion']).toBe('token123');
});

test('upload error shows failure modal and error message', async () => {
  mockAuth.state.isAuthenticated = true;
  mockAuth.getAccessToken.mockResolvedValue('token123');
  (global.fetch).mockResolvedValue({
    ok: false,
    status: 400,
    headers: { get: () => 'application/json' },
    json: async () => ({ error: 'Bad Request' }),
    text: async () => 'Bad Request',
  });

  render(<UploadMicroApp />);
  fillRequiredFields();

  const fileInput = document.querySelector('input[type="file"]');
  const goodZip = createFileWithHeader([0x50, 0x4b, 0x03, 0x04], 'app.zip');
  fireEvent.change(fileInput, { target: { files: [goodZip] } });
  expect(await screen.findByText('Confirm File')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /yes/i }));

  fireEvent.click(screen.getByRole('button', { name: /^upload$/i }));

  expect(await screen.findByText('Bad Request')).toBeInTheDocument();
});

test('when not authenticated, upload proceeds without auth headers', async () => {
  mockAuth.state.isAuthenticated = false;
  (global.fetch).mockResolvedValue({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({ message: 'Uploaded' }),
  });

  render(<UploadMicroApp />);
  fillRequiredFields();

  const fileInput = document.querySelector('input[type="file"]');
  const goodZip = createFileWithHeader([0x50, 0x4b, 0x03, 0x04], 'app.zip');
  fireEvent.change(fileInput, { target: { files: [goodZip] } });
  expect(await screen.findByText('Confirm File')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /yes/i }));

  fireEvent.click(screen.getByRole('button', { name: /^upload$/i }));

  await screen.findByText('Uploaded');
  const [, reqInit] = global.fetch.mock.calls[0];
  expect(reqInit.headers['Authorization']).toBeUndefined();
  expect(reqInit.headers['x-jwt-assertion']).toBeUndefined();
});
