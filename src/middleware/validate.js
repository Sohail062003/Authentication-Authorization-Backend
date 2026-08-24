
const validate = (schema, source = "body") => {
    return (req, res, next) => {

        const result = schema.safeParse(req[source]); // safeparse -> Take the request body and check it against our schema.
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten().fieldErrors
            });
        }

        req.body = result.data;
        next();
    };
};

export default validate;