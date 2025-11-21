const axios = require('axios');

// Debug: Check if environment variable is loaded
console.log('🔍 LOCAL_LM_API_URL:', process.env.LOCAL_LM_API_URL);
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);

const localLMAPI = axios.create({
	baseURL: process.env.LOCAL_LM_API_URL,
	timeout: 30000, // 30 second timeout for LLM inference
});

console.log('✅ LocalLMAPI baseURL set to:', localLMAPI.defaults.baseURL);

module.exports = localLMAPI;
