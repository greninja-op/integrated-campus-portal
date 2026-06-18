/**
 * Pure helper functions (no DB / no Express) so they can be unit-tested.
 */

export function toInt(v, d = undefined) {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? d : n;
}

// Roles: 'staff' is treated as an alias of 'teacher'.
export function normalizeRole(r) {
  return r === 'staff' ? 'teacher' : r;
}

// Receipt id for a payment. `now`/`rnd` are injectable for deterministic tests.
export function generateReceipt(now = Date.now(), rnd = Math.random) {
  return 'RCP' + now + Math.floor(rnd() * 1000);
}

export function attendancePercentage(present, total) {
  return total > 0 ? Math.round((present / total) * 100) : 0;
}

// Does a fee apply to a given student? (null department/semester on the fee = all)
export function feeAppliesToStudent(fee, student) {
  if (!fee || fee.is_active === false) return false;
  const deptOk = fee.department == null || fee.department === student.department;
  const semOk = fee.semester == null || fee.semester === student.semester;
  return deptOk && semOk;
}
