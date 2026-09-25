const Testimonial = require('../../models/testimonial.model');

exports.getActiveTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 });
      
    res.status(200).json({
      status: 'success',
      data: { testimonials }
    });
  } catch (error) {
    console.error('Error fetching active testimonials:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch testimonials' });
  }
};
