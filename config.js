const config = {
	development: {
		mongoURI:
			'mongodb+srv://jamalondon97:X8WlauEJbBhQT4Oe@development.hdlmszt.mongodb.net/Data?retryWrites=true&w=majority&appName=Development',
	},
	production: {
		mongoURI:
			'mongodb+srv://jamalondon97:X8WlauEJbBhQT4Oe@development.hdlmszt.mongodb.net/Data?retryWrites=true&w=majority&appName=Production',
	},
};

// Use environment variables to determine which connection to use
const environment = process.env.NODE_ENV || 'development';
module.exports = config[environment];
