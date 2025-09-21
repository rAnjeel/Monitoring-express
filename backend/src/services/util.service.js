// util.service.js

class UtilService {
  toNull(v) {
    if (v === undefined || v === null) return null;
    const s = typeof v === 'string' ? v.trim() : v;
    if (s === '' || s === '\\N' || s === '\\n' || s === 'NULL' || s === 'null') return null;
    return s;
  }

  toIntOrNull(v) {
    const x = this.toNull(v);
    if (x === null) return null;
    const n = Number(x);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  }

  toFloatOrNull(v) {
    const x = this.toNull(v);
    if (x === null) return null;
    const n = Number(x);
    return Number.isFinite(n) ? n : null;
  }

  toBoolean(v) {
    const x = this.toNull(v);
    if (x === null) return 0; // défaut = 0
    if (typeof x === 'boolean') return x ? 1 : 0;
    if (x === '1' || x === 1 || x === 'true') return 1;
    if (x === '0' || x === 0 || x === 'false') return 0;
    return 0;
  }

  toDateOrNull(value) {
    if (value === null || value === undefined || value === '') return null;
    if (value instanceof Date) return value;
    const n = Number(value);
    if (!Number.isNaN(n) && Number.isFinite(n)) {
      const millis = String(Math.trunc(n)).length === 10 ? n * 1000 : n;
      const d = new Date(millis);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const parsed = Date.parse(String(value));
    return Number.isNaN(parsed) ? null : new Date(parsed);
  }
}

module.exports = new UtilService();
