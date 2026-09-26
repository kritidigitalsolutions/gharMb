/**
 * Public Web Inquiry Controller
 * Handles submissions from Website Contact Form & Delete Profile Requests
 */

const WebInquiry = require('../../models/web-inquiry.model');

// @desc    Submit a new web inquiry (Contact Form or Deletion Request)
// @route   POST /api/web-inquiries
// @access  Public
exports.createWebInquiry = async (req, res, next) => {
  try {
    const {
      type = 'contact',
      fullName,
      email,
      phone,
      role = 'seeker',
      subject,
      message,
      reason,
      notes,
    } = req.body;

    if (!fullName || !email || !phone) {
      return res.status(400).json({
        status: 'fail',
        message: 'Full Name, Email, and Mobile Number are required.',
      });
    }

    if (type === 'contact' && !message) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a message or inquiry details.',
      });
    }

    // Capture client IP and User-Agent
    const ipAddress =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.socket?.remoteAddress ||
      req.ip;
    const userAgent = req.headers['user-agent'] || '';

    // Generate reference ID
    const prefix = type === 'deletion_request' ? 'GMB-DEL' : 'GMB-INQ';
    const refId = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;

    const inquiry = await WebInquiry.create({
      refId,
      type: type === 'deletion_request' ? 'deletion_request' : 'contact',
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role: role ? String(role).trim() : 'seeker',
      subject: subject ? subject.trim() : undefined,
      message: message ? message.trim() : undefined,
      reason: reason ? reason.trim() : undefined,
      notes: notes ? notes.trim() : undefined,
      ipAddress,
      userAgent,
      status: 'new',
    });

    res.status(201).json({
      status: 'success',
      message:
        type === 'deletion_request'
          ? 'Your account deletion request has been registered successfully.'
          : 'Thank you for reaching out. We will get back to you within 24 hours.',
      data: {
        refId: inquiry.refId,
        id: inquiry._id,
        createdAt: inquiry.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};
