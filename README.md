# @esoh/ymd

A TypeScript utility class for working with dates in YYYY-MM-DD format.

## Install

```bash
npm install @esoh/ymd
```

or if you're using yarn:
```bash
yarn add @esoh/ymd
```

## Usage

```typescript
import { Ymd, DayOfWeek } from '@esoh/ymd';

// Create from string
const date = new Ymd('2023-12-25');

// Create from Date objects
const today = Ymd.todayAtLocalTimezone();
const utcToday = Ymd.todayAtUtc();
const tokyoToday = Ymd.todayAtTimezone('Asia/Tokyo');

// Date arithmetic
const tomorrow = date.addDays(1);
const nextMonth = date.addMonths(1);

// Comparisons
date.isToday(); // boolean
date.isInTheFuture(); // boolean
date.gt('2023-12-24'); // boolean

// Week operations
const monday = date.previousDayOfWeekOccurrence(DayOfWeek.MONDAY);
const weekStart = date.startOfWeek(DayOfWeek.MONDAY);

// Formatting
date.format('MMM dd, yyyy'); // "Dec 25, 2023"

// Date ranges
const days = Ymd.dayArray({ from: '2023-12-01', to: '2023-12-31' });
const monthRange = date.calendarMonthDateRange({ weekStartsOnWeekDayIdx: DayOfWeek.MONDAY });
```

## Key Features

- **Timezone-aware**: Support for local, UTC, and specific timezone dates
- **Date arithmetic**: Add days/months with proper DST handling
- **Week operations**: Find previous/next occurrences of weekdays
- **Calendar utilities**: Generate month ranges and calendar weeks
- **Comparisons**: Rich comparison methods for date logic
- **Formatting**: Flexible date formatting with date-fns

## API Reference

### Instance Methods

#### Date Creation & Conversion
- `constructor(value: string)` - Create from YYYY-MM-DD string
- `asDateAtLocal()` - Convert to JavaScript Date at local midnight
- `format(formatStr: string)` - Format using date-fns patterns

#### Date Arithmetic
- `addDays(count: number)` - Add days with DST handling
- `addMonths(count: number)` - Add months (handles month overflow)

#### Week Operations
- `previousDayOfWeekOccurrence(dayOfWeek)` - Last occurrence before current date
- `currentOrPreviousDayOfWeekOccurrence(dayOfWeek)` - Current or previous occurrence
- `nextDayOfWeekOccurrence(dayOfWeek)` - Next occurrence after current date
- `currentOrNextDayOfWeekOccurrence(dayOfWeek)` - Current or next occurrence
- `startOfWeek(weekStartsOnWeekDayIdx)` - Start of week

#### Month Operations
- `startOfMonth()` - First day of month
- `endOfMonth()` - Last day of month

#### Comparisons
- `gt(other)` - Greater than
- `gte(other)` - Greater than or equal
- `lt(other)` - Less than
- `lte(other)` - Less than or equal
- `eq(other)` - Equal
- `isLaterThan(other)` - Alias for gt
- `isEarlierThan(other)` - Alias for lt

#### Boolean Checks
- `isToday()` - Is today's date
- `isTomorrow()` - Is tomorrow's date
- `isYesterday()` - Is yesterday's date
- `isInTheFuture()` - Is in the future
- `isInThePast()` - Is in the past
- `isFutureDate()` - Alias for isInTheFuture

#### Date Differences
- `daysSince(other)` - Days since other date
- `daysUntil(other)` - Days until other date

#### Calendar Utilities
- `calendarMonthDateRange(options)` - Full month range including padding
- `calendarWeeksForMonth(options)` - Array of weeks for month

### Static Methods

#### Creation
- `Ymd.isValid(value: string)` - Validate YYYY-MM-DD format
- `Ymd.fromDateAtLocal(date: Date)` - Create from Date using local timezone
- `Ymd.fromDateAtUtc(date: Date)` - Create from Date using UTC
- `Ymd.todayAtLocalTimezone()` - Today in local timezone
- `Ymd.todayAtTimezone(timezone: string)` - Today in specific timezone
- `Ymd.todayAtUtc()` - Today in UTC
- `Ymd.build(year, monthZeroIndexed, dayOfMonth)` - Create from components

#### Date Ranges
- `Ymd.dayArray(fromTo)` - Array of all dates in range
- `Ymd.dayGenerator(fromTo)` - Generator for dates in range
- `Ymd.countDaysInclusive(fromTo)` - Count days in range

#### Comparisons
- `Ymd.compareAsc(a, b)` - Compare ascending
- `Ymd.compareDesc(a, b)` - Compare descending

#### Differences
- `Ymd.differenceInDays(fromTo)` - Days between dates
- `Ymd.differenceInMonths(fromTo)` - Months between dates

### Constants
- `DayOfWeek` - Enum with SUNDAY=0, MONDAY=1, etc.

## Dependencies

- `date-fns` (peer dependency)
- `date-fns-tz` (peer dependency)
- `typescript` (peer dependency)