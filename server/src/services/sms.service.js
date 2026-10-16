/**
 * SMSGatewayHub DLT SMS Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Provider  : SMSGatewayHub (smsc.co.in / smsgatewayhub.com)
 * Operator  : Smartping (Videocon DLT)
 * DLT Route : Promotional (Channel 1)
 * Header    : GHARMB
 * ─────────────────────────────────────────────────────────────────────────────
 */

const BASE_URL = 'https://www.smsgatewayhub.com/api/mt/SendSMS';
const BALANCE_URL = 'https://www.smsgatewayhub.com/api/mt/GetBalance';

/**
 * Format Indian phone number for SMSGatewayHub
 * Accepts: +919876543210, 9876543210, 919876543210 -> Returns: 919876543210
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) {
    return '91' + digits;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  return digits;
};

/**
 * Send DLT-approved OTP verification SMS via SMSGatewayHub
 *
 * Approved DLT Template (Smartping / SMSGatewayHub):
 * "Welcome to GHARMB ! Your verification code is {#var#}. Enter this OTP to continue. Valid for 10 minutes. Do not share it."
 *
 * @param {string} phone - Recipient mobile number
 * @param {string} otp   - 6-digit OTP
 * @returns {Promise<{ success: boolean, jobId?: string, messageId?: string, error?: string }>}
 */
const sendOtpSms = async (phone, otp) => {
  const formattedPhone = formatPhoneNumber(phone);
  if (!formattedPhone || formattedPhone.length < 12) {
    console.error(`❌ [SMSGatewayHub] Invalid recipient phone number: ${phone}`);
    return { success: false, error: 'Invalid phone number format' };
  }

  const apiKey = process.env.SMS_API_KEY || 'mcr68gGHIk692jTyTJS61w';
  const senderId = process.env.SMS_SENDER_ID || 'GHARMB';
  const entityId = process.env.SMS_ENTITY_ID || '1701179206232722030';
  const templateId = process.env.SMS_TEMPLATE_ID || '1777179214721052210';
  const channel = process.env.SMS_CHANNEL || '1'; // 1 = Promotional (mapped to approved template type)

  // EXACT approved template wording — punctuation and spaces are strictly matched by telecom scrubbers
  const messageText = `Welcome to GHARMB ! Your verification code is ${otp}. Enter this OTP to continue. Valid for 10 minutes. Do not share it.`;

  try {
    const url = new URL(BASE_URL);
    url.searchParams.set('APIKey', apiKey);
    url.searchParams.set('senderid', senderId);
    url.searchParams.set('channel', channel);
    url.searchParams.set('DCS', '0');
    url.searchParams.set('flashsms', '0');
    url.searchParams.set('number', formattedPhone);
    url.searchParams.set('text', messageText);
    url.searchParams.set('EntityId', entityId);
    url.searchParams.set('dlttemplateid', templateId);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json();

    if (data.ErrorCode === '000' || data.ErrorMessage === 'Success') {
      const messageId = data.MessageData?.[0]?.MessageId || null;
      console.log(`\n==================================================`);
      console.log(`✉️ [SMS SENT SUCCESSFULLY — SMSGATEWAYHUB]`);
      console.log(`   To       : ${formattedPhone}`);
      console.log(`   JobId    : ${data.JobId || 'N/A'}`);
      console.log(`   MessageId: ${messageId || 'N/A'}`);
      console.log(`==================================================\n`);

      return {
        success: true,
        jobId: data.JobId,
        messageId,
        data,
      };
    } else {
      console.warn(`\n⚠️ [SMSGatewayHub Error] Code: ${data.ErrorCode}, Message: ${data.ErrorMessage}`);
      return {
        success: false,
        errorCode: data.ErrorCode,
        error: data.ErrorMessage || 'Failed to dispatch SMS',
      };
    }
  } catch (err) {
    console.error('❌ [SMSGatewayHub Request Error]:', err.message);
    return {
      success: false,
      error: err.message,
    };
  }
};

/**
 * Check credit balance from SMSGatewayHub
 * @returns {Promise<{ success: boolean, balance?: string, error?: string }>}
 */
const checkSmsBalance = async () => {
  const apiKey = process.env.SMS_API_KEY || 'mcr68gGHIk692jTyTJS61w';
  try {
    const url = `${BALANCE_URL}?APIKey=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url);
    const data = await response.json();
    return {
      success: data.ErrorCode === '0',
      balance: data.Balance,
      data,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  }
};

module.exports = {
  sendOtpSms,
  checkSmsBalance,
  formatPhoneNumber,
};
