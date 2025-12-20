
const HUNK_CODE = 0x3E9;
const HUNK_END = 0x3F2;

export function parseHunk(buf: Buffer) {
  let pos = 0;
  const u32be = () => { const v = buf.readUint32BE(pos); pos += 4; return v; };
  const bytes = (n: number) => { const b = buf.subarray(pos, pos + n); pos += n; return b; }
  const hunkstr = () => bytes(u32be()).toString('binary').replace(/\0+$/, '');

  if (u32be() !== 0x000003F3) {
    throw new Error('not a hunk file');
  }

  const residentLibraries: string[] = [];

  for (let residentLibrary = hunkstr(); residentLibrary !== ''; residentLibrary = hunkstr()) {
    residentLibraries.push(residentLibrary);
  }
  if (residentLibraries.length !== 0) {
    throw new Error('resident library list is nonempty');
  }

  const tableSize = u32be();
  const firstHunk = u32be();
  const lastHunk = u32be();
  const hunkSizes = Array.from({length: lastHunk + 1 - firstHunk}, () => { const v = u32be(); return {len:(v & (-1 >>> 2)) * 4, flags:(v >>> 30)} });

  function *eachHunk() {
    while (pos < buf.length) {
      const hunkType = u32be() & (-1 >>> 3); // mask off the top 3 bits
      switch (hunkType) {
        case HUNK_CODE: {
          yield {type:'HUNK_CODE' as const, data:bytes(u32be() * 4)};
          break;
        }
        case HUNK_END: {
          yield {type:'HUNK_END' as const};
          break;
        }
        default: {
          throw new Error('unknown hunk type: ' + hunkType.toString(16));
        }
      }
    }
  }

  const hunks = [...eachHunk()];

  return {
    residentLibraries,
    hunks,
  };
}

export type Hunk = ReturnType<typeof parseHunk>['hunks'][0];
