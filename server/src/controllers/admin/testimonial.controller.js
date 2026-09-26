const Testimonial = require('../../models/testimonial.model');

// Get all testimonials (with filters & search)
exports.getTestimonials = async (req, res) => {
  try {
    const { search, isActive, sort = 'desc' } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
        { quote: { $regex: search, $options: 'i' } }
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const testimonials = await Testimonial.find(query)
      .sort({ createdAt: sort === 'asc' ? 1 : -1 });

    res.status(200).json({
      status: 'success',
      data: { testimonials }
    });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch testimonials' });
  }
};

// Get single testimonial
exports.getTestimonialById = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ status: 'error', message: 'Testimonial not found' });
    }
    res.status(200).json({
      status: 'success',
      data: { testimonial }
    });
  } catch (error) {
    console.error('Error fetching testimonial:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch testimonial' });
  }
};

// Create new testimonial
exports.createTestimonial = async (req, res) => {
  try {
    const testimonialData = { ...req.body };
    
    // Parse stages array if it comes as a string from form-data
    if (typeof testimonialData.stages === 'string') {
      try {
        testimonialData.stages = JSON.parse(testimonialData.stages);
      } catch (e) {
        // Fallback or leave as is if not JSON
      }
    }

    if (req.files) {
      if (req.files.avatar && req.files.avatar[0]) {
        testimonialData.avatar = `${req.protocol}://${req.get('host')}/uploads/${req.files.avatar[0].filename}`;
      }
      if (req.files.propertyImage && req.files.propertyImage[0]) {
        testimonialData.propertyImage = `${req.protocol}://${req.get('host')}/uploads/${req.files.propertyImage[0].filename}`;
      }
    }

    const testimonial = await Testimonial.create(testimonialData);
    res.status(201).json({
      status: 'success',
      data: { testimonial }
    });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create testimonial' });
  }
};

// Update testimonial
exports.updateTestimonial = async (req, res) => {
  try {
    const testimonialData = { ...req.body };
    
    // Parse stages array if it comes as a string from form-data
    if (typeof testimonialData.stages === 'string') {
      try {
        testimonialData.stages = JSON.parse(testimonialData.stages);
      } catch (e) {
        // Fallback or leave as is if not JSON
      }
    }

    if (req.files) {
      if (req.files.avatar && req.files.avatar[0]) {
        testimonialData.avatar = `${req.protocol}://${req.get('host')}/uploads/${req.files.avatar[0].filename}`;
      }
      if (req.files.propertyImage && req.files.propertyImage[0]) {
        testimonialData.propertyImage = `${req.protocol}://${req.get('host')}/uploads/${req.files.propertyImage[0].filename}`;
      }
    }
    
    if (req.body.removeAvatar === 'true') {
      testimonialData.avatar = '';
    }
    if (req.body.removePropertyImage === 'true') {
      testimonialData.propertyImage = '';
    }

    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      testimonialData,
      { new: true, runValidators: true }
    );

    if (!testimonial) {
      return res.status(404).json({ status: 'error', message: 'Testimonial not found' });
    }

    res.status(200).json({
      status: 'success',
      data: { testimonial }
    });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update testimonial' });
  }
};

// Delete testimonial
exports.deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ status: 'error', message: 'Testimonial not found' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Testimonial deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete testimonial' });
  }
};

// Bulk delete testimonials
exports.bulkDeleteTestimonials = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Please provide an array of IDs' });
    }

    await Testimonial.deleteMany({ _id: { $in: ids } });

    res.status(200).json({
      status: 'success',
      message: 'Testimonials deleted successfully'
    });
  } catch (error) {
    console.error('Error bulk deleting testimonials:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete testimonials' });
  }
};

// Reorder testimonials
exports.reorderTestimonials = async (req, res) => {
  try {
    const { items } = req.body; // Array of { id, sortOrder }

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ status: 'error', message: 'items array is required' });
    }

    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { sortOrder: item.sortOrder }
      }
    }));

    if (bulkOps.length > 0) {
      await Testimonial.bulkWrite(bulkOps);
    }

    res.status(200).json({
      status: 'success',
      message: 'Reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering testimonials:', error);
    res.status(500).json({ status: 'error', message: 'Failed to reorder testimonials' });
  }
};
