import mongoose from 'mongoose';
import { connectDatabase } from '../config/db.js';
import { CityModel } from '../modules/cities/model.js';

// Major Gujarat cities with population > 50,000 (Census data)
const cities = [
  ['ahmedabad', 'Ahmedabad', 'Gujarat'],
  ['surat', 'Surat', 'Gujarat'],
  ['vadodara', 'Vadodara (Baroda)', 'Gujarat'],
  ['rajkot', 'Rajkot', 'Gujarat'],
  ['bhavnagar', 'Bhavnagar', 'Gujarat'],
  ['jamnagar', 'Jamnagar', 'Gujarat'],
  ['junagadh', 'Junagadh', 'Gujarat'],
  ['gandhinagar', 'Gandhinagar', 'Gujarat'],
  ['anand', 'Anand', 'Gujarat'],
  ['navsari', 'Navsari', 'Gujarat'],
  ['morbi', 'Morbi', 'Gujarat'],
  ['nadiad', 'Nadiad', 'Gujarat'],
  ['surendranagar', 'Surendranagar Dudhrej', 'Gujarat'],
  ['bharuch', 'Bharuch', 'Gujarat'],
  ['porbandar', 'Porbandar', 'Gujarat'],
  ['bhuj', 'Bhuj', 'Gujarat'],
  ['godhra', 'Godhra', 'Gujarat'],
  ['gandhidham', 'Gandhidham', 'Gujarat'],
  ['vapi', 'Vapi', 'Gujarat'],
  ['veraval', 'Veraval (Somnath)', 'Gujarat'],
  ['valsad', 'Valsad', 'Gujarat'],
  ['kalol', 'Kalol', 'Gujarat'],
  ['botad', 'Botad', 'Gujarat'],
  ['patan', 'Patan', 'Gujarat'],
  ['palanpur', 'Palanpur', 'Gujarat'],
  ['dahod', 'Dahod', 'Gujarat'],
  ['jetpur', 'Jetpur', 'Gujarat'],
  ['gondal', 'Gondal', 'Gujarat'],
  ['amreli', 'Amreli', 'Gujarat'],
  ['mehsana', 'Mehsana', 'Gujarat'],
  ['deesa', 'Deesa', 'Gujarat'],
  ['ankleshwar', 'Ankleshwar', 'Gujarat'],
  ['khambhat', 'Khambhat (Cambay)', 'Gujarat'],
  ['khambhalia', 'Khambhalia (Khambaliya)', 'Gujarat'],
  ['dhoraji', 'Dhoraji', 'Gujarat'],
  ['upleta', 'Upleta', 'Gujarat'],
  ['modasa', 'Modasa', 'Gujarat'],
  ['himatnagar', 'Himatnagar', 'Gujarat'],
  ['keshod', 'Keshod', 'Gujarat'],
  ['mandvi', 'Mandvi', 'Gujarat'],
  ['anjar', 'Anjar', 'Gujarat'],
  ['dholka', 'Dholka', 'Gujarat'],
  ['viramgam', 'Viramgam', 'Gujarat'],
  ['kadi', 'Kadi', 'Gujarat'],
  ['visnagar', 'Visnagar', 'Gujarat'],
  ['siddhpur', 'Siddhpur', 'Gujarat'],
  ['una', 'Una', 'Gujarat'],
  ['mangrol', 'Mangrol', 'Gujarat'],
  ['vyara', 'Vyara', 'Gujarat'],
  ['halol', 'Halol', 'Gujarat'],
  ['bardoli', 'Bardoli', 'Gujarat'],
  ['petlad', 'Petlad', 'Gujarat'],
  ['borsad', 'Borsad', 'Gujarat'],
  ['sanand', 'Sanand', 'Gujarat'],
  ['padra', 'Padra', 'Gujarat'],
  ['dabhoi', 'Dabhoi', 'Gujarat'],
  ['savarkundla', 'Savarkundla', 'Gujarat'],
  ['mahuva', 'Mahuva', 'Gujarat'],
  ['palitana', 'Palitana', 'Gujarat'],
  ['wadhwan', 'Wadhwan', 'Gujarat'],
  ['dhrangadhra', 'Dhrangadhra', 'Gujarat'],
] as const;

async function seed(): Promise<void> {
  await connectDatabase();
  // Clear any non-Gujarat or previous entries to strictly ensure only Gujarat cities right now
  await CityModel.deleteMany({});
  await CityModel.bulkWrite(
    cities.map(([slug, name, state]) => ({
      updateOne: { filter: { slug }, update: { $set: { slug, name, state } }, upsert: true },
    }))
  );
  console.log(`Seeded ${cities.length} Gujarat cities successfully.`);
  await mongoose.disconnect();
}

void seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
