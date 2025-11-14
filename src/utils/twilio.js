const twilio = require('twilio');

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

console.log('=== TWILIO CONFIG CHECK ===');
console.log(
	'TWILIO_ACCOUNT_SID:',
	accountSid ? `${accountSid.substring(0, 10)}...` : 'MISSING'
);
console.log(
	'TWILIO_AUTH_TOKEN:',
	authToken ? `${authToken.substring(0, 10)}...` : 'MISSING'
);
console.log(
	'TWILIO_VERIFY_SERVICE_SID:',
	verifyServiceSid ? `${verifyServiceSid.substring(0, 10)}...` : 'MISSING'
);

if (!accountSid || !authToken || !verifyServiceSid) {
	console.error(
		'❌ Missing Twilio environment variables. Please check your .env file.'
	);
	console.error(
		'Required variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID'
	);
}

let client;
try {
	client = twilio(accountSid, authToken);
	console.log('✅ Twilio client initialized successfully');
} catch (error) {
	console.error('❌ Failed to initialize Twilio client:', error.message);
}

/**
 * Start verification process by sending SMS to phone number
 * Phone number in E.164 format (e.g., +1234567890)
 */
const startVerification = async (phoneNumber) => {
	console.log('=== TWILIO START VERIFICATION ===');
	console.log('Phone number to verify:', phoneNumber);
	console.log('Verify Service SID:', verifyServiceSid);

	try {
		// Check if client is initialized
		if (!client) {
			console.error('❌ Twilio client not initialized');
			return {
				success: false,
				error: 'Twilio client not initialized. Check environment variables.',
			};
		}

		// Check if all required parameters are present
		if (!verifyServiceSid) {
			console.error('❌ Missing TWILIO_VERIFY_SERVICE_SID');
			return {
				success: false,
				error: 'Missing Twilio Verify Service SID',
			};
		}

		console.log('Creating verification request...');
		const verification = await client.verify.v2
			.services(verifyServiceSid)
			.verifications.create({
				to: phoneNumber,
				channel: 'sms',
			});

		console.log('✅ Verification created successfully:', {
			status: verification.status,
			sid: verification.sid,
			to: verification.to,
		});

		return {
			success: true,
			status: verification.status,
			sid: verification.sid,
		};
	} catch (error) {
		console.error('❌ Twilio verification start error:', {
			message: error.message,
			code: error.code,
			status: error.status,
			details: error.details,
		});
		return {
			success: false,
			error: error.message,
			code: error.code,
			details: error.details,
		};
	}
};

/**
 * Check verification code
 * Phone number in E.164 format
 *  Verification code entered by user
 */
const checkVerification = async (phoneNumber, code) => {
	try {
		const verificationCheck = await client.verify.v2
			.services(verifyServiceSid)
			.verificationChecks.create({
				to: phoneNumber,
				code: code,
			});

		return {
			success: true,
			status: verificationCheck.status,
			valid: verificationCheck.status === 'approved',
		};
	} catch (error) {
		console.error('Twilio verification check error:', error.message);
		return {
			success: false,
			error: error.message,
		};
	}
};

module.exports = {
	startVerification,
	checkVerification,
};
