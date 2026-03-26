import { describe, it, expect } from "vitest";
import { formatMarketCap } from "./format";

describe("formatMarketCap", () => {
  it("formats trillions", () => {
    expect(formatMarketCap(3.64e12)).toBe("$3.64T");
  });

  it("formats billions", () => {
    expect(formatMarketCap(500e9)).toBe("$500.00B");
  });

  it("formats millions", () => {
    expect(formatMarketCap(1.5e6)).toBe("$1.50M");
  });

  it("formats values below 1M as plain currency", () => {
    expect(formatMarketCap(999000)).toBe("$999,000");
  });

  it("formats zero", () => {
    expect(formatMarketCap(0)).toBe("$0");
  });

  it("handles exact boundary of 1T", () => {
    expect(formatMarketCap(1e12)).toBe("$1.00T");
  });

  it("handles exact boundary of 1B", () => {
    expect(formatMarketCap(1e9)).toBe("$1.00B");
  });

  it("handles exact boundary of 1M", () => {
    expect(formatMarketCap(1e6)).toBe("$1.00M");
  });
});
