import { addDays, addMonths, differenceInCalendarDays, differenceInDays, differenceInMonths, getDay, nextDay, previousDay } from 'date-fns';
import { format, formatInTimeZone, fromZonedTime } from 'date-fns-tz';

const YYYY_MM_DD_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const DayOfWeek = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
} as const;
export type DayOfWeekValue = typeof DayOfWeek[keyof typeof DayOfWeek];

const Duration = {
  DAYS_IN_WEEK: 7,
} as const;

export class YmdInvalidDateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'YmdInvalidDateError';
  }
}

function padDayOrMonth(value: number) {
  return String(value).padStart(2, '0');
}

type FromTo = {
  from: Ymd | string;
  to: Ymd | string;
}

function normalizeYmd(ymd: Ymd | string) {
  return ymd instanceof Ymd ? ymd : new Ymd(ymd);
}

function normalizeFromTo(fromTo: FromTo) {
  const fromYmd = normalizeYmd(fromTo.from);
  const toYmd = normalizeYmd(fromTo.to);
  return {
    from: fromYmd,
    to: toYmd,
  } as const
}

export class Ymd {
  public readonly year: number;
  public readonly monthZeroIndexed: number;
  public readonly dayOfMonth: number;

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
    this.dayOfMonth = jsDate.getUTCDate();
  }

  get value() {
    const month = padDayOrMonth(this.monthZeroIndexed + 1);
    const day = padDayOrMonth(this.dayOfMonth);
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
   * console.log(Ymd.fromDateAtLocal(now).value); // 2025-07-11
   */
  static fromDateAtLocal(date: Date) {
    // if new Date() is Apr 8, 2023 11:33pm (from San Francisco),
    // date.toString() would return Apr 8 2023 11:33pm
    // date.toISOString() would return Apr 9 2023 6:33am
    //
    // date.getUTCHours() would return `6`
    // date.getHours() would return `23`
    // -> we need to use nonUTC methods to get the correct date
    const year = date.getFullYear();
    const monthZeroIndexed = padDayOrMonth(date.getMonth() + 1);
    const day = padDayOrMonth(date.getDate());
    return new Ymd(`${year}-${monthZeroIndexed}-${day}`);
  }

  /**
   * uses the UTC timezone to extract the yyyy-MM-dd
   * e.g:
   *
   * > const date = new Date(2025, 06, 12, 23);
   * > date.toString();
   * 'Sat Jul 12 2025 23:00:00 GMT-0700 (Pacific Daylight Time)'
   * > date.toUTCString();
   * 'Sun, 13 Jul 2025 06:00:00 GMT'
   * > Ymd.fromDateAtUtc(date).value;
   * '2025-07-13'
   */
  static fromDateAtUtc(date: Date) {
    const year = date.getUTCFullYear();
    const monthZeroIndexed = padDayOrMonth(date.getUTCMonth() + 1);
    const day = padDayOrMonth(date.getUTCDate());
    return new Ymd(`${year}-${monthZeroIndexed}-${day}`);
  }

  // returns the current date in the local timezone
  static todayAtLocalTimezone() {
    return Ymd.fromDateAtLocal(new Date());
  }

  /** imagine you're in a different timezone now - what's the date here? */
  static todayAtTimezone(timezone: string) {
    return new Ymd(formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd'));
  }

  /** imagine you're in the UTC timezone now - what's the date here? */
  static todayAtUtc() {
    return Ymd.fromDateAtUtc(new Date());
  }

  /**
   * https://date-fns.org/docs/format
   * Day of the week:
   *  - EEE    Mon, Tue, Wed, ..., Sun
   *  - EEEE   Monday, Tuesday, etc.
   *  - EEEEE  M, T, ...
   *  - EEEEEE Mo, Tu, ...
   *
   * Day of month:
   *  - d	  1, 2, ..., 31	
   *  - do	1st, 2nd, ..., 31st	7
   *  - dd	01, 02, ..., 31
   *
   * Month:
   *  - M	    1, 2, ..., 12	
   *  - Mo	  1st, 2nd, ..., 12th	7
   *  - MM	  01, 02, ..., 12	
   *  - MMM	  Jan, Feb, ..., Dec	
   *  - MMMM	January, February, ..., December	2
   *  - MMMMM	J, F, ..., D
   *  
   * Year:
   *  - yy    44, 01, 00, 17
   *  - yyyy  1944, 2001, 2000, 2017
   */
  format(formatStr: string) {
    return format(this.asDateAtLocal(), formatStr);
  }

  /**
   * Converts it to a Date with the expected date, but at local time midnight,
   * as is expected with normal Date usage.
   *
   * Achieves the opposite effect of `fromDateAtLocal`.
   *
   * @example
   * // After setting computer timezone to Paris, France:
   * > const date = new Ymd('2023-04-08').toJsDate();
   * > date; // 2023-04-07T22:00:00.000Z
   * > date.toISOString(); // '2023-04-07T22:00:00.000Z'
   * > date.toString(); // 'Sat Apr 08 2023 00:00:00 GMT+0200 (GMT+02:00)'
   */
  asDateAtLocal() {
    return new Date(this.year, this.monthZeroIndexed, this.dayOfMonth);
  }

  /**
   * Converts it to a Date with the expected date, but at UTC time midnight,
   * as is expected with normal Date usage.
   *
   * Achieves the opposite effect of `fromDateAtUtc`.
   */
  asDateAtUtc() {
    return new Date(Date.UTC(this.year, this.monthZeroIndexed, this.dayOfMonth));
  }

  /**
   * Returns a Date that represents the date at midnight in the specified timezone.
   * > const today = Ymd.todayAtLocalTimezone();
   * > today.asDateAtTimezone('America/New_York').toISOString();
   * '2025-07-12T04:00:00.000Z' > this is 2025-07-12 midnight in New York
   * > today.asDateAtTimezone('Europe/Paris').toISOString();
   * '2025-07-11T22:00:00.000Z' > this is 2025-07-12 midnight in Paris
   */
  asDateAtTimezone(timezone: string) {
    return fromZonedTime(this.asDateAtLocal(), timezone);
  }

  /**
   * Adds `count` days to the date
   * @returns new Ymd object.
   *
   * Does NOT add 24*count hours in every case, otherwise this function would not
   * behave as expected.
   *
   * Consider DST for example:
   * > const date = Ymd.build(2021, 3, 14);
   * 'Sun Mar 14 2021 00:00:00 GMT-0800 (Pacific Standard Time)'
   * > date.addDays(1)
   * 'Mon Mar 15 2021 00:00:00 GMT-0700 (Pacific Daylight Time)'
   *
   * That's a 23 hour time difference.
   */
  addDays(count: number) {
    // handles date overflow (even +365 works), and appropriately
    // sets datetime even over daylight savings changes as well
    // as leap years.
    return Ymd.fromDateAtLocal(addDays(this.asDateAtLocal(), count));
  }

  /**
   * Does not add 30 days.
   *
   * Behaves as expected normally, but there are a few edge cases.
   *
   * _2023jan28.addMonths(1) // => 2023-02-28
   * _2023jan31.addMonths(1) // => 2023-02-28
   */
  addMonths(count: number) {
    return Ymd.fromDateAtLocal(addMonths(this.asDateAtLocal(), count));
  }

  /**
   * Returns the Ymd object representing the last occurrence of the day of
   * the week provided before the date that the current Ymd instance represents.
   *
   * Similar to currentOrPreviousDayOfWeekOccurrence, except this will not return the
   * same date.
   *
   * @example
   * // 2023-11-13 is a Monday, 2023-11-07 is a Tuesday.
   * // returns Ymd(2023-11-07)
   * new Ymd('2023-11-13').latestOccurrenceOfWeekday(DayOfWeek.TUESDAY)
   *
   * @example
   * // 2023-11-13 is a Monday.
   * // returns Ymd(2023-11-06)
   * new Ymd('2023-11-13').latestOccurrenceOfWeekday(DayOfWeek.MONDAY)
   */
  previousDayOfWeekOccurrence(dayOfWeek: DayOfWeekValue) {
    return Ymd.fromDateAtLocal(previousDay(this.asDateAtLocal(), dayOfWeek));
  }

  /**
   * 0 - Sunday
   * 1 - Monday
   * ...etc
   */
  get dayOfWeek() {
    return getDay(this.asDateAtLocal()) as DayOfWeekValue;
  }

  /**
   * Returns the Ymd object representing the last occurrence of the day of
   * the week provided before or equal to the date that the current Ymd
   * instance represents.
   *
   * Similar to previousDayOfWeekOccurrence, except this may return itself.
   *
   * @example
   * // 2023-11-13 is a Monday, 2023-11-07 is a Tuesday.
   * // returns Ymd(2023-11-07)
   * new Ymd('2023-11-13').latestOccurrenceOfWeekday(DayOfWeek.TUESDAY)
   *
   * @example
   * // 2023-11-13 is a Monday.
   * // returns Ymd(2023-11-13)
   * new Ymd('2023-11-13').latestOccurrenceOfWeekday(DayOfWeek.MONDAY)
   */
  currentOrPreviousDayOfWeekOccurrence(dayOfWeek: DayOfWeekValue) {
    if (this.dayOfWeek === dayOfWeek) {
      return this;
    }
    return this.previousDayOfWeekOccurrence(dayOfWeek);
  }
  
  /**
   * Returns the Ymd object representing the next occurrence of the day of
   * the week provided after the date that the current Ymd instance represents.
   *
   * Similar to currentOrNextDayOfWeekOccurrence, except this will not return the
   * same date.
   */
  nextDayOfWeekOccurrence(dayOfWeek: DayOfWeekValue) {
    return Ymd.fromDateAtLocal(nextDay(this.asDateAtLocal(), dayOfWeek));
  }
  
  /**
   * Returns the Ymd object representing the next occurrence of the day of
   * the week provided after or equal to the date that the current Ymd
   * instance represents.
   *
   * Similar to nextDayOfWeekOccurrence, except this may return itself.
   */
  currentOrNextDayOfWeekOccurrence(dayOfWeek: DayOfWeekValue) {
    if (this.dayOfWeek === dayOfWeek) {
      return this;
    }
    return this.nextDayOfWeekOccurrence(dayOfWeek);
  }

  startOfMonth() {
    return Ymd.build(this.year, this.monthZeroIndexed, 1);
  }

  endOfMonth() {
    return this.startOfMonth().addMonths(1).addDays(-1);
  }

  static build(year: number, monthZeroIndexed: number, dayOfMonth: number) {
    return new Ymd(`${year}-${padDayOrMonth(monthZeroIndexed + 1)}-${padDayOrMonth(dayOfMonth)}`);
  }

  gt(other: Ymd | string) {
    return this.asDateAtLocal() > normalizeYmd(other).asDateAtLocal();
  }
  gte(other: Ymd | string) {
    return this.asDateAtLocal() >= normalizeYmd(other).asDateAtLocal();
  }
  lt(other: Ymd | string) {
    return this.asDateAtLocal() < normalizeYmd(other).asDateAtLocal();
  }
  lte(other: Ymd | string) {
    return this.asDateAtLocal() <= normalizeYmd(other).asDateAtLocal();
  }
  eq(other: Ymd | string) {
    return this.value === normalizeYmd(other).value;
  }

  isLaterThan(other: Ymd | string) {
    return this.gt(normalizeYmd(other));
  }
  isEarlierThan(other: Ymd | string) {
    return this.lt(normalizeYmd(other));
  }
  isFutureDate() {
    return this.gt(Ymd.todayAtLocalTimezone());
  }

  /**
   * Imagine you are viewing a month in a calendar.
   * While it contains every day of the month, it may also include dates from
   * the previous and/or next month to fill out the grid.
   *
   * This function, given whether the day starts on Sunday or Monday, will
   * return the start and end dates of the grid containing the entire month. (inclusive)
   *
   * It is very likely that the start and end dates will include
   * dates from the previous and/or next month.
   */
  calendarMonthDateRange({
    weekStartsOnWeekDayIdx,
  }: {
    weekStartsOnWeekDayIdx: DayOfWeekValue;
  }) {
    const monthStartYmd = this.startOfMonth();
    const lastDayInMonth = this.endOfMonth();
  
    const weekEndsOnDayOfWeek = ((weekStartsOnWeekDayIdx +
      Duration.DAYS_IN_WEEK -
      1) %
      Duration.DAYS_IN_WEEK) as DayOfWeekValue;
  
    return {
      start: monthStartYmd.currentOrPreviousDayOfWeekOccurrence(
        weekStartsOnWeekDayIdx,
      ),
      end: lastDayInMonth.currentOrNextDayOfWeekOccurrence(weekEndsOnDayOfWeek),
    };
  }

  /**
   * returns Ymd[][] representing the grid view of a calendar month. It
   * likely includes dates from the previous and/or next month to fill out the grid.
   *
   * The calendar grid is a 2D array, where each sub-array represents a week.
   */
  calendarWeeksForMonth({
    weekStartsOnWeekDayIdx,
  }: {
    weekStartsOnWeekDayIdx: DayOfWeekValue;
  }) {
    const {start, end} = this.calendarMonthDateRange({
      weekStartsOnWeekDayIdx,
    });
  
    const allDates = Ymd.dayArray({ from: start, to: end });
  
    const weeks = [];
    while (allDates.length) {
      weeks.push(allDates.splice(0, Duration.DAYS_IN_WEEK));
    }
  
    return weeks;
  }

  /** INCLUSIVE */
  static dayArray(fromTo: FromTo) {
    const {from, to} = normalizeFromTo(fromTo);
    const interval = [];
    let curr = from;
    while (curr.lte(to)) {
      interval.push(curr);
      curr = curr.addDays(1);
    }
    return interval;
  }

  /** INCLUSIVE - Generator version for memory efficiency */
  static *dayGenerator(fromTo: FromTo) {
    const {from, to} = normalizeFromTo(fromTo);
    let curr = from;
    while (curr.lte(to)) {
      yield curr;
      curr = curr.addDays(1);
    }
  }

  /**
   * Ymd.differenceInMonths({from: new Ymd('2025-01-01'),to:  new Ymd('2025-01-31')}); // 0
   * Ymd.differenceInMonths({from: new Ymd('2025-01-01'), to: new Ymd('2025-02-01')}); // 1
   * Ymd.differenceInMonths({from: new Ymd('2025-01-01'), to: new Ymd('2025-02-02')}); // 1
   * Ymd.differenceInMonths({from: new Ymd('2025-02-01'),to:  new Ymd('2025-01-01')}); // -1
   */
  static differenceInMonths(fromTo: FromTo) {
    const {from, to} = normalizeFromTo(fromTo);
    return differenceInMonths(to.asDateAtLocal(), from.asDateAtLocal());
  }

  /**
   * Ymd.differenceInDays({from: new Ymd('2025-01-01'), to: new Ymd('2025-01-31')}); // 30
   * 
   * Ymd.differenceInDays({from: new Ymd('2025-01-01'), to: new Ymd('2025-02-01')}); // 31
   * 
   * Ymd.differenceInDays({from: new Ymd('2025-01-01'), to: new Ymd('2025-02-02')}); // 32
   * 
   * Ymd.differenceInDays({from: new Ymd('2025-02-01'), to: new Ymd('2025-01-01')}); // -31
   */
  static differenceInDays(fromTo: FromTo) {
    const {from, to} = normalizeFromTo(fromTo);
    return differenceInDays(to.asDateAtLocal(), from.asDateAtLocal());
  }

  /**
   * for use with `sort`. sorts ascending.
   * @example
   * [new Ymd('2023-01-01'), new Ymd('2023-01-02')].sort(Ymd.compareAsc)
   * // => [new Ymd('2023-01-01'), new Ymd('2023-01-02')]
   *
   * [new Ymd('2023-01-02'), new Ymd('2023-01-01')].sort(Ymd.compareAsc)
   * // => [new Ymd('2023-01-01'), new Ymd('2023-01-02')]
   */
  static compareAsc(a: string | Ymd, b: string | Ymd) {
    // should return a negative number if a is earlier than b
    // should return 0 if a is the same as b
    // should return a positive number if a is later than b
    return Ymd.differenceInDays({ from: b, to: a });
  }

  /**
   * for use with `sort`. sorts descending.
   */
  static compareDesc(a: string | Ymd, b: string | Ymd) {
    return -Ymd.compareAsc(a, b);
  }

  /** `from` must be <= `to` */
  static countDaysInclusive(fromTo: FromTo) {
    const {from, to} = normalizeFromTo(fromTo);
    if (from.gt(to)) {
      throw new Error('`from` must not be a later date than `to`');
    }
    return differenceInCalendarDays(to.asDateAtLocal(), from.asDateAtLocal()) + 1;
  }

  startOfWeek(weekStartsOnWeekDayIdx: DayOfWeekValue) {
    return this.currentOrPreviousDayOfWeekOccurrence(weekStartsOnWeekDayIdx);
  }

  isToday() {
    return this.eq(Ymd.todayAtLocalTimezone());
  }

  isTomorrow() {
    return this.eq(Ymd.todayAtLocalTimezone().addDays(1));
  }

  isYesterday() {
    return this.eq(Ymd.todayAtLocalTimezone().addDays(-1));
  }

  isInTheFuture() {
    return this.gt(Ymd.todayAtLocalTimezone());
  }

  isInThePast() {
    return this.lt(Ymd.todayAtLocalTimezone());
  }

  daysSince(other: Ymd | string) {
    const otherYmd = normalizeYmd(other);
    return Ymd.differenceInDays({ from: otherYmd, to: this });
  }

  daysUntil(other: Ymd | string) {
    const otherYmd = normalizeYmd(other);
    return Ymd.differenceInDays({ from: this, to: otherYmd });
  }
}