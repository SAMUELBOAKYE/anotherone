const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');
const { UPLOAD } = require('../config/constants');

/**
 * Avatar Generator for KAAF University Noticeboard System
 * Automatically generates professional avatars for users
 * @version 2.0.0
 * @author Boakye Samuel Yiadom
 */

// Ensure avatars directory exists
const AVATAR_DIR = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(AVATAR_DIR)) {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
  logger.info(`Created avatars directory: ${AVATAR_DIR}`);
}

// Professional university color palette
const AVATAR_COLORS = [
  '#4F46E5', // Indigo - Primary
  '#10B981', // Emerald - Success
  '#F59E0B', // Amber - Warning
  '#EF4444', // Red - Danger
  '#3B82F6', // Blue - Info
  '#8B5CF6', // Purple - Royal
  '#EC4899', // Pink - Creative
  '#14B8A6', // Teal - Calm
  '#F97316', // Orange - Energy
  '#6366F1', // Indigo Light - Professional
  '#06B6D4', // Cyan - Fresh
  '#84CC16', // Lime - Growth
];

/**
 * Get consistent color based on user ID or name
 * @param {string} identifier - User ID or email
 * @returns {string} Hex color code
 */
const getAvatarColor = (identifier) => {
  let hash = 0;
  const str = String(identifier);
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

/**
 * Get initials from first and last name
 * @param {string} firstName - User's first name
 * @param {string} lastName - User's last name
 * @returns {string} Initials (max 2 characters)
 */
const getInitials = (firstName, lastName) => {
  const firstInitial = firstName && firstName.length > 0 ? firstName.charAt(0).toUpperCase() : 'U';
  const lastInitial = lastName && lastName.length > 0 ? lastName.charAt(0).toUpperCase() : '';
  return lastInitial ? `${firstInitial}${lastInitial}` : firstInitial;
};

/**
 * Generate avatar as PNG buffer
 * @param {string} initials - User initials (1-2 characters)
 * @param {string} color - Background color
 * @param {number} size - Avatar size in pixels
 * @returns {Buffer} PNG image buffer
 */
const generateAvatarBuffer = (initials, color, size = 200) => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Draw background circle
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  
  // Add subtle radial gradient for depth
  const gradient = ctx.createRadialGradient(
    size * 0.3, size * 0.3, 0,
    size * 0.7, size * 0.7, size * 0.8
  );
  gradient.addColorStop(0, 'rgba(255,255,255,0.3)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.1)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.1)');
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Draw text (initials)
  ctx.fillStyle = '#FFFFFF';
  const fontSize = initials.length === 1 ? size * 0.5 : size * 0.4;
  ctx.font = `bold ${fontSize}px "Segoe UI", "Arial", "Helvetica Neue", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, size / 2, size / 2);
  
  // Add subtle border
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = Math.max(2, size * 0.02);
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - ctx.lineWidth, 0, Math.PI * 2);
  ctx.stroke();
  
  // Optional: Add a subtle pattern overlay for texture
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < 50; i++) {
    ctx.beginPath();
    ctx.arc(
      Math.random() * size,
      Math.random() * size,
      Math.random() * 3,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  
  return canvas.toBuffer('image/png');
};

/**
 * Generate and save avatar for user
 * @param {string} userId - User ID
 * @param {string} firstName - User's first name
 * @param {string} lastName - User's last name
 * @param {string} email - User's email (for color generation)
 * @returns {Promise<string>} Generated avatar filename
 */
const generateAvatar = async (userId, firstName, lastName, email = null) => {
  try {
    const identifier = email || userId;
    const initials = getInitials(firstName, lastName);
    const color = getAvatarColor(identifier);
    const avatarBuffer = await generateAvatarBuffer(initials, color);
    
    const timestamp = Date.now();
    const randomId = uuidv4().substring(0, 8);
    const filename = `avatar-${userId}-${timestamp}-${randomId}.png`;
    const filepath = path.join(AVATAR_DIR, filename);
    
    fs.writeFileSync(filepath, avatarBuffer);
    logger.info(`Avatar generated for user: ${userId} (${initials})`);
    
    return filename;
  } catch (error) {
    logger.error(`Avatar generation error for user ${userId}: ${error.message}`);
    return 'default-avatar.png';
  }
};

/**
 * Generate avatar synchronously (for immediate use)
 * @param {string} userId - User ID
 * @param {string} firstName - User's first name
 * @param {string} lastName - User's last name
 * @param {string} email - User's email
 * @returns {string} Generated avatar filename
 */
const generateAvatarSync = (userId, firstName, lastName, email = null) => {
  try {
    const identifier = email || userId;
    const initials = getInitials(firstName, lastName);
    const color = getAvatarColor(identifier);
    const avatarBuffer = generateAvatarBuffer(initials, color);
    
    const timestamp = Date.now();
    const randomId = uuidv4().substring(0, 8);
    const filename = `avatar-${userId}-${timestamp}-${randomId}.png`;
    const filepath = path.join(AVATAR_DIR, filename);
    
    fs.writeFileSync(filepath, avatarBuffer);
    logger.debug(`Avatar generated synchronously for user: ${userId}`);
    
    return filename;
  } catch (error) {
    logger.error(`Sync avatar generation error for user ${userId}: ${error.message}`);
    return 'default-avatar.png';
  }
};

/**
 * Delete avatar file
 * @param {string} filename - Avatar filename
 * @returns {boolean} Success status
 */
const deleteAvatar = (filename) => {
  try {
    if (!filename || filename === 'default-avatar.png') {
      return false;
    }
    
    const filepath = path.join(AVATAR_DIR, filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      logger.info(`Avatar deleted: ${filename}`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`Failed to delete avatar ${filename}: ${error.message}`);
    return false;
  }
};

/**
 * Get avatar URL
 * @param {Object} req - Express request object
 * @param {string} filename - Avatar filename
 * @returns {string|null} Full avatar URL
 */
const getAvatarUrl = (req, filename) => {
  if (!filename) return null;
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/avatars/${filename}`;
};

/**
 * Update user avatar in database
 * @param {Object} user - User document
 * @param {string} firstName - User's first name
 * @param {string} lastName - User's last name
 * @param {string} email - User's email
 * @returns {Promise<string>} New avatar filename
 */
const updateUserAvatar = async (user, firstName, lastName, email) => {
  // Delete old avatar if not default
  if (user.avatar && user.avatar !== 'default-avatar.png') {
    deleteAvatar(user.avatar);
  }
  
  // Generate new avatar
  const newAvatar = await generateAvatar(
    user._id,
    firstName || user.firstName,
    lastName || user.lastName,
    email || user.email
  );
  
  // Update user
  user.avatar = newAvatar;
  await user.save();
  
  return newAvatar;
};

/**
 * Batch generate avatars for multiple users
 * @param {Array} users - Array of user objects
 * @returns {Promise<Object>} Results with success and failed counts
 */
const batchGenerateAvatars = async (users) => {
  let success = 0;
  let failed = 0;
  const results = [];
  
  for (const user of users) {
    try {
      const avatar = await generateAvatar(
        user._id,
        user.firstName,
        user.lastName,
        user.email
      );
      user.avatar = avatar;
      await user.save();
      success++;
      results.push({ userId: user._id, success: true, avatar });
    } catch (error) {
      failed++;
      results.push({ userId: user._id, success: false, error: error.message });
      logger.error(`Batch avatar generation failed for user ${user._id}: ${error.message}`);
    }
  }
  
  logger.info(`Batch avatar generation: ${success} succeeded, ${failed} failed`);
  return { success, failed, results };
};

/**
 * Get avatar statistics
 * @returns {Promise<Object>} Avatar statistics
 */
const getAvatarStats = async () => {
  try {
    const files = fs.readdirSync(AVATAR_DIR);
    const totalAvatars = files.filter(f => f.startsWith('avatar-')).length;
    const totalSize = files
      .filter(f => f.startsWith('avatar-'))
      .reduce((sum, file) => {
        const stats = fs.statSync(path.join(AVATAR_DIR, file));
        return sum + stats.size;
      }, 0);
    
    return {
      totalAvatars,
      totalSize: (totalSize / (1024 * 1024)).toFixed(2) + ' MB',
      directory: AVATAR_DIR
    };
  } catch (error) {
    logger.error(`Failed to get avatar stats: ${error.message}`);
    return null;
  }
};

module.exports = {
  generateAvatar,
  generateAvatarSync,
  deleteAvatar,
  getAvatarUrl,
  updateUserAvatar,
  batchGenerateAvatars,
  getAvatarStats,
  AVATAR_DIR,
  AVATAR_COLORS
};