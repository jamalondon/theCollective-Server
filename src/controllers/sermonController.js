const supabase = require('../supabase');
const AppError = require('../utils/AppError');
const uuidRegex =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

exports.createSermon = async (req, res) => {
	try {
		// validate optional sermonSeries UUID to avoid DB errors
		if (req.body.sermonSeries && !uuidRegex.test(req.body.sermonSeries)) {
			throw new AppError('Invalid sermonSeries id format', 400);
		}

		const payload = {
			title: req.body.title,
			sermon_series_id: req.body.sermonSeries || null,
			speakers: req.body.speakers || [],
			summary: req.body.summary || null,
			key_points: req.body.keyPoints || [],
			verses: req.body.verses || [],
		};

		const { data: sermon, error } = await supabase
			.from('sermons')
			.insert([payload])
			.select()
			.single();

		if (error) throw error;

		res.status(201).json({ status: 'success', data: sermon });
	} catch (err) {
		res
			.status(err.statusCode || 400)
			.json({ status: 'error', message: err.message });
	}
};

exports.getSermons = async (req, res) => {
	try {
		let query = supabase.from('sermons').select(`
	      *,
	      sermon_series:sermon_series (id, title)
	    `);

		if (req.query.sermonSeries) {
			query = query.eq('sermon_series_id', req.query.sermonSeries);
		}

		if (req.query.title) {
			query = query.ilike('title', `%${req.query.title}%`);
		}

		const { data: sermons, error } = await query.order('created_at', {
			ascending: false,
		});
		if (error) throw error;

		res.json({ status: 'success', results: sermons.length, data: sermons });
	} catch (err) {
		res.status(500).json({ status: 'error', message: err.message });
	}
};

exports.getSermon = async (req, res) => {
	try {
		const { data: sermon, error } = await supabase
			.from('sermons')
			.select(`*, sermon_series:sermon_series (id, title)`)
			.eq('id', req.params.sermonId)
			.single();

		if (error || !sermon) throw new AppError('Sermon not found', 404);

		res.json({ status: 'success', data: sermon });
	} catch (err) {
		res
			.status(err.statusCode || 500)
			.json({ status: 'error', message: err.message });
	}
};

exports.updateSermon = async (req, res) => {
	try {
		// Ensure sermon exists
		const { data: existing, error: checkError } = await supabase
			.from('sermons')
			.select('id')
			.eq('id', req.params.sermonId)
			.single();

		if (checkError || !existing) throw new AppError('Sermon not found', 404);

		// validate optional sermonSeries UUID to avoid DB errors
		if (req.body.sermonSeries && !uuidRegex.test(req.body.sermonSeries)) {
			throw new AppError('Invalid sermonSeries id format', 400);
		}

		const updateData = {
			title: req.body.title,
			sermon_series_id: req.body.sermonSeries,
			speakers: req.body.speakers,
			summary: req.body.summary,
			key_points: req.body.keyPoints,
			verses: req.body.verses,
		};

		Object.keys(updateData).forEach(
			(k) => updateData[k] === undefined && delete updateData[k],
		);

		const { data: sermon, error } = await supabase
			.from('sermons')
			.update(updateData)
			.eq('id', req.params.sermonId)
			.select()
			.single();

		if (error) throw error;

		res.json({ status: 'success', data: sermon });
	} catch (err) {
		res
			.status(err.statusCode || 500)
			.json({ status: 'error', message: err.message });
	}
};

exports.deleteSermon = async (req, res) => {
	try {
		const { data: existing, error: checkError } = await supabase
			.from('sermons')
			.select('id')
			.eq('id', req.params.sermonId)
			.single();

		if (checkError || !existing) throw new AppError('Sermon not found', 404);

		const { error } = await supabase
			.from('sermons')
			.delete()
			.eq('id', req.params.sermonId);
		if (error) throw error;

		res.json({ status: 'success', data: null });
	} catch (err) {
		res
			.status(err.statusCode || 500)
			.json({ status: 'error', message: err.message });
	}
};
