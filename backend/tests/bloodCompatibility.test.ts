import { describe, expect, it } from 'vitest';
import { compatibleDonorsFor, isCompatibleDonor } from '../src/utils/bloodCompatibility.js';
describe('blood compatibility', () => {
  it('uses the exact O-negative recipient rule', () => expect(compatibleDonorsFor('O-')).toEqual(['O-']));
  it('allows every blood group to donate to AB positive', () => expect(compatibleDonorsFor('AB+')).toHaveLength(8));
  it('does not allow an incompatible donor', () => expect(isCompatibleDonor('A-', 'B-')).toBe(false));
});
