/**
 * Sale Confirmation Service
 * Monitors properties marked as sold by admin.
 * Triggers confirmation notifications after 3 days to verify sale completion.
 */

const Property = require('../models/property.model');
const Notification = require('../models/notification.model');
const Admin = require('../models/admin.model');

/**
 * Checks for properties marked as sold whose 3-day confirmation window has elapsed,
 * and sends confirmation notifications to both Admins and Property Owners.
 */
const checkAndTriggerSaleConfirmationNotifications = async () => {
  try {
    const now = new Date();

    // Query properties marked as sold where 3 days have elapsed and notification not yet sent
    const pendingProperties = await Property.find({
      saleStatus: 'marked_as_sold',
      saleConfirmationDueDate: { $lte: now },
      saleNotificationSent: { $ne: true },
    }).populate('owner', 'name email phone');

    if (!pendingProperties || pendingProperties.length === 0) {
      return { count: 0, properties: [] };
    }

    const admins = await Admin.find().select('_id');
    const triggered = [];

    for (const property of pendingProperties) {
      const ownerName = property.owner?.name || 'Owner';
      const propTitle = property.title || 'Untitled Property';
      const subId = property.submissionId || property._id;

      // 1. Notification for Admins (with forAdmin: true)
      if (admins.length > 0) {
        const adminNotifications = admins.map((admin) => ({
          recipient: admin._id,
          forAdmin: true,
          title: 'Action Required: Confirm Property Sale (3 Days Elapsed) 🔔',
          message: `Property "${propTitle}" (${subId}) was marked as sold 3 days ago. Please confirm whether the sale was completed or cancelled.`,
          type: 'property_sale',
          metadata: {
            propertyId: property._id,
            submissionId: subId,
            action: 'confirm_sale',
          },
          isRead: false,
        }));
        await Notification.insertMany(adminNotifications);
      } else {
        await Notification.create({
          forAdmin: true,
          title: 'Action Required: Confirm Property Sale (3 Days Elapsed) 🔔',
          message: `Property "${propTitle}" (${subId}) was marked as sold 3 days ago. Please confirm whether the sale was completed or cancelled.`,
          type: 'property_sale',
          metadata: {
            propertyId: property._id,
            submissionId: subId,
            action: 'confirm_sale',
          },
          isRead: false,
        });
      }

      // 2. Notification for Property Owner
      if (property.owner && (property.owner._id || property.owner)) {
        await Notification.create({
          recipient: property.owner._id || property.owner,
          title: 'Property Sale Status Review 🔔',
          message: `Hello ${ownerName}, your property listing "${propTitle}" was marked as sold 3 days ago. Admin is reviewing the final sale confirmation.`,
          type: 'property_sale',
          metadata: {
            propertyId: property._id,
            submissionId: subId,
            action: 'confirm_sale',
          },
          isRead: false,
        });
      }

      property.saleNotificationSent = true;
      await property.save();
      triggered.push({
        id: property._id,
        submissionId: subId,
        title: propTitle,
      });
    }

    console.log(`[Sale Confirmation Service] Triggered notifications for ${triggered.length} properties.`);
    return { count: triggered.length, properties: triggered };
  } catch (error) {
    console.error('⚠️ [Sale Confirmation Service Error]:', error.message);
    return { count: 0, error: error.message };
  }
};

/**
 * Initializes background scheduler to check pending sale confirmations periodically
 */
let schedulerInterval = null;
const startSaleConfirmationScheduler = () => {
  if (schedulerInterval) return;

  // Run initial check after a slight startup delay
  setTimeout(() => {
    checkAndTriggerSaleConfirmationNotifications().catch((err) => {
      console.warn('⚠️ Initial sale confirmation check notice:', err.message);
    });
  }, 10000);

  // Periodic recurring check every 15 minutes
  schedulerInterval = setInterval(() => {
    checkAndTriggerSaleConfirmationNotifications().catch((err) => {
      console.warn('⚠️ Recurring sale confirmation check notice:', err.message);
    });
  }, 15 * 60 * 1000);

  if (schedulerInterval.unref) {
    schedulerInterval.unref();
  }
};

module.exports = {
  checkAndTriggerSaleConfirmationNotifications,
  startSaleConfirmationScheduler,
};
