const supabase = require('../supabase');
const AppError = require('../utils/AppError');

exports.createSeries = async (req, res) => {
	try {
		const { data: series, error } = await supabase
			.from('sermon_series')
			.insert([
				{
					...req.body,
					created_by: req.user.id,
					start_date: new Date(req.body.startDate).toISOString(),
					end_date: new Date(req.body.endDate).toISOString(),
					number_of_weeks: req.body.numberOfWeeks,
					cover_image: {
						url: req.body.coverImage.url,
						public_id: req.body.coverImage.publicId,
					},
				},
			])
			.select()
			.single();

		if (error) throw error;

		res.status(201).json({
			status: 'success',
			data: series,
		});
	} catch (err) {
		res.status(400).json({
			status: 'error',
			message: err.message,
		});
	}
};

exports.getAllSeries = async (req, res) => {
	try {
		let query = supabase.from('sermon_series').select(`
				*,
				created_by:users (name, email)
			`);

		// Add search functionality
		if (req.query.search) {
			query = query.or(
				`title.ilike.%${req.query.search}%,description.ilike.%${req.query.search}%`
			);
		}

		// Add date range filter
		if (req.query.startDate) {
			query = query.gte(
				'start_date',
				new Date(req.query.startDate).toISOString()
			);
		}
		if (req.query.endDate) {
			query = query.lte('end_date', new Date(req.query.endDate).toISOString());
		}

		// Add status filter
		if (req.query.status) {
			query = query.eq('status', req.query.status);
		}

		// Execute query and order by start_date
		const { data: series, error } = await query.order('start_date', {
			ascending: false,
		});

		if (error) throw error;

		res.json({
			status: 'success',
			results: series.length,
			data: series,
		});
	} catch (err) {
		res.status(500).json({
			status: 'error',
			message: err.message,
		});
	}
};

exports.getSeries = async (req, res) => {
	try {
		const { data: series, error } = await supabase
			.from('sermon_series')
			.select(
				`
				*,
				created_by:users (name, email)
			`
			)
			.eq('id', req.params.seriesId)
			.single();

		if (error) throw error;
		if (!series) {
			throw new AppError('Sermon series not found', 404);
		}

		res.json({
			status: 'success',
			data: series,
		});
	} catch (err) {
		res.status(err.statusCode || 500).json({
			status: 'error',
			message: err.message,
		});
	}
};

exports.updateSeries = async (req, res) => {
	try {
		// First check if series exists and user is authorized
		const { data: existingSeries, error: checkError } = await supabase
			.from('sermon_series')
			.select('created_by')
			.eq('id', req.params.seriesId)
			.single();

		if (checkError || !existingSeries) {
			throw new AppError('Sermon series not found', 404);
		}

		if (existingSeries.created_by !== req.user.id) {
			throw new AppError('You are not authorized to update this series', 403);
		}

		// Prepare update data
		const updateData = {
			...req.body,
			start_date: req.body.startDate
				? new Date(req.body.startDate).toISOString()
				: undefined,
			end_date: req.body.endDate
				? new Date(req.body.endDate).toISOString()
				: undefined,
			number_of_weeks: req.body.numberOfWeeks,
			cover_image: req.body.coverImage
				? {
						url: req.body.coverImage.url,
						public_id: req.body.coverImage.publicId,
				  }
				: undefined,
		};

		// Remove undefined values
		Object.keys(updateData).forEach(
			(key) => updateData[key] === undefined && delete updateData[key]
		);

		const { data: series, error } = await supabase
			.from('sermon_series')
			.update(updateData)
			.eq('id', req.params.seriesId)
			.select()
			.single();

		if (error) throw error;

		res.json({
			status: 'success',
			data: series,
		});
	} catch (err) {
		res.status(err.statusCode || 500).json({
			status: 'error',
			message: err.message,
		});
	}
};

exports.deleteSeries = async (req, res) => {
	try {
		// First check if series exists and user is authorized
		const { data: existingSeries, error: checkError } = await supabase
			.from('sermon_series')
			.select('created_by')
			.eq('id', req.params.seriesId)
			.single();

		if (checkError || !existingSeries) {
			throw new AppError('Sermon series not found', 404);
		}

		if (existingSeries.created_by !== req.user.id) {
			throw new AppError('You are not authorized to delete this series', 403);
		}

		const { error } = await supabase
			.from('sermon_series')
			.delete()
			.eq('id', req.params.seriesId);

		if (error) throw error;

		res.json({
			status: 'success',
			data: null,
		});
	} catch (err) {
		res.status(err.statusCode || 500).json({
			status: 'error',
			message: err.message,
		});
	}
};
