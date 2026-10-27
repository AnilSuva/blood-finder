import { Schema, model, type InferSchemaType } from 'mongoose';
const citySchema = new Schema({
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
}, { versionKey: false });
citySchema.index({ name: 1, state: 1 });
export type City = InferSchemaType<typeof citySchema>;
export const CityModel = model('City', citySchema);
