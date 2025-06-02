const supabase = require('../supabase');

exports.createPrayerRequest = async (req, res) => {
	try {
		const user = req.user; // from requireAuth middleware
		const { body, files } = req;

		// Extract and validate text from body
		let { text } = body;
		if (typeof text === 'string') {
			text = text.trim();
		}
		if (!text) {
			return res
				.status(400)
				.json({ error: 'Prayer request text is required.' });
		}

		// Upload photos to Supabase Storage
		let photoUrls = [];
		if (files && files.length > 0) {
			for (const file of files) {
				const filePath = `prayer-requests/${user.id}/${Date.now()}_${
					file.originalname
				}`;
				const { data, error } = await supabase.storage
					.from('prayer-media')
					.upload(filePath, file.buffer, {
						contentType: file.mimetype,
						upsert: false,
					});
				if (error) throw error;
				const { publicUrl } = supabase.storage
					.from('prayer-media')
					.getPublicUrl(filePath).data;
				photoUrls.push(publicUrl);
			}
		}

		const title = req.body.title
			? req.body.title.trim()
			: 'Pray for ' + user.name;

		// Prepare prayer request object
		const prayerRequest = {
			owner: {
				id: user.id,
				name: user.name,
				profile_picture: user.profile_picture,
			},
			comments: [],
			photos: photoUrls,
			text,
			title,
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
			.select('user_info')
			.eq('id', id)
			.single();

		if (fetchError || !prayerRequest) {
			return res.status(404).json({ error: 'Prayer request not found' });
		}

		if (prayerRequest.user_info.id !== user.id) {
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
