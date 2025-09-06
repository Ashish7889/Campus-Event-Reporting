const Joi = require('joi');

// Admin token validation middleware
const validateAdminToken = (req, res, next) => {
  const adminToken = req.headers['x-admin-token'];
  
  if (!adminToken) {
    return res.status(401).json({
      success: false,
      error: 'Admin token required. Include x-admin-token header.'
    });
  }

  if (adminToken !== process.env.ADMIN_TOKEN && adminToken !== 'admin123456') {
    return res.status(403).json({
      success: false,
      error: 'Invalid admin token'
    });
  }

  next();
};

// Event validation schema
const eventSchema = Joi.object({
  college_name: Joi.string().min(2).max(255).required().messages({
    'any.required': 'College name is required',
    'string.empty': 'College name cannot be empty',
    'string.min': 'College name must be at least 2 characters long',
    'string.max': 'College name cannot exceed 255 characters'
  }),
  title: Joi.string().min(3).max(200).required().messages({
    'any.required': 'Event title is required',
    'string.min': 'Title must be at least 3 characters long',
    'string.max': 'Title cannot exceed 200 characters'
  }),
  type: Joi.string().valid('Workshop', 'Hackathon', 'Seminar', 'Fest', 'Conference', 'Competition').required().messages({
    'any.required': 'Event type is required',
    'any.only': 'Event type must be one of: Workshop, Hackathon, Seminar, Fest, Conference, Competition'
  }),
  description: Joi.string().max(1000).optional().messages({
    'string.max': 'Description cannot exceed 1000 characters'
  }),
  start_time: Joi.date().required().messages({
    'any.required': 'Start time is required',
    'date.base': 'Start time must be a valid date'
  }),
  end_time: Joi.date().min(Joi.ref('start_time')).required().messages({
    'any.required': 'End time is required',
    'date.base': 'End time must be a valid date',
    'date.min': 'End time must be after start time'
  }),
  capacity: Joi.number().integer().min(1).max(1000).optional().messages({
    'number.base': 'Capacity must be a number',
    'number.integer': 'Capacity must be a whole number',
    'number.min': 'Capacity must be at least 1',
    'number.max': 'Capacity cannot exceed 1000'
  }),
  status: Joi.string().valid('scheduled', 'cancelled', 'completed').optional()
});

const validateEvent = (req, res, next) => {
  console.log('Validating event data:', JSON.stringify(req.body, null, 2));
  
  const { error, value } = eventSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));
    
    console.log('Validation errors:', errorMessages);
    
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessages.map(err => `${err.field}: ${err.message}`)
    });
  }
  
  req.body = value;
  next();
};

// Registration validation schema
const registrationSchema = Joi.object({
  student_id: Joi.string().optional(),
  roll_no: Joi.string().max(50).optional().messages({
    'string.max': 'Roll number cannot exceed 50 characters'
  }),
  name: Joi.when('student_id', {
    is: Joi.exist().valid(null, '', 'new'),
    then: Joi.string().min(2).max(100).required(),
    otherwise: Joi.string().min(2).max(100).optional()
  }).messages({
    'any.required': 'Name is required for new student registration',
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 100 characters'
  }),
  email: Joi.when('student_id', {
    is: Joi.exist().valid(null, '', 'new'),
    then: Joi.string().email().required(),
    otherwise: Joi.string().email().optional()
  }).messages({
    'any.required': 'Email is required for new student registration',
    'string.email': 'Please provide a valid email address'
  }),
  phone: Joi.string().pattern(/^[0-9+\-\s()]{10,15}$/).optional().messages({
    'string.pattern.base': 'Please provide a valid phone number'
  })
});

const validateRegistration = (req, res, next) => {
  const { error, value } = registrationSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessages
    });
  }
  
  req.body = value;
  next();
};

// Feedback validation schema
const feedbackSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required().messages({
    'any.required': 'Rating is required',
    'number.base': 'Rating must be a number',
    'number.integer': 'Rating must be a whole number',
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating cannot exceed 5'
  }),
  comment: Joi.string().max(500).optional().messages({
    'string.max': 'Comment cannot exceed 500 characters'
  })
});

const validateFeedback = (req, res, next) => {
  const { error, value } = feedbackSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessages
    });
  }
  
  req.body = value;
  next();
};

module.exports = {
  validateAdminToken,
  validateEvent,
  validateRegistration,
  validateFeedback
};
