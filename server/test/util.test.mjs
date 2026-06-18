import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toInt, normalizeRole, generateReceipt, attendancePercentage, feeAppliesToStudent } from '../lib/util.mjs';

test('toInt parses integers and falls back', () => {
  assert.equal(toInt('5'), 5);
  assert.equal(toInt('3abc'), 3);
  assert.equal(toInt('abc', 0), 0);
  assert.equal(toInt(undefined, 1), 1);
  assert.equal(toInt('7', 0), 7);
});

test('normalizeRole maps staff to teacher', () => {
  assert.equal(normalizeRole('staff'), 'teacher');
  assert.equal(normalizeRole('teacher'), 'teacher');
  assert.equal(normalizeRole('admin'), 'admin');
  assert.equal(normalizeRole('student'), 'student');
});

test('generateReceipt is deterministic with injected now/rnd', () => {
  assert.equal(generateReceipt(1000, () => 0.5), 'RCP1000500');
  assert.match(generateReceipt(), /^RCP\d+$/);
});

test('attendancePercentage rounds and guards divide-by-zero', () => {
  assert.equal(attendancePercentage(0, 0), 0);
  assert.equal(attendancePercentage(3, 4), 75);
  assert.equal(attendancePercentage(1, 3), 33);
  assert.equal(attendancePercentage(2, 3), 67);
});

test('feeAppliesToStudent matches dept/semester and null wildcards', () => {
  const student = { department: 'BCA', semester: 1 };
  assert.equal(feeAppliesToStudent({ department: 'BCA', semester: 1 }, student), true);
  assert.equal(feeAppliesToStudent({ department: 'BBA', semester: 1 }, student), false);
  assert.equal(feeAppliesToStudent({ department: 'BCA', semester: 2 }, student), false);
  assert.equal(feeAppliesToStudent({ department: null, semester: null }, student), true);
  assert.equal(feeAppliesToStudent({ department: 'BCA', semester: 1, is_active: false }, student), false);
});
