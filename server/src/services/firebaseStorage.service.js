/**
 * Firebase Cloud Storage Service
 * Provides production-ready utilities to upload, retrieve, and delete files
 * in Google Cloud / Firebase Storage bucket (gharmb-1ce6f.firebasestorage.app).
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { bucket, hasServiceAccount } = require('../config/firebase');
const { optimizeImage } = require('../utils/imageOptimizer');

class FirebaseStorageService {
  /**
   * Check if Firebase Storage bucket is configured and available
   */
  isConfigured() {
    return Boolean(bucket);
  }

  /**
   * Get the active bucket name
   */
  getBucketName() {
    return bucket ? bucket.name : null;
  }

  /**
   * Sanitize a filename to be safe for cloud storage
   */
  _sanitizeFilename(originalname = 'file') {
    const ext = path.extname(originalname).toLowerCase() || '';
    const nameWithoutExt = path.basename(originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 50) || 'file';
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    return `${nameWithoutExt}-${uniqueSuffix}${ext}`;
  }

  /**
   * Upload a memory Buffer directly to Firebase Storage with automatic Sharp optimization & CDN caching
   * @param {Buffer} buffer - File buffer to upload
   * @param {string} originalname - Original file name (e.g. photo.jpg)
   * @param {string} mimetype - MIME type (e.g. image/jpeg)
   * @param {string} folder - Destination folder inside bucket (e.g. 'properties', 'projects', 'uploads')
   * @returns {Promise<{ url: string, firebaseUrl: string, publicUrl: string, filename: string, path: string, size: number, mimetype: string }>}
   */
  async uploadBuffer(buffer, originalname = 'file', mimetype = 'application/octet-stream', folder = 'uploads') {
    if (!this.isConfigured()) {
      throw new Error('Firebase Storage is not initialized. Please verify serviceAccountKey.json and FIREBASE_STORAGE_BUCKET.');
    }

    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error('Invalid file buffer provided for Firebase Storage upload.');
    }

    // ⚡ Auto-optimize images (WebP conversion, resize large images, strip bloated metadata)
    const optimized = await optimizeImage(buffer, originalname, mimetype);
    const finalBuffer = optimized.buffer;
    const finalFilename = this._sanitizeFilename(optimized.filename);
    const finalMimetype = optimized.mimetype;

    const destinationPath = folder ? `${folder.replace(/^\/+|\/+$/g, '')}/${finalFilename}` : finalFilename;

    const fileRef = bucket.file(destinationPath);
    const downloadToken = crypto.randomUUID();

    // 🚀 Set 1-year immutable cache header for instant repeat loads worldwide
    await fileRef.save(finalBuffer, {
      resumable: false,
      metadata: {
        contentType: finalMimetype,
        cacheControl: 'public, max-age=31536000, immutable',
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
          originalName: originalname,
          optimized: String(optimized.wasOptimized),
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Attempt to set public read permissions
    try {
      await fileRef.makePublic();
    } catch (_) {
      // Ignored if Uniform Bucket-Level Access is enforced on Google Cloud
    }

    // Firebase Download URL (works universally in browsers, mobile, and Firebase console)
    const firebaseUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destinationPath)}?alt=media&token=${downloadToken}`;
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${encodeURIComponent(destinationPath)}`;

    return {
      url: firebaseUrl,
      firebaseUrl,
      publicUrl,
      filename: finalFilename,
      path: destinationPath,
      size: finalBuffer.length,
      mimetype: finalMimetype,
      originalName: originalname,
    };
  }

  /**
   * Upload a local file from disk (e.g., saved by Multer diskStorage) to Firebase Storage
   * @param {string} localFilePath - Absolute path to local file
   * @param {string} originalname - Original file name
   * @param {string} mimetype - MIME type
   * @param {string} folder - Destination folder
   * @param {boolean} removeLocalAfter - Whether to remove the local file after upload
   */
  async uploadLocalFile(localFilePath, originalname, mimetype = 'application/octet-stream', folder = 'uploads', removeLocalAfter = true) {
    if (!fs.existsSync(localFilePath)) {
      throw new Error(`Local file not found at: ${localFilePath}`);
    }

    const buffer = fs.readFileSync(localFilePath);
    const origName = originalname || path.basename(localFilePath);
    const result = await this.uploadBuffer(buffer, origName, mimetype, folder);

    if (removeLocalAfter) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (err) {
        console.warn(`Could not remove temporary local file ${localFilePath}:`, err.message);
      }
    }

    return result;
  }

  /**
   * Generate a V4 Pre-Signed Upload URL for direct client-to-Firebase upload.
   * Allows frontend to upload videos (up to 5GB) and large photos directly to Firebase Storage,
   * completely bypassing Vercel's 4.5MB Serverless Payload limit.
   * 
   * @param {string} originalname - Name of file (e.g. 'tour.mp4')
   * @param {string} mimetype - MIME type (e.g. 'video/mp4')
   * @param {string} folder - Folder name in bucket (e.g. 'properties', 'banners', 'uploads')
   * @param {number} expiresInMinutes - URL validity in minutes (default 15)
   * @returns {Promise<{ uploadUrl: string, downloadUrl: string, firebaseUrl: string, filename: string, path: string, mimetype: string }>}
   */
  async createSignedUploadUrl(originalname = 'file', mimetype = 'application/octet-stream', folder = 'uploads', expiresInMinutes = 15) {
    if (!this.isConfigured()) {
      throw new Error('Firebase Storage is not initialized. Please verify service account credentials.');
    }

    const finalFilename = this._sanitizeFilename(originalname);
    const destinationPath = folder ? `${folder.replace(/^\/+|\/+$/g, '')}/${finalFilename}` : finalFilename;
    const fileRef = bucket.file(destinationPath);
    const downloadToken = crypto.randomUUID();

    // Generate V4 write-action Signed URL
    const [uploadUrl] = await fileRef.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + expiresInMinutes * 60 * 1000,
      contentType: mimetype,
    });

    // Firebase Download URL (accessible after direct upload)
    const firebaseUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destinationPath)}?alt=media&token=${downloadToken}`;
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${encodeURIComponent(destinationPath)}`;

    return {
      uploadUrl,
      downloadUrl: firebaseUrl,
      firebaseUrl,
      publicUrl,
      filename: finalFilename,
      path: destinationPath,
      mimetype,
      downloadToken,
    };
  }

  /**
   * Helper to resolve file URL: Uploads STRICTLY to Firebase Cloud Storage.
   * Zero local fallback. Returns only persistent Firebase Storage URLs.
   * @param {Object} req - Express request
   * @param {Object} file - Multer file object
   * @param {string} folder - Folder name in bucket (e.g. 'properties', 'banners', 'uploads')
   * @returns {Promise<string>} Firebase Storage public download URL
   */
  async resolveFileUrl(req, file, folder = 'uploads') {
    if (!file) return null;

    if (!this.isConfigured()) {
      throw new Error('Firebase Storage is not initialized. Please verify Firebase credentials (firebaseCredentials.json / FIREBASE_SERVICE_ACCOUNT).');
    }

    try {
      let result = null;
      if (file.buffer) {
        result = await this.uploadBuffer(file.buffer, file.originalname, file.mimetype, folder);
      } else if (file.path && fs.existsSync(file.path)) {
        result = await this.uploadLocalFile(file.path, file.originalname, file.mimetype, folder, true);
      } else {
        throw new Error(`File buffer or valid local path missing for ${file.originalname || file.filename}`);
      }

      if (result && result.url) {
        return result.url;
      }
      throw new Error(`Upload succeeded but no URL was returned for ${file.originalname || file.filename}`);
    } catch (fbErr) {
      console.error(`❌ Firebase Storage upload failed for "${file.originalname || file.filename}":`, fbErr.message);
      throw new Error(`Firebase Storage Upload Failed: ${fbErr.message}`);
    }
  }

  /**
   * Delete a file from Firebase Storage
   * @param {string} fileUrlOrPath - Full Firebase URL, public URL, or storage path
   */
  async deleteFile(fileUrlOrPath) {
    if (!this.isConfigured() || !fileUrlOrPath) return false;

    try {
      let storagePath = fileUrlOrPath;

      // Extract path from Firebase download URL: .../o/uploads%2Fsample.jpg?alt=...
      const fbMatch = fileUrlOrPath.match(/\/o\/([^?]+)/);
      if (fbMatch && fbMatch[1]) {
        storagePath = decodeURIComponent(fbMatch[1]);
      } else {
        // Extract path from storage.googleapis.com/bucketName/path
        const gcsMatch = fileUrlOrPath.match(/storage\.googleapis\.com\/[^\/]+\/(.+)/);
        if (gcsMatch && gcsMatch[1]) {
          storagePath = decodeURIComponent(gcsMatch[1]);
        }
      }

      const fileRef = bucket.file(storagePath);
      const [exists] = await fileRef.exists();
      if (exists) {
        await fileRef.delete();
        return true;
      }
      return false;
    } catch (err) {
      console.warn(`⚠️ Error deleting file from Firebase Storage:`, err.message);
      return false;
    }
  }
}

const firebaseStorageService = new FirebaseStorageService();

module.exports = firebaseStorageService;
