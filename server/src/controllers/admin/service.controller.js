/**
 * Admin Services Controller
 * Provides complete CRUD, partner routing, quotation management, and status
 * tracking for platform services (Loans, Interiors, Movers, Legal).
 */

const ServiceRequest = require('../../models/service-request.model');
const User = require('../../models/user.model');
const Property = require('../../models/property.model');

// Helper to provide standard milestone stages for a service type
const getDefaultMilestones = (serviceType) => {
  switch (serviceType) {
    case 'Loan':
      return [
        { stage: 'Request Logged', date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), status: 'done' },
        { stage: 'KYC & Income Proof Collected', date: 'In Review', status: 'active' },
        { stage: 'Bank Processing & Underwriting', date: 'Pending', status: 'pending' },
        { stage: 'Sanction & Disbursement', date: 'Pending', status: 'pending' }
      ];
    case 'Interior':
      return [
        { stage: 'Consultation Booked', date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), status: 'done' },
        { stage: 'Site Measurement & Walkthrough', date: 'Scheduled', status: 'active' },
        { stage: '3D Concept & BOQ Quotation', date: 'Pending', status: 'pending' },
        { stage: 'Execution & Final Handover', date: 'Pending', status: 'pending' }
      ];
    case 'Movers':
      return [
        { stage: 'Moving Quote Requested', date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), status: 'done' },
        { stage: 'Inventory & Route Survey', date: 'In Progress', status: 'active' },
        { stage: 'Advance Token & Schedule Confirmed', date: 'Pending', status: 'pending' },
        { stage: 'Packing, Transit & Safe Delivery', date: 'Pending', status: 'pending' }
      ];
    case 'Legal':
      return [
        { stage: 'Case File Created', date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), status: 'done' },
        { stage: 'Revenue Records & Encumbrance Audit', date: 'In Progress', status: 'active' },
        { stage: 'Legal Title Opinion Drafted', date: 'Pending', status: 'pending' },
        { stage: 'Sub-Registrar Slot & Registration', date: 'Pending', status: 'pending' }
      ];
    default:
      return [
        { stage: 'Request Logged', date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), status: 'done' },
        { stage: 'Partner Processing', date: 'In Progress', status: 'active' },
        { stage: 'Fulfillment & Close', date: 'Pending', status: 'pending' }
      ];
  }
};

// @desc    Get all service requests with counts & filters
// @route   GET /api/admin/services
// @access  Private (Admin only)
exports.getAllServices = async (req, res, next) => {
  try {
    const { serviceType, status, search } = req.query;
    const filter = {};

    if (serviceType && serviceType !== 'ALL') {
      filter.serviceType = serviceType;
    }

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { clientName: regex },
        { clientPhone: regex },
        { clientEmail: regex },
        { serviceRequestId: regex },
        { serviceName: regex },
        { location: regex },
        { propertyRef: regex },
        { assignedPartner: regex }
      ];
    }

    const [services, totalCount, loanCount, interiorCount, moversCount, legalCount] = await Promise.all([
      ServiceRequest.find(filter)
        .populate('property', 'title price locality city carpetArea')
        .populate('client', 'name email phone')
        .sort({ createdAt: -1 }),
      ServiceRequest.countDocuments(),
      ServiceRequest.countDocuments({ serviceType: 'Loan' }),
      ServiceRequest.countDocuments({ serviceType: 'Interior' }),
      ServiceRequest.countDocuments({ serviceType: 'Movers' }),
      ServiceRequest.countDocuments({ serviceType: 'Legal' })
    ]);

    res.status(200).json({
      status: 'success',
      results: services.length,
      counts: {
        total: totalCount,
        loan: loanCount,
        interior: interiorCount,
        movers: moversCount,
        legal: legalCount
      },
      data: {
        services
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single service request details
// @route   GET /api/admin/services/:id
// @access  Private (Admin only)
exports.getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let service = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      service = await ServiceRequest.findById(id)
        .populate('property', 'title price locality city carpetArea images propertyImages')
        .populate('client', 'name email phone');
    } else {
      service = await ServiceRequest.findOne({ serviceRequestId: id })
        .populate('property', 'title price locality city carpetArea images propertyImages')
        .populate('client', 'name email phone');
    }

    if (!service) {
      return res.status(404).json({
        status: 'fail',
        message: 'No service request found with that ID.'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        service
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new service request
// @route   POST /api/admin/services
// @access  Private (Admin only)
exports.createService = async (req, res, next) => {
  try {
    const {
      serviceType,
      serviceName,
      clientName,
      clientPhone,
      clientEmail,
      location,
      propertyId,
      propertyRef,
      propertyValue,
      propertySize,
      loanRequired,
      employmentType,
      monthlyIncome,
      cibilScore,
      preferredBank,
      budgetRange,
      designStyle,
      scope,
      moveType,
      shiftingDate,
      packingQuality,
      insuranceRequired,
      legalServiceScope,
      courtJurisdiction,
      assignedPartner,
      quotation,
      quotationSubtext,
      status,
      notes
    } = req.body;

    if (!clientName || !clientPhone || !serviceType) {
      return res.status(400).json({
        status: 'fail',
        message: 'Client name, phone number, and serviceType are required.'
      });
    }

    // Default service names if omitted
    const defaultNames = {
      Loan: 'Home Loan Assistance',
      Interior: 'Home Interior Fitout',
      Movers: 'Relocation & Shifting',
      Legal: 'Title & Property Verification'
    };

    // Associate existing User if phone/email matches
    const existingUser = await User.findOne({
      $or: [
        { phone: clientPhone.trim() },
        ...(clientEmail ? [{ email: clientEmail.trim().toLowerCase() }] : [])
      ]
    });

    const prefix =
      serviceType === 'Loan' ? 'SRV-LN' :
      serviceType === 'Interior' ? 'SRV-INT' :
      serviceType === 'Movers' ? 'SRV-MOV' : 'SRV-LEG';
    const randomNum = Math.floor(100 + Math.random() * 900);
    const serviceRequestId = `${prefix}-${randomNum}`;

    const newService = await ServiceRequest.create({
      serviceRequestId,
      serviceType,
      serviceName: serviceName?.trim() || defaultNames[serviceType] || `${serviceType} Service`,
      client: existingUser ? existingUser._id : undefined,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail ? clientEmail.trim().toLowerCase() : '',
      location: location?.trim() || 'India',
      property: propertyId && propertyId.match(/^[0-9a-fA-F]{24}$/) ? propertyId : undefined,
      propertyRef: propertyRef?.trim() || 'Direct Inquiry',
      propertyValue: propertyValue?.trim() || '',
      propertySize: propertySize?.trim() || '',
      loanRequired: loanRequired?.trim() || '',
      employmentType: employmentType?.trim() || '',
      monthlyIncome: monthlyIncome?.trim() || '',
      cibilScore: cibilScore?.trim() || '',
      preferredBank: preferredBank?.trim() || '',
      budgetRange: budgetRange?.trim() || '',
      designStyle: designStyle?.trim() || '',
      scope: Array.isArray(scope) ? scope : [],
      moveType: moveType?.trim() || '',
      shiftingDate: shiftingDate?.trim() || '',
      packingQuality: packingQuality?.trim() || '',
      insuranceRequired: insuranceRequired?.trim() || '',
      legalServiceScope: legalServiceScope?.trim() || '',
      courtJurisdiction: courtJurisdiction?.trim() || '',
      assignedPartner: assignedPartner?.trim() || '',
      quotation: quotation ? (quotation.startsWith('₹') ? quotation : `₹${quotation}`) : 'Under Review',
      quotationSubtext: quotationSubtext?.trim() || 'Initial Estimate',
      status: status || 'In Progress',
      timeline: getDefaultMilestones(serviceType),
      notes: notes?.trim() || 'Inquiry registered by administrator.',
      notesHistory: [
        {
          text: notes?.trim() || 'Inquiry registered by administrator.',
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          author: req.user?.name || 'Admin',
          createdAt: new Date()
        }
      ]
    });

    const populated = await ServiceRequest.findById(newService._id)
      .populate('property', 'title price locality city carpetArea')
      .populate('client', 'name email phone');

    res.status(201).json({
      status: 'success',
      message: 'Service request created successfully.',
      data: {
        service: populated
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update service request (status, partner, quotation, notes, timeline)
// @route   PATCH /api/admin/services/:id
// @access  Private (Admin only)
exports.updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    let service = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      service = await ServiceRequest.findById(id);
    } else {
      service = await ServiceRequest.findOne({ serviceRequestId: id });
    }

    if (!service) {
      return res.status(404).json({
        status: 'fail',
        message: 'No service request found with that ID.'
      });
    }

    const {
      status,
      assignedPartner,
      quotation,
      quotationSubtext,
      notes,
      newNote,
      timeline,
      clientName,
      clientPhone,
      clientEmail,
      location,
      serviceName,
      propertyRef,
      propertyValue,
      loanRequired,
      budgetRange,
      shiftingDate
    } = req.body;

    if (status) service.status = status;
    if (assignedPartner !== undefined) service.assignedPartner = assignedPartner;
    if (quotation !== undefined) {
      service.quotation = quotation ? (quotation.startsWith('₹') ? quotation : `₹${quotation}`) : service.quotation;
    }
    if (quotationSubtext !== undefined) service.quotationSubtext = quotationSubtext;
    if (clientName) service.clientName = clientName.trim();
    if (clientPhone) service.clientPhone = clientPhone.trim();
    if (clientEmail !== undefined) service.clientEmail = clientEmail.trim();
    if (location !== undefined) service.location = location.trim();
    if (serviceName) service.serviceName = serviceName.trim();
    if (propertyRef !== undefined) service.propertyRef = propertyRef.trim();
    if (propertyValue !== undefined) service.propertyValue = propertyValue.trim();
    if (loanRequired !== undefined) service.loanRequired = loanRequired.trim();
    if (budgetRange !== undefined) service.budgetRange = budgetRange.trim();
    if (shiftingDate !== undefined) service.shiftingDate = shiftingDate.trim();

    if (Array.isArray(timeline)) {
      service.timeline = timeline;
    }

    // Append notes
    const noteTextToAdd = newNote || notes;
    if (noteTextToAdd && typeof noteTextToAdd === 'string' && noteTextToAdd.trim()) {
      service.notes = noteTextToAdd.trim();
      service.notesHistory = service.notesHistory || [];
      service.notesHistory.push({
        text: noteTextToAdd.trim(),
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        author: req.user?.name || 'Admin',
        createdAt: new Date()
      });
    }

    await service.save();

    const populated = await ServiceRequest.findById(service._id)
      .populate('property', 'title price locality city carpetArea')
      .populate('client', 'name email phone');

    res.status(200).json({
      status: 'success',
      message: 'Service request updated successfully.',
      data: {
        service: populated
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete service request
// @route   DELETE /api/admin/services/:id
// @access  Private (Admin only)
exports.deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;
    let service = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      service = await ServiceRequest.findByIdAndDelete(id);
    } else {
      service = await ServiceRequest.findOneAndDelete({ serviceRequestId: id });
    }

    if (!service) {
      return res.status(404).json({
        status: 'fail',
        message: 'No service request found with that ID.'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Service request deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
