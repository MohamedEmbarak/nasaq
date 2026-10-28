// @vitest-environment node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import {
  getCalendarDateParts,
  convertCalendarDate,
  getCalendarMonth,
} from "../src/index.js";

const oracle = JSON.parse(
  readFileSync(
    new URL("./fixtures/ummalqura-oracle.json", import.meta.url),
    "utf8",
  ),
) as {
  from: string;
  through: string;
  days: number;
  conversionSHA256: string;
};

it("matches the pinned independent Python oracle for every supported day and reverse conversion", () => {
  const hash = createHash("sha256");
  const first = Date.parse(`${oracle.from}T00:00:00Z`);
  let last = "";
  for (let offset = 0; offset < oracle.days; offset++) {
    const iso = new Date(first + offset * 86400000).toISOString().slice(0, 10);
    const parts = getCalendarDateParts(iso, "islamic-umalqura");
    hash.update(`${iso}|${parts.year}-${parts.month}-${parts.day}\n`);
    const roundtrip = convertCalendarDate(parts, "islamic-umalqura");
    if (roundtrip !== iso)
      throw new Error(
        `Calendar reverse conversion ${iso} produced ${roundtrip}`,
      );
    last = iso;
  }
  expect(last).toBe(oracle.through);
  expect(hash.digest("hex")).toBe(oracle.conversionSHA256);
}, 30000);

it("keeps historical and future month labels consistent with the reference rather than host ICU", () => {
  expect(getCalendarDateParts("1995-03-25", "islamic-umalqura")).toEqual({
    year: 1415,
    month: 10,
    day: 24,
  });
  expect(getCalendarDateParts("2029-08-11", "islamic-umalqura")).toEqual({
    year: 1451,
    month: 4,
    day: 1,
  });
  const month = getCalendarMonth({
    calendar: "islamic-umalqura",
    month: "2029-08-11",
    locale: "en-GB",
  });
  expect(month.days.find((d) => d.value === "2029-08-11")).toMatchObject({
    label: "1",
    outside: false,
  });
  expect(month.label).toContain("1451");
});
