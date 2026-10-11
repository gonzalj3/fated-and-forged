function readAscii(view: DataView, start: number, length: number) {
  let value = "";
  for (let index = 0; index < length; index += 1) {
    const code = view.getUint8(start + index);
    if (code === 0) break;
    value += String.fromCharCode(code);
  }
  return value;
}

function normalizeExifDate(value: string) {
  const match = value.match(/^(\d{4}):(\d{2}):(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

export function extractExifDate(buffer: ArrayBuffer) {
  const view = new DataView(buffer);
  if (view.byteLength < 12 || view.getUint16(0) !== 0xffd8) return null;

  let markerOffset = 2;
  while (markerOffset + 4 < view.byteLength) {
    const marker = view.getUint16(markerOffset);
    const segmentLength = view.getUint16(markerOffset + 2);
    if (marker === 0xffe1 && readAscii(view, markerOffset + 4, 6) === "Exif") {
      const tiffOffset = markerOffset + 10;
      const littleEndian = view.getUint16(tiffOffset) === 0x4949;
      const getUint16 = (offset: number) => view.getUint16(offset, littleEndian);
      const getUint32 = (offset: number) => view.getUint32(offset, littleEndian);
      const readIfd = (ifdOffset: number) => {
        const values = new Map<number, string | number>();
        const entries = getUint16(ifdOffset);
        for (let index = 0; index < entries; index += 1) {
          const entry = ifdOffset + 2 + index * 12;
          if (entry + 12 > view.byteLength) break;
          const tag = getUint16(entry);
          const type = getUint16(entry + 2);
          const count = getUint32(entry + 4);
          if (type === 2 && count > 0) {
            const valueOffset = count <= 4 ? entry + 8 : tiffOffset + getUint32(entry + 8);
            if (valueOffset + count <= view.byteLength) values.set(tag, readAscii(view, valueOffset, count));
          } else if (type === 4 && count === 1) {
            values.set(tag, getUint32(entry + 8));
          }
        }
        return values;
      };

      const ifd0 = readIfd(tiffOffset + getUint32(tiffOffset + 4));
      const exifPointer = ifd0.get(0x8769);
      const exif = typeof exifPointer === "number" ? readIfd(tiffOffset + exifPointer) : new Map<number, string | number>();
      const captured = exif.get(0x9003) || exif.get(0x9004) || ifd0.get(0x0132);
      return typeof captured === "string" ? normalizeExifDate(captured) : null;
    }
    if (segmentLength < 2) break;
    markerOffset += 2 + segmentLength;
  }
  return null;
}
