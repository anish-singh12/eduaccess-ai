/**
 * Higher-order middleware to validate incoming request bodies against a Zod schema
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }));

      const firstIssue = issues[0];
      let friendlyMessage = 'Invalid request data';
      if (firstIssue) {
        if (firstIssue.message === 'Required') {
          friendlyMessage = `Field "${firstIssue.field || 'input'}" is required`;
        } else if (firstIssue.field && !firstIssue.message.toLowerCase().includes(firstIssue.field.toLowerCase())) {
          friendlyMessage = `${firstIssue.field}: ${firstIssue.message}`;
        } else {
          friendlyMessage = firstIssue.message;
        }
      }

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: friendlyMessage,
          details: issues
        }
      });
    }

    // Replace request body with validated and parsed data (coerced types, stripped unexpected keys)
    req.body = result.data;
    next();
  };
}
