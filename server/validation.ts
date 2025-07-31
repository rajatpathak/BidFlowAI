import { z } from 'zod';

// Authentication schemas
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Full name is required'),
  role: z.string().default('bidder'),
});

// Tender schemas
export const createTenderSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  organization: z.string().min(1, 'Organization is required'),
  value: z.number().min(0, 'Value must be positive'),
  deadline: z.string().datetime('Invalid deadline format'),
  location: z.string().optional(),
  description: z.string().optional(),
  requirements: z.array(z.any()).default([]),
  source: z.enum(['gem', 'non_gem', 'portal']).default('non_gem'),
});

export const updateTenderSchema = createTenderSchema.partial();

export const assignTenderSchema = z.object({
  assignedTo: z.string().min(1, 'Assignee is required'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  budget: z.number().min(0).optional(),
  notes: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

// Document schemas
export const uploadDocumentsSchema = z.object({
  type: z.enum(['rfp_document', 'bid_document', 'supporting_document']).default('rfp_document'),
});

// Finance request schemas
export const createFinanceRequestSchema = z.object({
  tenderId: z.string().uuid('Invalid tender ID'),
  type: z.enum(['emd', 'pbg', 'document_fee', 'other']),
  amount: z.number().min(0, 'Amount must be positive'),
  description: z.string().optional(),
  expiryDate: z.string().datetime().optional(),
});

// Meeting schemas
export const createMeetingSchema = z.object({
  tenderId: z.string().uuid('Invalid tender ID'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  meetingDate: z.string().datetime('Invalid meeting date'),
  meetingLink: z.string().url().optional(),
  attendees: z.array(z.string()).default([]),
});

// Validation middleware
export function validateRequest(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    try {
      const validatedData = schema.parse(req.body);
      req.validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: 'Validation error',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      } else {
        res.status(400).json({ message: 'Invalid request data' });
      }
    }
  };
}

// Query parameter validation
export function validateQuery(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    try {
      const validatedQuery = schema.parse(req.query);
      req.validatedQuery = validatedQuery;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: 'Invalid query parameters',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      } else {
        res.status(400).json({ message: 'Invalid query parameters' });
      }
    }
  };
}