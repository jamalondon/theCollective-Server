const supabase = require('../supabase');
const AppError = require('../utils/AppError');

exports.createDiscussion = async (req, res) => {
	try {
		const { data: discussion, error } = await supabase
			.from('sermon_discussions')
			.insert([
				{
					...req.body,
					created_by: req.user.id,
					sermon_series_id: req.body.sermonSeries,
					sermon_id: req.body.sermonId || null,
					week_number: req.body.weekNumber,
					discussion_date: new Date().toISOString(),
					scripture_references: req.body.scriptureReferences || [],
					discussion_questions: req.body.discussionQuestions || [],
				},
			])
			.select(
				`
				*,
				created_by:users (name, username, email),
				sermon_series:sermon_series (title)
			`,
			)
			.single();

		if (error) throw error;

		res.status(201).json({
			status: 'success',
			data: discussion,
		});
	} catch (err) {
		res.status(400).json({
			status: 'error',
			message: err.message,
		});
	}
};

exports.getDiscussions = async (req, res) => {
	try {
		let query = supabase.from('sermon_discussions').select(`
				*,
				created_by:users (name, username, email),
				sermon_series:sermon_series (title),
				sermon:sermons (id, title, speakers, summary),
				comments:sermon_discussion_comments (
					id,
					content,
					created_at,
					created_by:users (name, email)
				)
			`);

		if (req.query.sermonSeries) {
			query = query.eq('sermon_series_id', req.query.sermonSeries);
		}

		if (req.query.sermonId) {
			query = query.eq('sermon_id', req.query.sermonId);
		}

		if (req.query.weekNumber) {
			query = query.eq('week_number', parseInt(req.query.weekNumber));
		}

		if (req.query.status) {
			query = query.eq('status', req.query.status);
		}

		const { data: discussions, error } = await query.order('created_at', {
			ascending: false,
		});

		if (error) throw error;

		res.json({
			status: 'success',
			results: discussions.length,
			data: discussions,
		});
	} catch (err) {
		res.status(500).json({
			status: 'error',
			message: err.message,
		});
	}
};

exports.getDiscussion = async (req, res) => {
	try {
		const { data: discussion, error } = await supabase
			.from('sermon_discussions')
			.select(
				`
				*,
				created_by:users (name, username, email),
				sermon_series:sermon_series (title),
				sermon:sermons (id, title, speakers, summary),
				comments:sermon_discussion_comments (
					id,
					content,
					created_at,
					created_by:users (name, email)
				)
			`,
			)
			.eq('id', req.params.discussionId)
			.single();

		if (error) throw error;
		if (!discussion) {
			throw new AppError('Discussion not found', 404);
		}

		res.json({
			status: 'success',
			data: discussion,
		});
	} catch (err) {
		res.status(err.statusCode || 500).json({
			status: 'error',
			message: err.message,
		});
	}
};

exports.updateDiscussion = async (req, res) => {
	try {
		// First check if discussion exists and user is authorized
		const { data: existingDiscussion, error: checkError } = await supabase
			.from('sermon_discussions')
			.select('created_by')
			.eq('id', req.params.discussionId)
			.single();

		if (checkError || !existingDiscussion) {
			throw new AppError('Discussion not found', 404);
		}

		if (existingDiscussion.created_by !== req.user.id) {
			throw new AppError('You can only edit your own discussions', 403);
		}

		// Prepare update data
		const updateData = {
			...req.body,
			sermon_series_id: req.body.sermonSeries,
			sermon_id: req.body.sermonId,
			week_number: req.body.weekNumber,
			scripture_references: req.body.scriptureReferences,
			discussion_questions: req.body.discussionQuestions,
		};

		// Remove undefined values
		Object.keys(updateData).forEach(
			(key) => updateData[key] === undefined && delete updateData[key],
		);

		const { data: discussion, error } = await supabase
			.from('sermon_discussions')
			.update(updateData)
			.eq('id', req.params.discussionId)
			.select(
				`
				*,
				created_by:users (name, username, email),
				sermon_series:sermon_series (title)
			`,
			)
			.single();

		if (error) throw error;

		res.json({
			status: 'success',
			data: discussion,
		});
	} catch (err) {
		res.status(err.statusCode || 500).json({
			status: 'error',
			message: err.message,
		});
	}
};

exports.deleteDiscussion = async (req, res) => {
	try {
		// First check if discussion exists and user is authorized
		const { data: existingDiscussion, error: checkError } = await supabase
			.from('sermon_discussions')
			.select('created_by')
			.eq('id', req.params.discussionId)
			.single();

		if (checkError || !existingDiscussion) {
			throw new AppError('Discussion not found', 404);
		}

		if (existingDiscussion.created_by !== req.user.id) {
			throw new AppError('You can only delete your own discussions', 403);
		}

		const { error } = await supabase
			.from('sermon_discussions')
			.delete()
			.eq('id', req.params.discussionId);

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

exports.addComment = async (req, res) => {
	try {
		// First verify the discussion exists
		const { data: discussion, error: discussionError } = await supabase
			.from('sermon_discussions')
			.select('id')
			.eq('id', req.params.discussionId)
			.single();

		if (discussionError || !discussion) {
			throw new AppError('Discussion not found', 404);
		}

		// Add the comment
		const { data: comment, error } = await supabase
			.from('sermon_discussion_comments')
			.insert([
				{
					discussion_id: req.params.discussionId,
					content: req.body.content,
					created_by: req.user.id,
				},
			])
			.select(
				`
				*,
				created_by:users (name, email)
			`,
			)
			.single();

		if (error) throw error;

		res.status(201).json({
			status: 'success',
			data: comment,
		});
	} catch (err) {
		res.status(err.statusCode || 500).json({
			status: 'error',
			message: err.message,
		});
	}
};

exports.updateComment = async (req, res) => {
	try {
		// First check if comment exists and user is authorized
		const { data: existingComment, error: checkError } = await supabase
			.from('sermon_discussion_comments')
			.select('created_by')
			.eq('id', req.params.commentId)
			.eq('discussion_id', req.params.discussionId)
			.single();

		if (checkError || !existingComment) {
			throw new AppError('Comment not found', 404);
		}

		if (existingComment.created_by !== req.user.id) {
			throw new AppError('You can only edit your own comments', 403);
		}

		const { data: comment, error } = await supabase
			.from('sermon_discussion_comments')
			.update({ content: req.body.content })
			.eq('id', req.params.commentId)
			.select(
				`
				*,
				created_by:users (name, email)
			`,
			)
			.single();

		if (error) throw error;

		res.json({
			status: 'success',
			data: comment,
		});
	} catch (err) {
		res.status(err.statusCode || 500).json({
			status: 'error',
			message: err.message,
		});
	}
};

exports.deleteComment = async (req, res) => {
	try {
		// First check if comment exists and user is authorized
		const { data: existingComment, error: checkError } = await supabase
			.from('sermon_discussion_comments')
			.select('created_by')
			.eq('id', req.params.commentId)
			.eq('discussion_id', req.params.discussionId)
			.single();

		if (checkError || !existingComment) {
			throw new AppError('Comment not found', 404);
		}

		if (existingComment.created_by !== req.user.id) {
			throw new AppError('You can only delete your own comments', 403);
		}

		const { error } = await supabase
			.from('sermon_discussion_comments')
			.delete()
			.eq('id', req.params.commentId);

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
