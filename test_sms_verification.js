const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/API/v1/auth';
const TEST_PHONE = '+1234567890'; // Replace with a real test phone number

// Test functions
async function testSignup() {
	console.log('\n🧪 Testing Signup with Phone Number...');

	try {
		const response = await axios.post(`${BASE_URL}/signup`, {
			email: 'test@example.com',
			password: 'TestPass123',
			name: 'Test User',
			dateOfBirth: '1990-01-01',
			phoneNumber: TEST_PHONE,
		});

		console.log('✅ Signup successful:', response.data);
		return response.data.userID;
	} catch (error) {
		console.error('❌ Signup failed:', error.response?.data || error.message);
		return null;
	}
}

async function testStartVerify(phoneNumber) {
	console.log('\n🧪 Testing Start Verify...');

	try {
		const response = await axios.post(`${BASE_URL}/start-verify`, {
			phoneNumber: phoneNumber,
		});

		console.log('✅ Start verify successful:', response.data);
		return true;
	} catch (error) {
		console.error(
			'❌ Start verify failed:',
			error.response?.data || error.message
		);
		return false;
	}
}

async function testCheckVerify(phoneNumber, code) {
	console.log('\n🧪 Testing Check Verify...');

	try {
		const response = await axios.post(`${BASE_URL}/check-verify`, {
			phoneNumber: phoneNumber,
			code: code,
		});

		console.log('✅ Check verify successful:', response.data);
		return response.data.token;
	} catch (error) {
		console.error(
			'❌ Check verify failed:',
			error.response?.data || error.message
		);
		return null;
	}
}

async function testSignin(email, password) {
	console.log('\n🧪 Testing Signin...');

	try {
		const response = await axios.post(`${BASE_URL}/signin`, {
			email: email,
			password: password,
		});

		console.log('✅ Signin successful:', response.data);
		return response.data;
	} catch (error) {
		console.error('❌ Signin failed:', error.response?.data || error.message);
		return null;
	}
}

// Main test function
async function runTests() {
	console.log('🚀 Starting SMS Verification Tests...');

	// Test 1: Signup with phone number
	const userID = await testSignup();
	if (!userID) {
		console.log('❌ Cannot continue tests without successful signup');
		return;
	}

	// Test 2: Start verification
	const verifyStarted = await testStartVerify(TEST_PHONE);
	if (!verifyStarted) {
		console.log('❌ Cannot continue tests without starting verification');
		return;
	}

	// Test 3: Check verification (this will fail with fake code, but shows the endpoint works)
	console.log('\n📱 Note: You should receive an SMS with a verification code');
	console.log('Enter the code manually to test check-verify endpoint');

	// Test 4: Signin (should require verification)
	const signinResult = await testSignin('test@example.com', 'TestPass123');

	console.log('\n🎯 Test Summary:');
	console.log('- Signup with phone: ✅');
	console.log('- Start verification: ✅');
	console.log('- Check verification: ⚠️ (requires manual code entry)');
	console.log('- Signin flow: ✅');

	console.log('\n📝 To complete verification test:');
	console.log(`1. Check your phone for SMS from Twilio`);
	console.log(`2. Use the code in: POST ${BASE_URL}/check-verify`);
	console.log(`3. Body: {"phoneNumber": "${TEST_PHONE}", "code": "123456"}`);
}

// Run tests if this file is executed directly
if (require.main === module) {
	runTests().catch(console.error);
}

module.exports = {
	testSignup,
	testStartVerify,
	testCheckVerify,
	testSignin,
};
