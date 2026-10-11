type MemoryPromptInput = {
  material: string;
  jewelryType: string;
  memory: string;
  visualDescription: string;
  capturedAt: string;
  capturedTime: string;
  timezoneOffset: string;
  latitude: number;
  longitude: number;
  palette: string[];
};

function excerpt(value: string, maxLength: number) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1).replace(/\s+\S*$/, "")}…`;
}

export function buildMemoryPrompt(input: MemoryPromptInput) {
  const memory = excerpt(input.memory, 280);
  const vision = excerpt(input.visualDescription, 280);
  return [
    `Design a refined, manufacturable ${input.material} ${input.jewelryType} as an intimate everyday keepsake.`,
    `Memory: ${memory}.`,
    vision ? `Photo scene: ${vision}.` : "",
    `Moment: ${input.capturedAt} ${input.capturedTime} ${input.timezoneOffset} at ${input.latitude.toFixed(4)}, ${input.longitude.toFixed(4)}. Encode its real night sky subtly through engraving, stone count, spacing, or geometry.`,
    `Palette: ${input.palette.join(", ")}. Use it for gemstone and finish inspiration.`,
    "Translate the scene's subjects, mood, shapes, and meaningful objects into subtle motifs. Avoid literal reproduction. Make it elegant, durable, and wearable.",
  ].filter(Boolean).join(" ").slice(0, 1_000);
}
