
import { createHash } from "node:crypto";
import { parseHunk } from "./amiga-hunk.js";
import { unpackHunkFile } from "./unpack.js";

const loaderIDsByHash: {[hash: string]: string} = {
  'ddf9a12877a328162cecef459d9765a5': 'ProLoader',
  '0dbe48a6071ec6beae4239d26e7e8309': 'ClassicLoader',
  '2680a6b417c606c6fb6d6235cb127e7f': 'ClassicLoader',
  '7fcfb0d746a79495e277d9d08adc5e24': 'ClassicLoader',
};

export function parseAmosExecutable(buf: Buffer) {
  let info = parseHunk(buf);
  info = unpackHunkFile(info);
  if (info.residentLibraries.length !== 0 || info.type !== 'complete') {
    throw new Error('invalid executable type')
  }
  const hunks: Buffer[] = [];
  for (let i = 0; i < info.hunks.length; i += 2) {
    const hunk = info.hunks[i]!;
    if (hunk.type === 'HUNK_CODE') {
      let data = hunk.data;
      if (is_hunk_squashed(data)) {
        data = unsquash_hunk(data);
      }
      hunks.push(data);
    }
    else {
      throw new Error('expected HUNK_CODE');
    }
    if (info.hunks[i+1]?.type !== 'HUNK_END') {
      throw new Error('expected HUNK_END after HUNK_CODE');
    }
  }
  if (hunks.length < 1) {
    throw new Error('not enough hunks');
  }
  const loaderHunk = hunks[0]!;
  const loaderHash = hashLoaderHunk(loaderHunk);
  const loaderID = loaderIDsByHash[loaderHash] ?? loaderHash;
  let mainHunk: Buffer, relocHunk: Buffer, dynamicLibHunk: Buffer | null, fixedLibHunk: Buffer | null, mouseAbkHunk: Buffer, defaultFontHunk: Buffer | null, defaultKeyHunk: Buffer | null;
  let environmentHunk: Buffer;
  let bankHunks: Buffer[];
  let defaultBankHunk: Buffer | null;
  let errorMessagesHunk: Buffer | null;
  let amosLibHunk: Buffer | null;
  let flags: number, pivot: number;
  let bankHeaderMode: 'classic' | 'pro';
  if (loaderID === 'ClassicLoader') {
    if (hunks.length < 8) {
      throw new Error('not enough hunks');
    }
    [, mainHunk, relocHunk, fixedLibHunk, environmentHunk, mouseAbkHunk, defaultFontHunk, defaultKeyHunk, ...bankHunks] = hunks as [Buffer, Buffer, Buffer, Buffer, Buffer, Buffer, Buffer, Buffer, ...Buffer[]];
    console.log(createHash('md5').update(fixedLibHunk).digest('hex'));
    defaultBankHunk = null;
    errorMessagesHunk = null;
    amosLibHunk = null;
    dynamicLibHunk = mainHunk;
    flags = loaderHunk.readUint16BE(2);
    pivot = -1;
    bankHeaderMode = 'classic';
  }
  else if (loaderID === 'ProLoader') {
    [, mainHunk, dynamicLibHunk, relocHunk, amosLibHunk, mouseAbkHunk, environmentHunk, defaultBankHunk, errorMessagesHunk, ...bankHunks] = hunks as [Buffer, Buffer, Buffer, Buffer, Buffer, Buffer, Buffer, Buffer, Buffer, ...Buffer[]];
    if (Buffer.compare(amosLibHunk, Buffer.from([0, 0, 0, 0])) === 0) {
      amosLibHunk = null;
    }
    fixedLibHunk = null;
    defaultFontHunk = null;
    defaultKeyHunk = null;
    flags = loaderHunk.readUint32BE(2);
    pivot = loaderHunk.readUint32BE(8);
    bankHeaderMode = 'pro';
  }
  else {
    throw new Error('unknown loader: ' + loaderID);
  }
  let relocPos = 0;
  const readRelocations = () => {
    const relocations: number[] = [];
    let offset = 0;
    while (relocPos < relocHunk.length && relocHunk[relocPos] !== 0) {
      if (relocHunk[relocPos] === 1) {
        offset += 508;
      }
      else {
        offset += 2 * relocHunk[relocPos]!;
        relocations.push(offset);
      }
      relocPos++;
    }
    relocPos++;
    return relocations;
  };
  const mainRelocations = readRelocations();
  const dynamicLibRelocations = dynamicLibHunk ? readRelocations() : [];
  const banks = bankHunks.map(v => {
    if (bankHeaderMode === 'classic') v = v.subarray(4);
    const bankID = v.toString('binary', 0, 4);
    if (bankID === 'AmSp') {
      return {
        type: 'sprites',
        data: v,
      };
    }
    if (bankID === 'AmIc') {
      return {
        type: 'icons',
        data: v,
      };
    }
    if (bankHeaderMode === 'classic') {
      const bankNumber = v.readUint16BE(0);
      const data = v.subarray(4);
      return {
        type: 'bank',
        bankNumber,
        flags: 0,
        data,
      }
    }
    const bankNumber = v.readUint32BE(0);
    const flags = v.readUint16BE(4);
    const data = v.subarray(8);
    return {
      type: 'bank',
      bankNumber,
      flags,
      data,
    }
  });
  return {
    loaderHunk,
    mainHunk,
    dynamicLibHunk,
    relocHunk,
    mainRelocations,
    dynamicLibRelocations,
    bankHunks,
    flags,
    pivot,
    loaderID,
    amosLibHunk,
    mouseAbkHunk,
    environmentHunk,
    defaultBankHunk,
    errorMessagesHunk,
    banks,
    fixedLibHunk,
    defaultFontHunk,
    defaultKeyHunk,
  };
}

function hashLoaderHunk(data: Buffer) {
  const copy = Buffer.from(data);
  if (data.length === 2888) {
    // blank the flags
    copy.writeUint32BE(0, 0x2);
    // blank the pivot
    copy.writeUint32BE(0, 0x8);
  }
  else if (data.length === 2764 || data.length === 2804 || data.length === 2292) {
    // blank the flags
    copy.writeUint16BE(0, 0x2);
  }
  return createHash('md5').update(copy).digest('hex');
}

function is_hunk_squashed(b: Buffer) {
  return b.length > 12 && b.toString('binary', 0, 4) === 'xVdg';
}

function unsquash_hunk(data: Buffer): Buffer {
  if (data.length < 12) throw new Error("Data too short");

  if (data.toString('binary', 0, 4) !== 'xVdg') {
    throw new Error('xVdg signature not found');    
  }

  const bufferSize = data.readUInt32BE(4);
  const compressedSize = data.readUInt32BE(8);

  const compressed = data.subarray(12, 12 + compressedSize);
  if (compressed.length < compressedSize) throw new Error("Truncated data");

  const decompressedSize = compressed.readUInt32BE(compressed.length - 4);

  const output = Buffer.alloc(bufferSize);
  let readPos = compressed.length;
  let writePos = decompressedSize;
  let checksum = 0;
  let bits = 0;

  const readLong = (): number => {
    if (readPos < 4) throw new Error("Read underflow");
    readPos -= 4;
    return compressed.readUInt32BE(readPos);
  };

  const getBit = (): number => {
    let carry = bits & 1;
    bits >>>= 1;
    if (bits === 0) {
      const newBits = readLong();
      checksum ^= newBits;
      carry = newBits & 1;
      bits = (newBits >>> 1) | 0x80000000;
    }
    return carry;
  };

  const readBits = (count: number): number => {
    let result = 0;
    for (let i = 0; i < count; i++) {
      let carry = bits & 1;
      bits >>>= 1;
      if (bits === 0) {
        const newBits = readLong();
        checksum ^= newBits;
        carry = newBits & 1;
        bits = (newBits >>> 1) | 0x80000000;
      }
      result = (result << 1) | carry;
    }
    return result;
  };

  const writeByte = (value: number): void => {
    if (--writePos < 0) throw new Error("Write underflow");
    output[writePos] = value & 0xff;
  };

  const copyBack = (offset: number, count: number): void => {
    for (let i = 0; i < count; i++) {
      if (--writePos < 0) throw new Error("Write underflow");
      const src = writePos + offset;
      if (src < 0 || src >= bufferSize) throw new Error("Back-ref out of bounds");
      output[writePos] = output[src]!;
    }
  };

  // Read trailer: decompressed size, checksum seed, initial bits
  readLong(); // decompressed size (already read above)
  checksum = readLong();
  bits = readLong();
  checksum ^= bits;

  // Main decompression loop
  while (writePos > 0) {
    if (getBit() === 0) {
      if (getBit() === 0) {
        // Literal bytes
        const count = readBits(3) + 1;
        for (let i = 0; i < count; i++) writeByte(readBits(8));
      } else {
        // Short back-ref: 8-bit offset, 2 bytes
        copyBack(readBits(8), 2);
      }
    } else {
      const mode = readBits(2);
      if (mode === 0) {
        copyBack(readBits(9), 3);
      } else if (mode === 1) {
        copyBack(readBits(10), 4);
      } else if (mode === 2) {
        // Extended back-ref: 8-bit count, 12-bit offset
        const count = readBits(8) + 1;
        copyBack(readBits(12), count);
      } else {
        // Extended literal run
        const count = readBits(8) + 9;
        for (let i = 0; i < count; i++) writeByte(readBits(8));
      }
    }
  }

  if (checksum !== 0) throw new Error(`Checksum failed: 0x${checksum.toString(16)}`);

  return output.subarray(0, decompressedSize);
}
