/**
 * Referral Setting Model
 * Stores platform-wide referral network configurations and offer messages set by administrators.
 */

const mongoose = require('mongoose');

const referralSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      default: 'global_referral_config',
    },
    // Main congratulatory offer message displayed to referee/referrer upon code validation/signup
    offerMessage: {
      type: String,
      default: 'Congratulations! You got an offer with this referral.',
      trim: true,
    },
    // Secondary explanatory description
    offerDescription: {
      type: String,
      default: 'Congratulations! You unlocked an exclusive offer with this referral.',
      trim: true,
    },
    // Sharing invite text template for WhatsApp / SMS
    shareTextTemplate: {
      type: String,
      default: 'Join me on GharMB to find and list verified properties! Use my referral code *{CODE}* to get an exclusive offer upon signup: {LINK}',
      trim: true,
    },
    // Whether the referral program offer is currently active
    isActive: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  {
    timestamps: true,
  }
);

// Helper static method to get or initialize default singleton settings
referralSettingSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ key: 'global_referral_config' });
  if (!settings) {
    settings = await this.create({
      key: 'global_referral_config',
      offerMessage: 'Congratulations! You got an offer with this referral.',
      offerDescription: 'Congratulations! You unlocked an exclusive offer with this referral.',
      isActive: true,
    });
  }
  return settings;
};

module.exports = mongoose.model('ReferralSetting', referralSettingSchema);
