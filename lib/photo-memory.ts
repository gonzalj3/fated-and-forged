export type PhotoMetadata = {
  capturedAt: string | null;
  date: string | null;
  timezoneOffset: string | null;
  latitude: number | null;
  longitude: number | null;
};

type ExifValue = string | number | number[];

function isInBounds(view: DataView, start: number, length = 1) {
  return start >= 0 && length >= 0 && start + length <= view.byteLength;
}

function readAscii(view: DataView, start: number, length: number) {
  if (!isInBounds(view, start, length)) return "";
  let value = "";
  for (let index = 0; index < length; index += 1) {
    const code = view.getUint8(start + index);
    if (code === 0) break;
    value += String.fromCharCode(code);
  }
  return value.trim();
}

function normalizeExifTimestamp(value: string) {
  const match = value.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}` : null;
}

function normalizeOffset(value: string) {
  const match = value.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[2]);
  const minutes = Number(match[3]);
  return hours <= 14 && minutes <= 59 ? `${match[1]}${match[2]}:${match[3]}` : null;
}

function gpsCoordinate(value: ExifValue | undefined, reference: ExifValue | undefined) {
  if (!Array.isArray(value) || value.length < 3 || typeof reference !== "string") return null;
  const coordinate = value[0] + value[1] / 60 + value[2] / 3600;
  if (!Number.isFinite(coordinate)) return null;
  return /^[SW]$/i.test(reference) ? -coordinate : coordinate;
}

export function extractPhotoMetadata(buffer: ArrayBuffer): PhotoMetadata {
  const empty: PhotoMetadata = { capturedAt: null, date: null, timezoneOffset: null, latitude: null, longitude: null };
  const view = new DataView(buffer);
  if (view.byteLength < 12 || view.getUint16(0) !== 0xffd8) return empty;

  let markerOffset = 2;
  while (markerOffset + 4 <= view.byteLength) {
    if (view.getUint8(markerOffset) !== 0xff) break;
    const marker = view.getUint16(markerOffset);
    if (marker === 0xffda || marker === 0xffd9) break;
    const segmentLength = view.getUint16(markerOffset + 2);
    if (segmentLength < 2 || !isInBounds(view, markerOffset + 2, segmentLength)) break;

    if (marker === 0xffe1 && readAscii(view, markerOffset + 4, 6) === "Exif") {
      const tiffOffset = markerOffset + 10;
      if (!isInBounds(view, tiffOffset, 8)) return empty;
      const byteOrder = view.getUint16(tiffOffset);
      if (byteOrder !== 0x4949 && byteOrder !== 0x4d4d) return empty;
      const littleEndian = byteOrder === 0x4949;
      const getUint16 = (offset: number) => isInBounds(view, offset, 2) ? view.getUint16(offset, littleEndian) : null;
      const getUint32 = (offset: number) => isInBounds(view, offset, 4) ? view.getUint32(offset, littleEndian) : null;
      if (getUint16(tiffOffset + 2) !== 42) return empty;

      const readIfd = (relativeOffset: number | null) => {
        const values = new Map<number, ExifValue>();
        if (relativeOffset === null) return values;
        const ifdOffset = tiffOffset + relativeOffset;
        const entries = getUint16(ifdOffset);
        if (entries === null) return values;

        for (let index = 0; index < entries; index += 1) {
          const entry = ifdOffset + 2 + index * 12;
          if (!isInBounds(view, entry, 12)) break;
          const tag = getUint16(entry);
          const type = getUint16(entry + 2);
          const count = getUint32(entry + 4);
          const offsetValue = getUint32(entry + 8);
          if (tag === null || type === null || count === null || offsetValue === null || count === 0) continue;

          const typeSize = type === 1 || type === 2 || type === 7 ? 1 : type === 3 ? 2 : type === 4 || type === 9 ? 4 : type === 5 || type === 10 ? 8 : 0;
          if (!typeSize) continue;
          const byteLength = count * typeSize;
          const valueOffset = byteLength <= 4 ? entry + 8 : tiffOffset + offsetValue;
          if (!isInBounds(view, valueOffset, byteLength)) continue;

          if (type === 2) {
            values.set(tag, readAscii(view, valueOffset, count));
          } else if (type === 3 && count === 1) {
            values.set(tag, view.getUint16(valueOffset, littleEndian));
          } else if (type === 4 && count === 1) {
            values.set(tag, view.getUint32(valueOffset, littleEndian));
          } else if (type === 5) {
            const rationals: number[] = [];
            for (let item = 0; item < count; item += 1) {
              const numerator = view.getUint32(valueOffset + item * 8, littleEndian);
              const denominator = view.getUint32(valueOffset + item * 8 + 4, littleEndian);
              rationals.push(denominator ? numerator / denominator : 0);
            }
            values.set(tag, rationals);
          }
        }
        return values;
      };

      const ifd0 = readIfd(getUint32(tiffOffset + 4));
      const exifPointer = ifd0.get(0x8769);
      const gpsPointer = ifd0.get(0x8825);
      const exif = readIfd(typeof exifPointer === "number" ? exifPointer : null);
      const gps = readIfd(typeof gpsPointer === "number" ? gpsPointer : null);
      const timestampValue = exif.get(0x9003) || exif.get(0x9004) || ifd0.get(0x0132);
      const offsetValue = exif.get(0x9011) || exif.get(0x9012) || exif.get(0x9010);
      const capturedAt = typeof timestampValue === "string" ? normalizeExifTimestamp(timestampValue) : null;
      const latitude = gpsCoordinate(gps.get(0x0002), gps.get(0x0001));
      const longitude = gpsCoordinate(gps.get(0x0004), gps.get(0x0003));

      return {
        capturedAt,
        date: capturedAt?.slice(0, 10) || null,
        timezoneOffset: typeof offsetValue === "string" ? normalizeOffset(offsetValue) : null,
        latitude: latitude !== null && Math.abs(latitude) <= 90 ? latitude : null,
        longitude: longitude !== null && Math.abs(longitude) <= 180 ? longitude : null,
      };
    }
    markerOffset += 2 + segmentLength;
  }
  return empty;
}

export function extractExifDate(buffer: ArrayBuffer) {
  return extractPhotoMetadata(buffer).date;
}
