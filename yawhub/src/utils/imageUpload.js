// src/utils/imageUpload.js - Complete Image Upload Utilities

import api from "../services/api";

// ============================================================
// CONSTANTS
// ============================================================

const DEFAULT_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
    "image/gif",
  ],
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  compressBeforeUpload: true,
};

// ============================================================
// IMAGE VALIDATION
// ============================================================

/**
 * Validate image file before upload
 * @param {File} file - Image file
 * @param {Object} options - Validation options
 * @param {number} options.maxSize - Maximum file size in bytes
 * @param {Array} options.allowedTypes - Allowed MIME types
 * @returns {Object} Validation result
 */
export const validateImageFile = (file, options = {}) => {
  const {
    maxSize = DEFAULT_CONFIG.maxSize,
    allowedTypes = DEFAULT_CONFIG.allowedTypes,
  } = options;

  if (!file) {
    return { isValid: false, error: "No file selected" };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type not allowed. Allowed: ${allowedTypes.map((t) => t.split("/")[1].toUpperCase()).join(", ")}`,
    };
  }

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      error: `File size too large. Maximum: ${maxSizeMB}MB (Your file: ${fileSizeMB}MB)`,
    };
  }

  return { isValid: true, error: null, file };
};

/**
 * Get image dimensions
 * @param {File|string} source - Image file or URL
 * @returns {Promise<Object>} Image dimensions
 */
export const getImageDimensions = (source) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        aspectRatio: img.width / img.height,
      });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;

    if (typeof source === "string") {
      img.src = source;
    } else {
      img.src = URL.createObjectURL(source);
    }
  });
};

// ============================================================
// IMAGE COMPRESSION
// ============================================================

/**
 * Compress image before upload
 * @param {File} file - Image file
 * @param {Object} options - Compression options
 * @param {number} options.maxWidth - Maximum width
 * @param {number} options.maxHeight - Maximum height
 * @param {number} options.quality - Image quality (0-1)
 * @returns {Promise<File>} Compressed image file
 */
export const compressImage = async (file, options = {}) => {
  const {
    maxWidth = DEFAULT_CONFIG.maxWidth,
    maxHeight = DEFAULT_CONFIG.maxHeight,
    quality = DEFAULT_CONFIG.quality,
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Determine output format
        let outputType = file.type;
        if (outputType === "image/jpg") outputType = "image/jpeg";
        if (outputType === "image/heic") outputType = "image/jpeg";

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Image compression failed"));
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: outputType,
              lastModified: Date.now(),
            });

            // Log compression stats
            const originalSize = (file.size / 1024).toFixed(2);
            const compressedSize = (blob.size / 1024).toFixed(2);
            const reduction = ((1 - blob.size / file.size) * 100).toFixed(1);

            console.log(
              `Image compressed: ${originalSize}KB → ${compressedSize}KB (${reduction}% reduction)`,
            );

            resolve(compressedFile);
          },
          outputType,
          quality,
        );
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
  });
};

// ============================================================
// IMAGE UPLOAD
// ============================================================

/**
 * Upload image to server
 * @param {File} file - Image file to upload
 * @param {Object} options - Upload options
 * @param {Function} options.onProgress - Progress callback
 * @param {boolean} options.compress - Whether to compress before upload
 * @param {string} options.uploadEndpoint - Custom upload endpoint
 * @returns {Promise<Object>} Upload result with URL
 */
export const uploadImage = async (file, options = {}) => {
  const {
    onProgress = null,
    compress = DEFAULT_CONFIG.compressBeforeUpload,
    uploadEndpoint = "/upload/image",
  } = options;

  try {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Compress if needed
    let uploadFile = file;
    if (compress) {
      const dimensions = await getImageDimensions(file);
      const needsCompression =
        dimensions.width > 1200 ||
        dimensions.height > 1200 ||
        file.size > 1024 * 1024;

      if (needsCompression) {
        uploadFile = await compressImage(file);
      }
    }

    // Create form data
    const formData = new FormData();
    formData.append("image", uploadFile);

    // Additional metadata
    formData.append("originalName", file.name);
    formData.append("fileSize", uploadFile.size.toString());
    formData.append("fileType", uploadFile.type);

    // Upload with progress tracking
    const response = await api.post(uploadEndpoint, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress(percentCompleted);
        }
      },
    });

    // Return upload result
    return {
      success: true,
      url: response.data?.url || response.data?.data?.url,
      fileId: response.data?.fileId || response.data?.data?.fileId,
      filename: response.data?.filename || response.data?.data?.filename,
      size: uploadFile.size,
      type: uploadFile.type,
    };
  } catch (error) {
    console.error("Image upload error:", error);

    // Return mock response for demo/development
    if (process.env.NODE_ENV === "development") {
      console.warn("Using mock image upload for development");
      return {
        success: true,
        url: URL.createObjectURL(file),
        fileId: `mock_${Date.now()}`,
        filename: file.name,
        isMock: true,
      };
    }

    throw new Error(error.response?.data?.message || "Failed to upload image");
  }
};

/**
 * Upload multiple images
 * @param {Array} files - Array of image files
 * @param {Object} options - Upload options
 * @param {Function} options.onProgress - Progress callback per file
 * @returns {Promise<Array>} Array of upload results
 */
export const uploadMultipleImages = async (files, options = {}) => {
  const { onProgress = null } = options;
  const results = [];
  const errors = [];

  for (let i = 0; i < files.length; i++) {
    try {
      const result = await uploadImage(files[i], {
        ...options,
        onProgress: onProgress ? (progress) => onProgress(i, progress) : null,
      });
      results.push(result);
    } catch (error) {
      errors.push({ index: i, file: files[i].name, error: error.message });
    }
  }

  return {
    success: errors.length === 0,
    results,
    errors,
    totalUploaded: results.length,
    totalFailed: errors.length,
  };
};

// ============================================================
// IMAGE URL UTILITIES
// ============================================================

/**
 * Get image URL with fallback
 * @param {string} url - Image URL
 * @param {string} fallback - Fallback image URL
 * @returns {string} Image URL
 */
export const getImageUrl = (url, fallback = "/images/placeholder.jpg") => {
  if (!url || url === "") return fallback;
  return url;
};

/**
 * Get optimized image URL with transformations
 * @param {string} url - Original image URL
 * @param {Object} options - Transformation options
 * @param {number} options.width - Desired width
 * @param {number} options.height - Desired height
 * @param {string} options.fit - Fit mode (cover, contain, fill)
 * @returns {string} Optimized URL
 */
export const getOptimizedImageUrl = (url, options = {}) => {
  if (!url) return "/images/placeholder.jpg";

  const { width, height, fit = "cover" } = options;

  // If using a CDN that supports URL parameters
  if (url.includes("cloudinary") || url.includes("imgix")) {
    const params = new URLSearchParams();
    if (width) params.append("w", width);
    if (height) params.append("h", height);
    if (fit) params.append("fit", fit);
    return `${url}?${params.toString()}`;
  }

  // Return original URL if no transformations available
  return url;
};

// ============================================================
// IMAGE CACHE MANAGEMENT
// ============================================================

const imageCache = new Map();

/**
 * Preload image
 * @param {string} url - Image URL
 * @returns {Promise<void>}
 */
export const preloadImage = (url) => {
  return new Promise((resolve, reject) => {
    if (imageCache.has(url)) {
      resolve(imageCache.get(url));
      return;
    }

    const img = new Image();
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
};

/**
 * Preload multiple images
 * @param {Array} urls - Array of image URLs
 * @returns {Promise<Array>}
 */
export const preloadImages = async (urls) => {
  const promises = urls.map((url) =>
    preloadImage(url).catch((err) => ({ error: err, url })),
  );
  return Promise.all(promises);
};

/**
 * Clear image cache
 * @param {string} url - Specific URL to clear, or undefined to clear all
 */
export const clearImageCache = (url) => {
  if (url) {
    imageCache.delete(url);
  } else {
    imageCache.clear();
  }
};

// ============================================================
// IMAGE CONVERSION UTILITIES
// ============================================================

/**
 * Convert image file to base64
 * @param {File} file - Image file
 * @returns {Promise<string>} Base64 string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
};

/**
 * Convert base64 to file
 * @param {string} base64 - Base64 string
 * @param {string} filename - Desired filename
 * @returns {File} File object
 */
export const base64ToFile = (base64, filename = "image.png") => {
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
};

/**
 * Download image from URL
 * @param {string} url - Image URL
 * @param {string} filename - Download filename
 */
export const downloadImage = async (url, filename = "image.jpg") => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const link = document.createElement("a");
    const objectUrl = URL.createObjectURL(blob);

    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error("Failed to download image:", error);
    throw new Error("Failed to download image");
  }
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

const imageUpload = {
  validateImageFile,
  getImageDimensions,
  compressImage,
  uploadImage,
  uploadMultipleImages,
  getImageUrl,
  getOptimizedImageUrl,
  preloadImage,
  preloadImages,
  clearImageCache,
  fileToBase64,
  base64ToFile,
  downloadImage,
  DEFAULT_CONFIG,
};

export default imageUpload;
