const supabase = require('../supabase');

exports.createPrayerRequest = async (req, res) => {
	try {
		const user = req.user; // from requireAuth middleware
		const { body } = req;
		console.log(body);
		// Extract and validate text from body
		let { text, anonymous } = body;
		if (typeof text === 'string') {
			text = text.trim();
		}
		if (!text) {
			return res
				.status(400)
				.json({ error: 'Prayer request text is required.' });
		}

		// Parse anonymous flag (default to false if not provided)
		const isAnonymous = anonymous === 'true' || anonymous === true || false;

	// Upload photos to Supabase Storage
	let photoUrls = [];
	const files = req.files;
	
	// Only process files if they exist and are in an array with items
	if (files && Array.isArray(files) && files.length > 0) {
		console.log(`Uploading ${files.length} files to Supabase...`);
		for (const file of files) {
			const filePath = `prayer-requests/${user.id}/${Date.now()}_${
				file.originalname
			}`;
			console.log(`Uploading file to path: ${filePath}`);
			console.log(`File size: ${file.size} bytes, mimetype: ${file.mimetype}`);
			
			const { data, error } = await supabase.storage
				.from('prayer-media')
				.upload(filePath, file.buffer, {
					contentType: file.mimetype,
					upsert: false,
				});
			
			if (error) {
				console.error('Supabase storage upload error:', error);
				throw error;
			}
			
			console.log('Upload successful, data:', data);
			const { data: urlData } = supabase.storage
				.from('prayer-media')
				.getPublicUrl(filePath);
			const publicUrl = urlData.publicUrl;
			console.log('Public URL:', publicUrl);
			photoUrls.push(publicUrl);
		}
	}

		const title = req.body.title
			? req.body.title.trim()
			: 'Pray for ' + user.full_name;

		// Prepare prayer request object
		const prayerRequest = {
			owner: {
				id: user.id,
				name: user.full_name,
				profile_picture: user.profile_picture,
			},
			comments: [],
			photos: photoUrls,
			text,
			title,
			anonymous: isAnonymous,
		};

		// Insert into Supabase
		const { data, error } = await supabase
			.from('prayer_requests')
			.insert([prayerRequest])
			.select();

		if (error) throw error;

		res.status(201).json({ prayerRequest: data[0] });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
};

exports.getPrayerRequests = async (req, res) => {
	try {
		const { data, error } = await supabase
			.from('prayer_requests')
			.select('*')
			.order('created_at', { ascending: false });

		if (error) throw error;

		res.status(200).json({
			total: data ? data.length : 0,
			prayerRequests: data,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
};

exports.deletePrayerRequest = async (req, res) => {
	try {
		const user = req.user; // from requireAuth middleware
		const { id } = req.params;

		// Fetch the prayer request to check ownership
		const { data: prayerRequest, error: fetchError } = await supabase
			.from('prayer_requests')
			.select('owner')
			.eq('id', id)
			.single();

		if (fetchError || !prayerRequest) {
			return res.status(404).json({ error: `Prayer request not found` });
		}

		if (prayerRequest.owner.id !== user.id) {
			return res
				.status(403)
				.json({ error: 'You can only delete your own prayer requests' });
		}

		const { error: deleteError } = await supabase
			.from('prayer_requests')
			.delete()
			.eq('id', id);

		if (deleteError) throw deleteError;

		res.status(200).json({ message: 'Prayer request deleted successfully' });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
};
