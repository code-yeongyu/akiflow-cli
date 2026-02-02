import { describe, it, expect } from "bun:test";
import { parseDuration } from "../../lib/duration-parser";

describe("parseDuration", () => {
  it("parses minutes", () => {
    // given
    const duration = "5m";

    // when
    const result = parseDuration(duration);

    // then
    expect(result).toBe(5 * 60 * 1000);
  });

  it("parses hours", () => {
    // given
    const duration = "1h";

    // when
    const result = parseDuration(duration);

    // then
    expect(result).toBe(60 * 60 * 1000);
  });

  it("parses multiple hours", () => {
    // given
    const duration = "2h";

    // when
    const result = parseDuration(duration);

    // then
    expect(result).toBe(2 * 60 * 60 * 1000);
  });

  it("parses days", () => {
    // given
    const duration = "1d";

    // when
    const result = parseDuration(duration);

    // then
    expect(result).toBe(24 * 60 * 60 * 1000);
  });

  it("parses multiple days", () => {
    // given
    const duration = "2d";

    // when
    const result = parseDuration(duration);

    // then
    expect(result).toBe(2 * 24 * 60 * 60 * 1000);
  });

  it("parses weeks", () => {
    // given
    const duration = "1w";

    // when
    const result = parseDuration(duration);

    // then
    expect(result).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("handles whitespace", () => {
    // given
    const duration = " 1h ";

    // when
    const result = parseDuration(duration);

    // then
    expect(result).toBe(60 * 60 * 1000);
  });

  it("throws for invalid format", () => {
    // given
    const duration = "invalid";

    // when
    const act = () => parseDuration(duration);

    // then
    expect(act).toThrow('Invalid duration format: "invalid"');
  });

  it("throws for missing number", () => {
    // given
    const duration = "h";

    // when
    const act = () => parseDuration(duration);

    // then
    expect(act).toThrow('Invalid duration format: "h"');
  });

  it("throws for invalid unit", () => {
    // given
    const duration = "1x";

    // when
    const act = () => parseDuration(duration);

    // then
    expect(act).toThrow('Invalid duration format: "1x"');
  });
});
