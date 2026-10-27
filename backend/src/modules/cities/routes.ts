import { Router } from 'express';
import { CityModel } from './model.js';
import { validate } from '../../middleware/validate.js';
import { citiesQuerySchema } from './schema.js';
export const citiesRouter = Router();
citiesRouter.get('/cities', validate(citiesQuerySchema, 'query'), async (req, res, next) => {
  try {
    const q = req.query.q as string;
    const search = q ? new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : undefined;
    const filter = search ? { $or: [{ name: search }, { state: search }, { slug: search }] } : {};
    const cities = await CityModel.find(filter).sort({ name: 1 }).limit(100).lean();
    res.json({ cities });
  } catch (error) { next(error); }
});
