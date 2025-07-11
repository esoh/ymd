# @esoh/ymd

A lightweight TypeScript library for handling date strings in `yyyy-MM-dd` format with timezone-aware conversions.

## Installation

```bash
npm install @esoh/ymd
# or
yarn add @esoh/ymd
```

## Quick Start

```typescript
import { Ymd } from '@esoh/ymd';

// Create from string
const date = new Ymd('2024-12-25');
console.log(date.value); // '2024-12-25'

// Create from Date object (local timezone)
const now = new Date();
const today = Ymd.fromDateAsLocal(now);

// Create from Date object (UTC timezone)
const utcToday = Ymd.fromDateAsUtc(now);
```

## Features

- **Type-safe**: Full TypeScript support with proper error handling
- **Timezone aware**: Convert Date objects using local or UTC timezone
- **Validation**: Built-in date format and validity checking
- **Immutable**: All properties are readonly
- **Lightweight**: Zero dependencies

## API Reference

### Constructor

```typescript
new Ymd(value: string)
```

Creates a Ymd instance from a string in `yyyy-MM-dd` format.

**Parameters:**
- `value` (string): Date string in `yyyy-MM-dd` format

**Throws:**
- `Error`: If the format is invalid
- `YmdInvalidDateError`: If the date is invalid (e.g., 2024-02-30)

**Example:**
```typescript
const date = new Ymd('2024-12-25');
```

### Properties

- `year` (number): The year (e.g., 2024)
- `monthZeroIndexed` (number): The month (0-11, where 0 = January)
- `day` (number): The day of the month (1-31)
- `value` (string): The date in `yyyy-MM-dd` format

### Static Methods

#### `Ymd.isValid(value: string): boolean`

Checks if a string represents a valid date in `yyyy-MM-dd` format.

```typescript
Ymd.isValid('2024-12-25'); // true
Ymd.isValid('2024-02-30'); // false (not a leap year)
Ymd.isValid('invalid');    // false
```

#### `Ymd.fromDateAsLocal(date: Date): Ymd`

Creates a Ymd instance from a Date object using the local timezone.

```typescript
const now = new Date();
const today = Ymd.fromDateAsLocal(now);
```

#### `Ymd.fromDateAsUtc(date: Date): Ymd`

Creates a Ymd instance from a Date object using UTC timezone.

```typescript
const now = new Date();
const utcToday = Ymd.fromDateAsUtc(now);
```

## Usage Examples

### Basic Usage

```typescript
import { Ymd } from '@esoh/ymd';

// Create from string
const christmas = new Ymd('2024-12-25');
console.log(christmas.year);        // 2024
console.log(christmas.monthZeroIndexed); // 11 (December)
console.log(christmas.day);         // 25
console.log(christmas.value);       // '2024-12-25'
```

### Timezone Handling

```typescript
const now = new Date();
console.log(now.toString());        // Fri Jul 11 2025 17:37:47 GMT-0700 (PDT)
console.log(now.toUTCString());     // Sat, 12 Jul 2025 00:37:47 GMT

// Local timezone
const localDate = Ymd.fromDateAsLocal(now);
console.log(localDate.value);       // '2025-07-11'

// UTC timezone
const utcDate = Ymd.fromDateAsUtc(now);
console.log(utcDate.value);         // '2025-07-12'
```

### Validation

```typescript
// Valid dates
Ymd.isValid('2024-12-25');          // true
Ymd.isValid('2024-02-29');          // true (leap year)

// Invalid dates
Ymd.isValid('2024-02-30');          // false (not a leap year)
Ymd.isValid('2024-13-01');          // false (invalid month)
Ymd.isValid('invalid-date');        // false (wrong format)

// Try-catch for detailed error handling
try {
  const date = new Ymd('2024-02-30');
} catch (error) {
  if (error instanceof YmdInvalidDateError) {
    console.log('Invalid date provided');
  }
}
```

### Date Comparisons

```typescript
const date1 = new Ymd('2024-12-25');
const date2 = new Ymd('2024-12-26');

// Compare values
console.log(date1.value < date2.value); // true

// Compare individual components
console.log(date1.year === date2.year); // true
console.log(date1.monthZeroIndexed === date2.monthZeroIndexed); // true
console.log(date1.day < date2.day); // true
```

## Error Handling

The library provides specific error types for better error handling:

```typescript
import { Ymd, YmdInvalidDateError } from '@esoh/ymd';

try {
  const date = new Ymd('2024-02-30');
} catch (error) {
  if (error instanceof YmdInvalidDateError) {
    console.log('Invalid date');
  } else {
    console.log('Invalid format');
  }
}
```

## Why Use @esoh/ymd?

- **Simple**: Focused on one thing - handling `yyyy-MM-dd` date strings
- **Safe**: Built-in validation prevents invalid dates
- **Timezone aware**: Clear distinction between local and UTC date extraction
- **TypeScript first**: Full type safety and IntelliSense support
- **No dependencies**: Lightweight and fast

## License

MIT