/**
 * File Upload Controller
 * Handles single and multiple file uploads (images, PDFs, documents) and returns accessible static URLs.
 */

// Helper to construct full public URL for uploaded files
const getFileUrl = (req, filename) => {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/uploads/${filename}`;
};

// @desc    Upload a single file (image / RERA certificate / Aadhaar / PAN card / PDF brochure)
// @route   POST /api/user/upload/single
// @access  Public / Private
exports.uploadSingleFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please select a file to upload.',
      });
    }

    const fileUrl = getFileUrl(req, req.file.filename);

    res.status(200).json({
      status: 'success',
      message: 'File uploaded successfully.',
      data: {
        fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload multiple files (up to 12 property / project photos)
// @route   POST /api/user/upload/multiple
// @access  Public / Private
exports.uploadMultipleFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please select at least one file to upload.',
      });
    }

    const fileUrls = req.files.map((file) => getFileUrl(req, file.filename));

    res.status(200).json({
      status: 'success',
      message: `${req.files.length} files uploaded successfully.`,
      data: {
        fileUrls,
        count: req.files.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
