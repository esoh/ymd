const YYYY_MM_DD_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class YmdInvalidDateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'YmdInvalidDateError';
  }
}

function padDayOrMonth(value: number) {
  return String(value).padStart(2, '0');
}

export class Ymd {
  public readonly year: number;
  public readonly monthZeroIndexed: number;
  public readonly day: number;

  /**
   * @param value yyyy-MM-dd
   */
  constructor(value: string) {
    if (!YYYY_MM_DD_REGEX.test(value)) {
      throw new Error('Invalid date format. Expected yyyy-MM-dd');
    }
    const jsDate = new Date(value);
    if (isNaN(jsDate.getTime())) {
      throw new YmdInvalidDateError('Invalid date');
    }
    this.year = jsDate.getUTCFullYear();
    this.monthZeroIndexed = jsDate.getUTCMonth();
    this.day = jsDate.getUTCDate();
  }

  get value() {
    const month = padDayOrMonth(this.monthZeroIndexed + 1);
    const day = padDayOrMonth(this.day);
    return `${this.year}-${month}-${day}`;
  }

  /**
   * It's possible to input a date that looks valid like a leap day 2024-02-30
   * but is not a valid date.
   */
  static isValid(value: string) {
    try {
      return new Ymd(value).value === value;
    } catch {
      return false;
    }
  }

  /**
   * uses the local timezone of the caller to extract the yyyy-MM-dd
   * e.g:
   *
   * const now = new Date();
   * console.log(now.toString()); // Fri Jul 11 2025 17:37:47 GMT-0700 (Pacific Daylight Time)
   * console.log(now.toUTCString()); // Sat, 12 Jul 2025 00:37:47 GMT
   * 
   * console.log(Ymd.fromDateAsLocal(now).value); // 2025-07-11
   */
  static fromDateAsLocal(date: Date) {
    const year = date.getFullYear();
    const monthZeroIndexed = padDayOrMonth(date.getMonth() + 1);
    const day = padDayOrMonth(date.getDate());
    return new Ymd(`${year}-${monthZeroIndexed}-${day}`);
  }

  /**
   * uses the UTC timezone to extract the yyyy-MM-dd
   * e.g:
   *
   * const now = new Date();
   * console.log(now.toString()); // Fri Jul 11 2025 17:37:47 GMT-0700 (Pacific Daylight Time)
   * console.log(now.toUTCString()); // Sat, 12 Jul 2025 00:37:47 GMT
   * 
   * console.log(Ymd.fromDateAsUtc(now).value); // 2025-07-11
   */
  static fromDateAsUtc(date: Date) {
    const year = date.getUTCFullYear();
    const monthZeroIndexed = padDayOrMonth(date.getUTCMonth() + 1);
    const day = padDayOrMonth(date.getUTCDate());
    return new Ymd(`${year}-${monthZeroIndexed}-${day}`);
  }
}