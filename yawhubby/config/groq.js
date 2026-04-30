/**
 * @fileoverview Groq AI Client Configuration
 * @description Centralized configuration and initialization for Groq AI SDK
 * @requires groq-sdk
 * @version 1.0.0
 */

const Groq = require("groq-sdk");
const { EventEmitter } = require("events");

// ============================================================
// CONFIGURATION VALIDATION
// ============================================================

/**
 * Validates required environment variables
 * @throws {Error} If required variables are missing
 */
const validateConfig = () => {
  const required = ["GROQ_API_KEY"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  // Validate API key format (basic check)
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey.startsWith("gsk_") || apiKey.length < 32) {
    console.warn("⚠️  GROQ_API_KEY format appears invalid");
  }
};

// ============================================================
// CLIENT CONFIGURATION
// ============================================================

/**
 * Groq client configuration options
 * @type {import('groq-sdk').ClientOptions}
 */
const clientConfig = {
  apiKey: process.env.GROQ_API_KEY,

  // Optional: Add default headers
  defaultHeaders: {
    "X-Service-Name": "kaaf-noticeboard",
    "X-Service-Version": process.env.APP_VERSION || "2.2.0",
  },

  // Optional: Configure timeout (default: 60000ms)
  timeout: parseInt(process.env.GROQ_TIMEOUT) || 60000,

  // Optional: Max retries (default: 2)
  maxRetries: parseInt(process.env.GROQ_MAX_RETRIES) || 3,

  // Optional: Enable debug logging in development
  ...(process.env.NODE_ENV === "development" && {
    dangerouslyAllowBrowser: false,
  }),
};

// ============================================================
// INITIALIZE CLIENT
// ============================================================

let groqClient = null;
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

/**
 * Initialize Groq client with retry logic
 * @returns {import('groq-sdk').default} Initialized Groq client
 */
const initializeGroqClient = () => {
  try {
    validateConfig();

    const client = new Groq(clientConfig);

    // Test the connection (optional, but recommended)
    if (process.env.NODE_ENV === "production") {
      console.log("🔌 Groq AI client initialized successfully");
    }

    return client;
  } catch (error) {
    initializationAttempts++;

    if (initializationAttempts < MAX_INIT_ATTEMPTS) {
      console.warn(
        `⚠️  Groq initialization attempt ${initializationAttempts} failed, retrying...`,
      );
      return initializeGroqClient();
    }

    throw new Error(`Failed to initialize Groq client: ${error.message}`);
  }
};

// ============================================================
// SINGLETON INSTANCE
// ============================================================

/**
 * Get Groq client instance (Singleton pattern)
 * @returns {import('groq-sdk').default} Groq client instance
 */
const getGroqClient = () => {
  if (!groqClient) {
    groqClient = initializeGroqClient();
  }
  return groqClient;
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Health check to verify Groq API connectivity
 * @returns {Promise<boolean>} True if connection is successful
 */
const healthCheck = async () => {
  try {
    const client = getGroqClient();

    // Make a minimal API call to verify connectivity
    const response = await client.chat.completions.create({
      messages: [{ role: "user", content: "ping" }],
      model: "llama3-8b-8192",
      max_tokens: 1,
      temperature: 0,
    });

    return !!response;
  } catch (error) {
    console.error("❌ Groq health check failed:", error.message);
    return false;
  }
};

/**
 * Reset the Groq client instance (useful for testing or key rotation)
 */
const resetClient = () => {
  groqClient = null;
  initializationAttempts = 0;
};

// ============================================================
// MODEL CONFIGURATIONS
// ============================================================

/**
 * Available Groq models and their configurations
 * @readonly
 */
const MODELS = {
  VISION: {
    name: "llama-3.2-11b-vision-preview",
    maxTokens: 4096,
    supportsVision: true,
    description: "For ID verification and image analysis",
  },
  TEXT_STANDARD: {
    name: "llama3-8b-8192",
    maxTokens: 8192,
    supportsVision: false,
    description: "General purpose text generation",
  },
  TEXT_LARGE: {
    name: "llama3-70b-8192",
    maxTokens: 8192,
    supportsVision: false,
    description: "Complex reasoning and analysis",
  },
  FAST: {
    name: "mixtral-8x7b-32768",
    maxTokens: 32768,
    supportsVision: false,
    description: "Large context window, fast inference",
  },
};

// ============================================================
// WRAPPER FUNCTIONS FOR COMMON OPERATIONS
// ============================================================

/**
 * Create a chat completion with error handling
 * @param {Object} params - Chat completion parameters
 * @returns {Promise<Object>} Chat completion response
 */
const createChatCompletion = async (params) => {
  const client = getGroqClient();

  try {
    const startTime = Date.now();
    const response = await client.chat.completions.create(params);
    const duration = Date.now() - startTime;

    // Log performance metrics in development
    if (process.env.NODE_ENV === "development") {
      console.log(`⏱️  Groq API call completed in ${duration}ms`);
    }

    return response;
  } catch (error) {
    // Enhanced error logging
    console.error("Groq API Error:", {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
      model: params.model,
    });

    throw error;
  }
};

/**
 * Analyze an image using Groq Vision model
 * @param {string} imageUrl - URL of the image to analyze
 * @param {string} prompt - Prompt for image analysis
 * @returns {Promise<Object>} Analysis result
 */
const analyzeImage = async (imageUrl, prompt) => {
  return createChatCompletion({
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
    model: MODELS.VISION.name,
    temperature: 0.1,
    max_tokens: 1000,
  });
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Main client (singleton instance)
  client: getGroqClient(),

  // Utility functions
  getGroqClient,
  healthCheck,
  resetClient,
  createChatCompletion,
  analyzeImage,

  // Model configurations
  MODELS,

  // For testing purposes
  _validateConfig: validateConfig,
};

// ============================================================
// SELF-TEST (Development Only)
// ============================================================

if (
  process.env.NODE_ENV === "development" &&
  process.env.TEST_GROQ_ON_START === "true"
) {
  // Run health check on startup if enabled
  setImmediate(async () => {
    try {
      const isHealthy = await healthCheck();
      if (isHealthy) {
        console.log("✅ Groq AI service is healthy");
      } else {
        console.warn("⚠️  Groq AI service health check failed");
      }
    } catch (error) {
      console.error("❌ Groq AI service is unavailable:", error.message);
    }
  });
}

// ============================================================
// ERROR TYPES (Optional - Create errors/GroqError.js)
// ============================================================

/**
 * Custom error class for Groq-related errors
 * @example
 * throw new GroqError('API key invalid', 401);
 */
class GroqError extends Error {
  constructor(message, statusCode = 500, originalError = null) {
    super(message);
    this.name = "GroqError";
    this.statusCode = statusCode;
    this.originalError = originalError;
    Error.captureStackTrace(this, GroqError);
  }
}

module.exports.GroqError = GroqError;
