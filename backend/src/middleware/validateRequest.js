const validateRequest = (schema, property = "body") => {
  return (req, res, next) => {
    if (!schema) {
      return next();
    }

    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // return all errors
      stripUnknown: true, // remove extra fields
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    req[property] = value; // sanitized data
    next();
  };
};

module.exports = { validateRequest };
