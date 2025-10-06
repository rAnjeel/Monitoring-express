import Joi from 'joi';

const typeDeviceSchema = Joi.object({
  name: Joi.string().max(100).required(),
});

function validateTypeDevice(req, res, next) {
  const { error } = typeDeviceSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      message: 'Validation error',
      details: error.details.map(d => d.message)
    });
  }
  next();
}

export default validateTypeDevice;
