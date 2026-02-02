import { describe, it, expect } from "bun:test";
import { parseDate, getTodayDate, getTomorrowDate } from "../../lib/date-parser";

describe("parseDate", () => {
  it("returns null when date string cannot be parsed", () => {
    // given
    const invalidDate = "not a date";

    // when
    const result = parseDate(invalidDate);

    // then
    expect(result).toBeNull();
  });

  it("parses 'today' and returns correct ISO date", () => {
    // given
    const today = new Date();
    const expectedYear = today.getFullYear();
    const expectedMonth = String(today.getMonth() + 1).padStart(2, "0");
    const expectedDay = String(today.getDate()).padStart(2, "0");
    const expected = `${expectedYear}-${expectedMonth}-${expectedDay}`;

    // when
    const result = parseDate("today");

    // then
    expect(result).toBe(expected);
  });

  it("parses 'tomorrow' and returns correct ISO date", () => {
    // given
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const expectedYear = tomorrow.getFullYear();
    const expectedMonth = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const expectedDay = String(tomorrow.getDate()).padStart(2, "0");
    const expected = `${expectedYear}-${expectedMonth}-${expectedDay}`;

    // when
    const result = parseDate("tomorrow");

    // then
    expect(result).toBe(expected);
  });

  it("parses 'next monday' and returns correct ISO date", () => {
    // given
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilMonday = (8 - dayOfWeek) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    const expectedYear = nextMonday.getFullYear();
    const expectedMonth = String(nextMonday.getMonth() + 1).padStart(2, "0");
    const expectedDay = String(nextMonday.getDate()).padStart(2, "0");
    const expected = `${expectedYear}-${expectedMonth}-${expectedDay}`;

    // when
    const result = parseDate("next monday");

    // then
    expect(result).toBe(expected);
  });

  it("parses 'next friday' and returns correct ISO date", () => {
    // given
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + daysUntilFriday);
    const expectedYear = nextFriday.getFullYear();
    const expectedMonth = String(nextFriday.getMonth() + 1).padStart(2, "0");
    const expectedDay = String(nextFriday.getDate()).padStart(2, "0");
    const expected = `${expectedYear}-${expectedMonth}-${expectedDay}`;

    // when
    const result = parseDate("next friday");

    // then
    expect(result).toBe(expected);
  });

  it("parses 'in 3 days' and returns correct ISO date", () => {
    // given
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const expectedYear = futureDate.getFullYear();
    const expectedMonth = String(futureDate.getMonth() + 1).padStart(2, "0");
    const expectedDay = String(futureDate.getDate()).padStart(2, "0");
    const expected = `${expectedYear}-${expectedMonth}-${expectedDay}`;

    // when
    const result = parseDate("in 3 days");

    // then
    expect(result).toBe(expected);
  });

  it("parses 'next week' and returns correct ISO date", () => {
    // given
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const expectedYear = futureDate.getFullYear();
    const expectedMonth = String(futureDate.getMonth() + 1).padStart(2, "0");
    const expectedDay = String(futureDate.getDate()).padStart(2, "0");
    const expected = `${expectedYear}-${expectedMonth}-${expectedDay}`;

    // when
    const result = parseDate("next week");

    // then
    expect(result).toBe(expected);
  });

  it("returns date in correct ISO format (YYYY-MM-DD)", () => {
    // given
    const dateString = "today";

    // when
    const result = parseDate(dateString);

    // then
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("getTodayDate", () => {
  it("returns today's date in ISO format", () => {
    // given
    const today = new Date();
    const expectedYear = today.getFullYear();
    const expectedMonth = String(today.getMonth() + 1).padStart(2, "0");
    const expectedDay = String(today.getDate()).padStart(2, "0");
    const expected = `${expectedYear}-${expectedMonth}-${expectedDay}`;

    // when
    const result = getTodayDate();

    // then
    expect(result).toBe(expected);
  });

  it("returns date in correct ISO format (YYYY-MM-DD)", () => {
    // when
    const result = getTodayDate();

    // then
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("getTomorrowDate", () => {
  it("returns tomorrow's date in ISO format", () => {
    // given
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const expectedYear = tomorrow.getFullYear();
    const expectedMonth = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const expectedDay = String(tomorrow.getDate()).padStart(2, "0");
    const expected = `${expectedYear}-${expectedMonth}-${expectedDay}`;

    // when
    const result = getTomorrowDate();

    // then
    expect(result).toBe(expected);
  });

  it("returns date in correct ISO format (YYYY-MM-DD)", () => {
    // when
    const result = getTomorrowDate();

    // then
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
