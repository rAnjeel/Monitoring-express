import Joi from 'joi';

const locationSchema = Joi.object({
  name: Joi.string().max(255).required(),
  lat: Joi.number().precision(6).optional(),
  lng: Joi.number().precision(6).optional(),
});

function validateLocation(req, res, next) {
  const { error } = locationSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      message: 'Validation error',
      details: error.details.map(d => d.message)
    });
  }
  next();
}

export default validateLocation;
