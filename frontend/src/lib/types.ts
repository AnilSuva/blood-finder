export type BloodGroup = 'O-' | 'O+' | 'A-' | 'A+' | 'B-' | 'B+' | 'AB-' | 'AB+';
export type User = { id: string; email: string; name: string | null; avatarUrl: string | null; bloodGroup: BloodGroup | null; city: string | null; available: boolean; lastDonatedAt: string | null; emailAlerts: boolean; onboardingComplete: boolean; role: 'user' | 'admin' };
export type City = { _id?: string; slug: string; name: string; state: string };
export type BloodRequest = { id: string; city: string; hospital: string | null; patientBloodGroup: BloodGroup; unitsNeeded: number; neededBy: 'asap' | 'today' | '48h'; note: string | null; status: 'open' | 'fulfilled' | 'cancelled' | 'expired'; expiresAt: string; createdAt: string; isOwner: boolean };
