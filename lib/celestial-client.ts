type CelestialApi = {
  display: (config: Record<string, unknown>) => void;
  skyview: (config: { date: Date; location: [number, number]; timezone: number }) => void;
};

declare global {
  interface Window {
    Celestial?: CelestialApi;
  }
}

const scripts = [
  "/celestial/d3.min.js",
  "/celestial/d3.geo.projection.min.js",
  "/celestial/celestial.min.js",
];

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing?.dataset.loaded === "true") return resolve();
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Could not load ${src}`)), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.addEventListener("load", () => { script.dataset.loaded = "true"; resolve(); }, { once: true });
    script.addEventListener("error", () => reject(new Error(`Could not load ${src}`)), { once: true });
    document.head.appendChild(script);
  });
}

let celestialPromise: Promise<CelestialApi> | null = null;

export function loadCelestial() {
  if (window.Celestial) return Promise.resolve(window.Celestial);
  if (!celestialPromise) {
    celestialPromise = scripts.reduce((chain, src) => chain.then(() => loadScript(src)), Promise.resolve())
      .then(() => {
        if (!window.Celestial) throw new Error("D3-Celestial did not initialize");
        return window.Celestial;
      });
  }
  return celestialPromise;
}

export function timezoneOffsetMinutes(offset: string) {
  const match = offset.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!match) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === "-" ? -minutes : minutes;
}

export function skyDate(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

export function displayHistoricalSky(celestial: CelestialApi, input: {
  container: string;
  date: string;
  time: string;
  timezoneOffset: string;
  latitude: number;
  longitude: number;
}) {
  celestial.display({
    container: input.container,
    datapath: "/celestial/data/",
    projection: "airy",
    transform: "equatorial",
    follow: "zenith",
    geopos: [input.latitude, input.longitude],
    interactive: false,
    controls: false,
    form: false,
    disableAnimations: true,
    settimezone: false,
    stars: {
      show: true,
      limit: 6,
      colors: false,
      style: { fill: "#fff8e8", opacity: 1 },
      designation: false,
      propername: false,
      size: 6,
      exponent: -0.28,
      data: "stars.6.json",
    },
    dsos: { show: false, names: false, data: "dsos.bright.json" },
    constellations: {
      show: true,
      names: true,
      namesType: "desig",
      nameStyle: { fill: "#d7ac68", align: "center", baseline: "middle", opacity: 0.8, font: "10px Georgia, serif" },
      lines: true,
      lineStyle: { stroke: "#d7ac68", width: 1, opacity: 0.55 },
      bounds: false,
    },
    mw: { show: true, style: { fill: "#f8f0e7", opacity: 0.08 } },
    lines: {
      graticule: { show: false, stroke: "#d7ac68", width: 0.4, opacity: 0.2, lon: { pos: [] }, lat: { pos: [] } },
      equatorial: { show: false },
      ecliptic: { show: false },
      galactic: { show: false },
      supergalactic: { show: false },
    },
    background: { fill: "#1e0812", opacity: 1, stroke: "#8a5267", width: 1 },
    horizon: { show: true, stroke: "#d7ac68", width: 0.7, fill: "#12050b", opacity: 0.35 },
    daylight: { show: false },
    planets: { show: true, names: false, symbolType: "disk" },
  });
  celestial.skyview({
    date: skyDate(input.date, input.time),
    location: [input.latitude, input.longitude],
    timezone: timezoneOffsetMinutes(input.timezoneOffset),
  });
}
