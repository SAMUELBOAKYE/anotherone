const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { UPLOAD, VALIDATION } = require('../config/constants');
const logger = require('./logger');

/**
 * Upload Configuration for KAAF University Noticeboard System
 * @version 2.0.0
 * @author Boakye Samuel Yiadom
 */

// Define upload directories
const UPLOAD_DIRS = {
  avatars: path.join(__dirname, '../uploads/avatars'),
  notices: path.join(__dirname, '../uploads/notices'),
  events: path.join(__dirname, '../uploads/events'),
  certificates: path.join(__dirname, '../uploads/certificates'),
  temp: path.join(__dirname, '../uploads/temp')
};

// Create all upload directories if they don't exist
Object.values(UPLOAD_DIRS).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created upload directory: ${dir}`);
  }
});

/**
 * File filter for images
 */
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = UPLOAD.ALLOWED_IMAGE_TYPES || /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error(`Only image files are allowed (${allowedTypes.join(', ')})`), false);
  }
};

/**
 * File filter for documents
 */
const documentFileFilter = (req, file, cb) => {
  const allowedTypes = UPLOAD.ALLOWED_DOCUMENT_TYPES || /pdf|doc|docx|xls|xlsx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error(`Only document files are allowed (PDF, DOC, DOCX, XLS, XLSX)`), false);
  }
};

/**
 * File filter for certificates
 */
const certificateFileFilter = (req, file, cb) => {
  const allowedTypes = UPLOAD.CERTIFICATE_TYPES || /pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed for certificates'), false);
  }
};

/**
 * Dynamic storage configuration
 * @param {string} uploadType - Type of upload (avatars, notices, events, certificates)
 * @returns {Object} Multer storage configuration
 */
const createStorage = (uploadType) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = UPLOAD_DIRS[uploadType];
      if (!dir) {
        cb(new Error(`Invalid upload type: ${uploadType}`), null);
        return;
      }
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      // Generate unique filename: timestamp-uuid-originalname
      const timestamp = Date.now();
      const uniqueId = uuidv4();
      const ext = path.extname(file.originalname);
      const sanitizedName = file.originalname
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .substring(0, 50);
      const filename = `${uploadType}-${timestamp}-${uniqueId}${ext}`;
      cb(null, filename);
    }
  });
};

/**
 * Error handler for multer
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${UPLOAD.MAX_FILE_SIZE / (1024 * 1024)}MB`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: `Too many files. Maximum ${UPLOAD.MAX_FILES_PER_UPLOAD} files allowed`
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next(err);
};

// ============================
// UPLOAD CONFIGURATIONS
// ============================

/**
 * Avatar upload configuration
 */
const uploadAvatar = multer({
  storage: createStorage('avatars'),
  limits: { 
    fileSize: UPLOAD.MAX_AVATAR_SIZE || 2 * 1024 * 1024 // 2MB default
  },
  fileFilter: imageFileFilter
});

/**
 * Single notice image upload
 */
const uploadNoticeImage = multer({
  storage: createStorage('notices'),
  limits: { 
    fileSize: UPLOAD.MAX_FILE_SIZE || 5 * 1024 * 1024 // 5MB default
  },
  fileFilter: imageFileFilter
});

/**
 * Multiple notice images upload
 */
const uploadNoticeImages = multer({
  storage: createStorage('notices'),
  limits: { 
    fileSize: UPLOAD.MAX_FILE_SIZE || 5 * 1024 * 1024,
    files: UPLOAD.MAX_FILES_PER_UPLOAD || 5
  },
  fileFilter: imageFileFilter
}).array('images', UPLOAD.MAX_FILES_PER_UPLOAD || 5);

/**
 * Event poster upload
 */
const uploadEventPoster = multer({
  storage: createStorage('events'),
  limits: { 
    fileSize: UPLOAD.EVENT_POSTER_MAX_SIZE || 5 * 1024 * 1024 // 5MB default
  },
  fileFilter: imageFileFilter
});

/**
 * Event gallery upload (multiple images)
 */
const uploadEventGallery = multer({
  storage: createStorage('events'),
  limits: { 
    fileSize: UPLOAD.EVENT_GALLERY_MAX_SIZE || 2 * 1024 * 1024,
    files: UPLOAD.EVENT_GALLERY_MAX_FILES || 20
  },
  fileFilter: imageFileFilter
}).array('gallery', UPLOAD.EVENT_GALLERY_MAX_FILES || 20);

/**
 * Document upload for notices
 */
const uploadNoticeDocument = multer({
  storage: createStorage('notices'),
  limits: { 
    fileSize: UPLOAD.MAX_FILE_SIZE || 5 * 1024 * 1024
  },
  fileFilter: documentFileFilter
});

/**
 * Certificate upload
 */
const uploadCertificate = multer({
  storage: createStorage('certificates'),
  limits: { 
    fileSize: UPLOAD.CERTIFICATE_MAX_SIZE || 2 * 1024 * 1024
  },
  fileFilter: certificateFileFilter
});

// ============================
// HELPER FUNCTIONS
// ============================

/**
 * Delete a file from the filesystem
 * @param {string} filePath - Path to the file
 * @returns {boolean} Success status
 */
const deleteFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`File deleted: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`Failed to delete file: ${filePath} - ${error.message}`);
    return false;
  }
};

/**
 * Delete multiple files
 * @param {Array} filePaths - Array of file paths
 * @returns {Object} Results with success and failed counts
 */
const deleteFiles = (filePaths) => {
  let success = 0;
  let failed = 0;
  
  filePaths.forEach(filePath => {
    if (deleteFile(filePath)) {
      success++;
    } else {
      failed++;
    }
  });
  
  return { success, failed };
};

/**
 * Get full URL for uploaded file
 * @param {Object} req - Express request object
 * @param {string} filename - Filename
 * @param {string} folder - Folder name
 * @returns {string|null} Full URL or null
 */
const getFileUrl = (req, filename, folder) => {
  if (!filename) return null;
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${folder}/${filename}`;
};

/**
 * Get file info with metadata
 * @param {Object} file - Multer file object
 * @returns {Object} File info object
 */
const getFileInfo = (file) => {
  if (!file) return null;
  
  return {
    filename: file.filename,
    originalName: file.originalname,
    url: null, // Will be set by controller
    fileType: file.mimetype,
    size: file.size,
    path: file.path,
    uploadedAt: new Date()
  };
};

/**
 * Clean up old temporary files (older than 24 hours)
 * @returns {Promise<number>} Number of files deleted
 */
const cleanupTempFiles = async () => {
  const tempDir = UPLOAD_DIRS.temp;
  if (!fs.existsSync(tempDir)) return 0;
  
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  let deletedCount = 0;
  
  try {
    const files = fs.readdirSync(tempDir);
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      if (stats.mtimeMs < oneDayAgo) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }
    if (deletedCount > 0) {
      logger.info(`Cleaned up ${deletedCount} temporary files`);
    }
  } catch (error) {
    logger.error(`Failed to cleanup temp files: ${error.message}`);
  }
  
  return deletedCount;
};

/**
 * Validate file before upload
 * @param {Object} file - File object
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
const validateFile = (file, options = {}) => {
  const errors = [];
  
  // Check file size
  const maxSize = options.maxSize || UPLOAD.MAX_FILE_SIZE;
  if (file.size > maxSize) {
    errors.push(`File size exceeds maximum of ${maxSize / (1024 * 1024)}MB`);
  }
  
  // Check file type
  if (options.allowedTypes && options.allowedTypes.length) {
    if (!options.allowedTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} not allowed`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// ============================
// EXPORTS
// ============================

module.exports = {
  // Upload middlewares
  uploadAvatar,
  uploadNoticeImage,
  uploadNoticeImages,
  uploadNoticeDocument,
  uploadEventPoster,
  uploadEventGallery,
  uploadCertificate,
  
  // Helper functions
  deleteFile,
  deleteFiles,
  getFileUrl,
  getFileInfo,
  validateFile,
  cleanupTempFiles,
  handleMulterError,
  
  // Constants
  UPLOAD_DIRS
};