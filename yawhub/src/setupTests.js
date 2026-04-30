/* eslint-disable no-undef */
/* ========================================
   KAAF UNIVERSITY NOTICEBOARD
   Test Setup Configuration
   Version: 2.0.0
   Author: Boakye Samuel Yiadom
   ======================================== */

// Testing Library imports
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, afterAll, vi } from "vitest";

// ========================================
// MOCK STORAGE
// ========================================

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem: vi.fn((key) => localStorageMock.store[key] || null),
  setItem: vi.fn((key, value) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: vi.fn((key) => {
    delete localStorageMock.store[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {};
  }),
  get length() {
    return Object.keys(localStorageMock.store).length;
  },
  key: vi.fn((index) => Object.keys(localStorageMock.store)[index] || null),
};

global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  store: {},
  getItem: vi.fn((key) => sessionStorageMock.store[key] || null),
  setItem: vi.fn((key, value) => {
    sessionStorageMock.store[key] = value;
  }),
  removeItem: vi.fn((key) => {
    delete sessionStorageMock.store[key];
  }),
  clear: vi.fn(() => {
    sessionStorageMock.store = {};
  }),
  get length() {
    return Object.keys(sessionStorageMock.store).length;
  },
  key: vi.fn((index) => Object.keys(sessionStorageMock.store)[index] || null),
};

global.sessionStorage = sessionStorageMock;

// ========================================
// MOCK MEDIA QUERIES
// ========================================

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// ========================================
// MOCK BROWSER APIs
// ========================================

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock getComputedStyle
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = vi.fn((element) => originalGetComputedStyle(element));

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(""),
  },
});

// Mock fetch
global.fetch = vi.fn();

// Mock console methods to keep test output clean (optional)
// Uncomment if you want to suppress console logs during tests
// const originalConsoleError = console.error;
// const originalConsoleWarn = console.warn;
// console.error = vi.fn();
// console.warn = vi.fn();

// ========================================
// MOCK SOCKET.IO
// ========================================

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connect: vi.fn(),
  })),
}));

// ========================================
// MOCK AXIOS
// ========================================

vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() },
      },
    })),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    isAxiosError: vi.fn(),
  },
}));

// ========================================
// MOCK REACT ROUTER
// ========================================

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({}),
    useLocation: () => ({
      pathname: "/",
      search: "",
      hash: "",
      state: null,
    }),
  };
});

// ========================================
// TEST CLEANUP
// ========================================

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});

// Reset all mocks before each test
beforeAll(() => {
  // Add any global setup here
});

// Clean up after all tests
afterAll(() => {
  // Restore original console methods if mocked
  // console.error = originalConsoleError;
  // console.warn = originalConsoleWarn;
});
