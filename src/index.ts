const YYYY_MM_DD_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class YmdInvalidDateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'YmdInvalidDateError';
  }
}

export class Ymd {
  public readonly year: number;
  public readonly monthZeroIndexed: number;
  public readonly day: number;

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
    const month = String(this.monthZeroIndexed + 1).padStart(2, '0');
    const day = String(this.day).padStart(2, '0');
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
}