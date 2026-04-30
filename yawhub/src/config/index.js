// src/config/index.js

export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_URL || "/api",
    socketUrl: import.meta.env.VITE_SOCKET_URL || "http://localhost:5000",
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    uploadEndpoint: "/uploads",
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || "KAAF University Noticeboard",
    version: import.meta.env.VITE_APP_VERSION || "2.0.0",
    environment: import.meta.env.MODE || "development",
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
    isTest: import.meta.env.TEST,
  },
  features: {
    enableNotifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS === "true",
    enablePushNotifications:
      import.meta.env.VITE_ENABLE_PUSH_NOTIFICATIONS === "true",
    enableOfflineMode: import.meta.env.VITE_ENABLE_OFFLINE_MODE === "true",
    enableRegistration: import.meta.env.VITE_ENABLE_REGISTRATION === "true",
    enableEmailVerification:
      import.meta.env.VITE_ENABLE_EMAIL_VERIFICATION === "true",
    enableTwoFactor: import.meta.env.VITE_ENABLE_TWO_FACTOR === "true",
    enableLogging: import.meta.env.VITE_ENABLE_LOGGING === "true",
    enableDevTools: import.meta.env.VITE_ENABLE_DEV_TOOLS === "true",
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === "true",
    enableMockApi: import.meta.env.VITE_ENABLE_MOCK_API === "true",
  },
  pagination: {
    defaultPageSize: parseInt(import.meta.env.VITE_DEFAULT_PAGE_SIZE || "10"),
    maxPageSize: parseInt(import.meta.env.VITE_MAX_PAGE_SIZE || "100"),
  },
  upload: {
    maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || "5242880"),
    allowedImageTypes: (
      import.meta.env.VITE_ALLOWED_IMAGE_TYPES || "jpeg,jpg,png,gif,webp"
    ).split(","),
    allowedDocumentTypes: (
      import.meta.env.VITE_ALLOWED_DOCUMENT_TYPES ||
      "pdf,doc,docx,xls,xlsx,ppt,pptx"
    ).split(","),
  },
  auth: {
    tokenExpiry: import.meta.env.VITE_TOKEN_EXPIRY || "15m",
    refreshTokenExpiry: import.meta.env.VITE_REFRESH_TOKEN_EXPIRY || "7d",
    storageKeys: {
      token: "accessToken",
      refreshToken: "refreshToken",
      user: "user",
    },
  },
  timezone: import.meta.env.VITE_TIMEZONE || "Africa/Accra",
  analytics: {
    enabled: import.meta.env.VITE_ENABLE_ANALYTICS === "true",
    id: import.meta.env.VITE_ANALYTICS_ID || "",
  },
  sentry: {
    dsn: import.meta.env.VITE_SENTRY_DSN || "",
    enabled: import.meta.env.VITE_ENABLE_SENTRY === "true",
  },
  dateFormat: {
    date: "dd/MM/yyyy",
    time: "HH:mm",
    dateTime: "dd/MM/yyyy HH:mm",
    api: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  },
};

export default config;
