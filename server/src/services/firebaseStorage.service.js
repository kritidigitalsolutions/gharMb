/**
 * Firebase Cloud Storage Service
 * Provides production-ready utilities to upload, retrieve, and delete files
 * in Google Cloud / Firebase Storage bucket (gharmb-1ce6f.firebasestorage.app).
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { bucket } = require('../config/firebase');

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
   * Upload a memory Buffer directly to Firebase Storage
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

    const cleanFilename = this._sanitizeFilename(originalname);
    const destinationPath = folder ? `${folder.replace(/^\/+|\/+$/g, '')}/${cleanFilename}` : cleanFilename;

    const fileRef = bucket.file(destinationPath);
    const downloadToken = crypto.randomUUID();

    await fileRef.save(buffer, {
      resumable: false,
      metadata: {
        contentType: mimetype,
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
          originalName: originalname,
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
      filename: cleanFilename,
      path: destinationPath,
      size: buffer.length,
      mimetype,
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
   * Helper to resolve file URL: Uploads to Firebase Storage if available,
   * otherwise falls back to local server URL.
   * @param {Object} req - Express request
   * @param {Object} file - Multer file object
   * @param {string} folder - Folder name in bucket (e.g. 'properties', 'banners', 'uploads')
   */
  async resolveFileUrl(req, file, folder = 'uploads') {
    if (!file) return null;

    // 1. Try uploading to Firebase Storage if available
    if (this.isConfigured()) {
      try {
        let result = null;
        if (file.buffer) {
          result = await this.uploadBuffer(file.buffer, file.originalname, file.mimetype, folder);
        } else if (file.path && fs.existsSync(file.path)) {
          result = await this.uploadLocalFile(file.path, file.originalname, file.mimetype, folder, true);
        }

        if (result && result.url) {
          return result.url;
        }
      } catch (fbErr) {
        console.warn(`⚠️ Firebase Storage upload failed for ${file.originalname || file.filename}:`, fbErr.message);
      }
    }

    // 2. Emergency fallback to local server URL (only if Firebase is not configured or down)
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host') || 'localhost:5001';
    let filename = file.filename;
    if (!filename) {
      const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
      filename = `file-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      if (file.buffer) {
        try {
          const uploadDir = path.join(__dirname, '../../uploads');
          if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
          fs.writeFileSync(path.join(uploadDir, filename), file.buffer);
        } catch (_) {}
      }
    }
    return `${protocol}://${host}/uploads/${filename}`;
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
