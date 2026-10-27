import { describe, expect, it } from 'vitest';
import { buildFeedFilter } from '../src/modules/requests/service.js';
describe('feed query', () => {
  it('requires city, availability, an allowed group, and an open unexpired request for donors', () => {
    const filter = buildFeedFilter({ _id: { toString: () => '012345678901234567890123' }, available: true, city: 'bhuj', bloodGroup: 'O+' } as never);
    expect(filter).toMatchObject({ $or: [{ requesterId: expect.anything() }, { city: 'bhuj', status: 'open', compatibleDonorGroups: 'O+' }] });
  });
});
