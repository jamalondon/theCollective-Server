const twilio = require('twilio');

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

if (!accountSid || !authToken || !verifyServiceSid) {
    console.error('Missing Twilio environment variables. Please check your .env file.');
}

const client = twilio(accountSid, authToken);

/**
 * Start verification process by sending SMS to phone number
 * @param {string} phoneNumber - Phone number in E.164 format (e.g., +1234567890)
 * @returns {Promise<Object>} - Twilio verification response
 */
const startVerification = async (phoneNumber) => {
    try {
        const verification = await client.verify.v2
            .services(verifyServiceSid)
            .verifications.create({
                to: phoneNumber,
                channel: 'sms'
            });
        
        return {
            success: true,
            status: verification.status,
            sid: verification.sid
        };
    } catch (error) {
        console.error('Twilio verification start error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Check verification code
 * @param {string} phoneNumber - Phone number in E.164 format
 * @param {string} code - Verification code entered by user
 * @returns {Promise<Object>} - Verification check result
 */
const checkVerification = async (phoneNumber, code) => {
    try {
        const verificationCheck = await client.verify.v2
            .services(verifyServiceSid)
            .verificationChecks.create({
                to: phoneNumber,
                code: code
            });
        
        return {
            success: true,
            status: verificationCheck.status,
            valid: verificationCheck.status === 'approved'
        };
    } catch (error) {
        console.error('Twilio verification check error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    startVerification,
    checkVerification
};
