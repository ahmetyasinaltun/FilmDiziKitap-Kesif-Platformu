import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../test/database.js';
import { takeFromDailyBudget } from './daily-budget.js';

beforeEach(async () => {
  await db.reset();
});

describe('günlük çağrı bütçesi', () => {
  it('sınıra kadar izin verir, sonrasını reddeder', async () => {
    const day = new Date('2026-11-09T10:00:00Z');
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await takeFromDailyBudget('omdb', 3, day));
    expect(results).toEqual([true, true, true, false]);
  });

  it('gün değişince yeniden başlar, servisler birbirini etkilemez', async () => {
    const today = new Date('2026-11-09T23:59:00Z');
    const tomorrow = new Date('2026-11-10T00:01:00Z');
    await takeFromDailyBudget('omdb', 1, today);

    expect(await takeFromDailyBudget('omdb', 1, today)).toBe(false);
    expect(await takeFromDailyBudget('omdb', 1, tomorrow)).toBe(true);
    expect(await takeFromDailyBudget('baska', 1, today)).toBe(true);
  });
});
