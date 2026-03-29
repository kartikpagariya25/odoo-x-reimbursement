const validate = (validator) => (req, res, next) => {
	try {
		const { valid, errors } = validator(req);

		if (!valid) {
			return res.status(400).json({ error: errors.join(", ") });
		}

		return next();
	} catch (error) {
		return res.status(500).json({ error: "Validation middleware failed" });
	}
};

module.exports = { validate };
