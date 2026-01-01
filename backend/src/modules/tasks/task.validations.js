const Joi = require('joi');

const taskValidation = {
  createTask: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(500).optional().allow(''),
    frequency: Joi.string().valid('DAILY', 'WEEKLY', 'MONTHLY', 'AS_PER_REQUIREMENT').default('DAILY'),
    deadlineDay: Joi.number().min(1).max(31).optional(),
    timeline: Joi.string().max(100).optional().allow(''),
    assigneeId: Joi.number().required(),
    notes: Joi.string().max(1000).optional().allow('')
  }),

  updateTask: Joi.object({
    title: Joi.string().min(3).max(200),
    description: Joi.string().max(500).allow(''),
    frequency: Joi.string().valid('DAILY', 'WEEKLY', 'MONTHLY', 'AS_PER_REQUIREMENT'),
    deadlineDay: Joi.number().min(1).max(31),
    timeline: Joi.string().max(100).allow(''),
    assigneeId: Joi.number(),
    status: Joi.string().valid('PENDING', 'COMPLETED', 'OVERDUE'),
    notes: Joi.string().max(1000).allow('')
  }).min(1),

  markComplete: Joi.object({
    notes: Joi.string().max(1000).optional().allow('')
  }),

  getTasks: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20),
    search: Joi.string().optional().allow(''),
    status: Joi.string().valid('PENDING', 'COMPLETED', 'OVERDUE', '').optional(),
    frequency: Joi.string().valid('DAILY', 'WEEKLY', 'MONTHLY', 'AS_PER_REQUIREMENT', '').optional(),
    assigneeId: Joi.string().optional().allow('')
  })
};

module.exports = taskValidation;