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

		// check user role
		const { data: userRow, error: userErr } = await supabase
			.from('users')
			.select('role')
			.eq('id', req.user.id)
			.single();
		if (userErr || !userRow) throw new AppError('User not found', 403);
		if (!['developer', 'leader'].includes(userRow.role)) {
			throw new AppError('You are not authorized to create sermons', 403);
		}

		const payload = {
			title: req.body.title,
			sermon_series_id: req.body.sermonSeries || null,
			speakers: req.body.speakers || [],
			summary: req.body.summary || null,
			key_points: req.body.keyPoints || [],
			verses: req.body.verses || [],
			created_by: req.user.id,
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
		  sermon_series:sermon_series (id, title),
		  created_by:users (id, full_name, username, email)
		`);

		const sermonSeriesFilter =
			req.query.sermonSeries ||
			req.query.sermonSeriesId ||
			req.query['series-id'] ||
			req.query.seriesId;

		if (sermonSeriesFilter) {
			if (!uuidRegex.test(sermonSeriesFilter)) {
				return res.json({ status: 'success', results: 0, data: [] });
			}
			query = query.eq('sermon_series_id', sermonSeriesFilter);
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
			.select(`*, sermon_series:sermon_series (id, title), created_by:users (id, full_name, username, email)`)
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
		// validate optional sermonSeries UUID to avoid DB errors
		if (req.body.sermonSeries && !uuidRegex.test(req.body.sermonSeries)) {
			throw new AppError('Invalid sermonSeries id format', 400);
		}

		// check user role and ownership: developers can update any sermon; leaders only their own
		const { data: userRow, error: userErr } = await supabase
			.from('users')
			.select('role')
			.eq('id', req.user.id)
			.single();
		if (userErr || !userRow) throw new AppError('User not found', 403);
		if (!['developer', 'leader'].includes(userRow.role)) {
			throw new AppError('You are not authorized to update sermons', 403);
		}

		// fetch existing sermon to check ownership
		const { data: existing, error: checkError } = await supabase
			.from('sermons')
			.select('created_by')
			.eq('id', req.params.sermonId)
			.single();

		if (checkError || !existing) throw new AppError('Sermon not found', 404);

		if (userRow.role === 'leader' && existing.created_by !== req.user.id) {
			throw new AppError('Leaders may only update sermons they created', 403);
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

		// check role and ownership rules for delete
		const { data: userRow, error: userErr } = await supabase
			.from('users')
			.select('role')
			.eq('id', req.user.id)
			.single();
		if (userErr || !userRow) throw new AppError('User not found', 403);
		if (!['developer', 'leader'].includes(userRow.role)) {
			throw new AppError('You are not authorized to delete sermons', 403);
		}
		if (userRow.role === 'leader' && existing.created_by !== req.user.id) {
			throw new AppError('Leaders may only delete sermons they created', 403);
		}

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
