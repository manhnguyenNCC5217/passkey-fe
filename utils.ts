// LICENSE: https://gist.github.com/kawanet/352a2ed1d1656816b2bc
export function string2Buffer(src: string) {
  return new Uint16Array([...src].map((c) => c.charCodeAt(0))).buffer;
}

export function buffer2String(buf: ArrayBuffer) {
  return String.fromCharCode(...new Uint16Array(buf));
}

export function largeBuffer2String(buf: ArrayBuffer) {
  const tmp = [];
  const len = 1024;
  for (let p = 0; p < buf.byteLength; p += len) {
    tmp.push(buffer2String(buf.slice(p, p + len)));
  }

  return tmp.join("");
}
