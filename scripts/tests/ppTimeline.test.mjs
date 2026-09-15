import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const T = await import(pathToFileURL(join(process.env.KIN_TEST_BUILD, 'ppTimeline.mjs')).href);

test('buildJingleSchedule lays out the Happy Birthday melody in order', () => {
  const schedule = T.buildJingleSchedule(2.9, 0.25);
  assert.equal(schedule.length, 25, 'one entry per sung note in the melody');
  assert.equal(schedule[0].start, 2.9);
  for (let i = 1; i < schedule.length; i++) {
    assert.ok(schedule[i].start >= schedule[i - 1].start, `note ${i} starts before note ${i - 1}`);
  }
  const last = schedule[schedule.length - 1];
  assert.ok(last.start + last.duration <= 9.7, `melody ends at ${last.start + last.duration}, expected <= 9.7`);
});

test('PP_LIFECYCLE_MS milestones are non-decreasing and end at exactly 10000', () => {
  for (let i = 1; i < T.PP_LIFECYCLE_MS.length; i++) {
    assert.ok(T.PP_LIFECYCLE_MS[i] >= T.PP_LIFECYCLE_MS[i - 1], `milestone ${i} is before milestone ${i - 1}`);
  }
  assert.equal(T.PP_LIFECYCLE_MS[T.PP_LIFECYCLE_MS.length - 1], 10000);
  assert.equal(T.PP_PHASES.DURATION, 10000);
});

test('reduced-motion lifecycle milestones are non-decreasing and end at exactly 10000', () => {
  for (let i = 1; i < T.PP_RM_LIFECYCLE_MS.length; i++) {
    assert.ok(T.PP_RM_LIFECYCLE_MS[i] >= T.PP_RM_LIFECYCLE_MS[i - 1]);
  }
  assert.equal(T.PP_RM_LIFECYCLE_MS[T.PP_RM_LIFECYCLE_MS.length - 1], 10000);
});
