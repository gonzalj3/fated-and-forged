export type ZodiacSign = "Aries" | "Taurus" | "Gemini" | "Cancer" | "Leo" | "Virgo" | "Libra" | "Scorpio" | "Sagittarius" | "Capricorn" | "Aquarius" | "Pisces";

const zodiacStarts: Array<[month: number, day: number, sign: ZodiacSign]> = [
  [1, 20, "Aquarius"], [2, 19, "Pisces"], [3, 21, "Aries"],
  [4, 20, "Taurus"], [5, 21, "Gemini"], [6, 21, "Cancer"],
  [7, 23, "Leo"], [8, 23, "Virgo"], [9, 23, "Libra"],
  [10, 23, "Scorpio"], [11, 22, "Sagittarius"], [12, 22, "Capricorn"],
];

export function zodiacForDate(date: string): ZodiacSign {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return "Capricorn";
  const month = Number(match[2]);
  const day = Number(match[3]);
  let sign: ZodiacSign = "Capricorn";
  for (const [startMonth, startDay, candidate] of zodiacStarts) {
    if (month > startMonth || (month === startMonth && day >= startDay)) sign = candidate;
  }
  return sign;
}
