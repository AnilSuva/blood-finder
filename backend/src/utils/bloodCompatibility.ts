export const BLOOD_GROUPS = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export const COMPATIBLE_DONORS: Record<BloodGroup, readonly BloodGroup[]> = {
  'O-': ['O-'],
  'O+': ['O+', 'O-'],
  'A-': ['A-', 'O-'],
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};

export function compatibleDonorsFor(patientBloodGroup: BloodGroup): readonly BloodGroup[] {
  return COMPATIBLE_DONORS[patientBloodGroup];
}

export function isCompatibleDonor(patientBloodGroup: BloodGroup, donorBloodGroup: BloodGroup): boolean {
  return compatibleDonorsFor(patientBloodGroup).includes(donorBloodGroup);
}
