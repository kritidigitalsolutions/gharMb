/**
 * Token Setting Model
 * Stores platform-wide default token booking configurations set by administrators.
 */

const mongoose = require('mongoose');

const tokenSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      default: 'global_token_config',
    },
    // Available token amount options displayed to users (e.g., [2000, 5000])
    tokenAmounts: {
      type: [Number],
      default: [2000, 5000],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length > 0 && val.every((num) => num > 0);
        },
        message: 'At least one valid positive token amount must be specified.',
      },
    },
    // Default pre-selected token amount
    defaultTokenAmount: {
      type: Number,
      default: 2000,
    },
    minTokenAmount: {
      type: Number,
      default: 1000,
    },
    maxTokenAmount: {
      type: Number,
      default: 100000,
    },
    allowCustomAmount: {
      type: Boolean,
      default: false,
    },
    adjustmentNote: {
      type: String,
      default: 'Token amount will be adjusted in security deposit or first month\'s rent',
    },
    validityDays: {
      type: Number,
      default: 7,
    },
    escrowAutoReleaseDays: {
      type: Number,
      default: 14,
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

// Helper method to retrieve or initialize singleton settings
tokenSettingSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ key: 'global_token_config' });
  if (!settings) {
    settings = await this.create({
      key: 'global_token_config',
      tokenAmounts: [2000, 5000],
      defaultTokenAmount: 2000,
      minTokenAmount: 1000,
      maxTokenAmount: 100000,
      allowCustomAmount: false,
      adjustmentNote: 'Token amount will be adjusted in security deposit or first month\'s rent',
      validityDays: 7,
      escrowAutoReleaseDays: 14,
    });
  }
  return settings;
};

const TokenSetting = mongoose.model('TokenSetting', tokenSettingSchema);

module.exports = TokenSetting;
