
const HUNK_CODE = 0x3E9;
const HUNK_END = 0x3F2;
const HUNK_DATA = 0x3EA;

export type Hunk = (
  | {type:'HUNK_CODE', data:Buffer}
  | {type:'HUNK_DATA', data:Buffer}
  | {type:'HUNK_END'}
);

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

  const totalHunkCount = u32be();
  const firstHunk = u32be();
  const lastHunk = u32be();
  if (lastHunk < firstHunk || (lastHunk+1) > totalHunkCount) {
    throw new Error('invalid hunk configuration');
  }
  const localHunkCount = lastHunk + 1 - firstHunk;
  const allHunkSizes = Array.from({length: totalHunkCount}, () => { const v = u32be(); return {len:(v & (-1 >>> 2)) * 4, flags:(v >>> 30)} });

  const hunks: Hunk[] = [];
  while (pos < buf.length) {
    const hunkType = u32be() & (-1 >>> 3); // mask off the top 3 bits
    switch (hunkType) {
      case HUNK_CODE: {
        hunks.push({type:'HUNK_CODE' as const, data:bytes(u32be() * 4)});
        break;
      }
      case HUNK_DATA: {
        hunks.push({type:'HUNK_DATA' as const, data:bytes(u32be() * 4)});
        break;
      }
      case HUNK_END: {
        hunks.push({type:'HUNK_END' as const});
        break;
      }
      default: {
        throw new Error('unknown hunk type: ' + hunkType.toString(16));
      }
    }
  }

  if (localHunkCount === totalHunkCount) {
    return {
      type: 'complete' as const,
      residentLibraries,
      hunks,
      allHunkSizes,
    };
  }
  else {
    return {
      type: 'partial' as const,
      residentLibraries,
      hunks,
      firstHunkOffset: firstHunk,
      allHunkSizes,
    };
  }
}

export type HunkFile = ReturnType<typeof parseHunk>;
