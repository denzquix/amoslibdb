import { parseHunk, type HunkFile } from "./amiga-hunk.js";

export function unpackHunkFile(hf: HunkFile): HunkFile {
  if (hf.type !== 'complete') {
    return hf;
  }

  if (hf.hunks.length === 4
  && hf.hunks[0]!.type === "HUNK_CODE"
  && hf.hunks[0]!.data.length === 632
  && hf.hunks[1]!.type === "HUNK_END"
  && hf.hunks[2]!.type === "HUNK_DATA"
  && hf.hunks[3]!.type === "HUNK_END") {
    const header = hf.hunks[0]!.data, payload = hf.hunks[2]!.data;
    const compressedLen = header.readUint32BE(0x20);
    if (compressedLen >= 4 && compressedLen <= payload.length) {
      const bitTable = [...header.subarray(0x26c, 0x270)] as [number, number, number, number];
      const pp = new PowerPackerDecoder(hf.hunks[2]!.data, bitTable);
      const unpacked = pp.read();
      return parseHunk(unpacked);
    }
  }

  if (hf.hunks.length === 4
  && hf.hunks[0]!.type === "HUNK_CODE"
  && hf.hunks[0]!.data.length === 548
  && hf.hunks[1]!.type === "HUNK_END"
  && hf.hunks[2]!.type === "HUNK_DATA"
  && hf.hunks[3]!.type === "HUNK_END") {
    const header = hf.hunks[0]!.data, payload = hf.hunks[2]!.data;
    const compressedLen = header.readUint32BE(0x20);
    if (compressedLen >= 4 && compressedLen <= payload.length) {
      const bitTable = [...header.subarray(540, 544)] as [number, number, number, number];
      const pp = new PowerPackerDecoder(hf.hunks[2]!.data, bitTable);
      const unpacked = pp.read();
      return parseHunk(unpacked);
    }
  }

  return hf;
}

class PowerPackerDecoder {
  constructor(readonly buf: Buffer, readonly offsetBitsTable: [number, number, number, number]) {
    if (buf.length%4 !== 0) {
      throw new Error('buffer length must be divisible by 4');
    }
    if (buf.length < 8) {
      throw new Error('buffer not long enough');
    }
    let pos = buf.length - 4;
    const initValues = buf.readUint32BE(pos);
    this.unpackedLength = initValues >>> 8;
    const skipBits = initValues & 0xff;
    if (skipBits >= 32) {
      throw new Error('invalid skip bits value');
    }
    this.pos = pos - 4;
    this.bitBuffer = this.buf.readUint32BE(this.pos) >>> skipBits;
    this.bitCount = 32 - skipBits;
  }
  bitBuffer: number;
  bitCount: number;
  pos: number;
  unpackedLength: number;
  refill() {
    if (this.pos < 4) {
      throw new Error('out of bits');
    }
    this.pos -= 4;
    this.bitBuffer = this.buf.readUint32BE(this.pos);
    this.bitCount = 32;
  }
  private getBit() {
    if (this.bitCount === 0) {
      this.refill();
    }
    const bit = (this.bitBuffer & 1) as (0 | 1);
    this.bitBuffer >>>= 1;
    this.bitCount--;
    return bit;
  }
  readBit() {
    return this.readBits(1) as 0|1;
  }
  readBits(nbits: number) {
    let bits = 0;
    for (let i = 0; i < nbits; i++) {
      bits = (bits << 1) | this.getBit();
    }
    return bits;
  }
  eof() {
    return this.bitCount === 0 && this.pos === 0;
  }
  read() {
    const buf = Buffer.alloc(this.unpackedLength);
    let ptr = buf.length;
    while (ptr > 0) {
      if (this.readBit() === 0) {
        const count = this.readVarLengthInt(2, 1);
        if ((ptr - count) < 0) {
          throw new Error('buffer overrun');
        }
        for (let byte_i = 0; byte_i < count; byte_i++) {
          buf[--ptr] = this.readBits(8);
        }
      }
      if (ptr > 0) {
        const matchMode = this.readBits(2) as 0 | 1 | 2 | 3;
        let length: number, offset: number;
        if (matchMode === 3) {
          const offsetBits = this.readBit() === 0 ? 7 : this.offsetBitsTable[matchMode];
          offset = this.readBits(offsetBits);
          length = this.readVarLengthInt(3, 5);
        }
        else {
          const offsetBits = this.offsetBitsTable[matchMode];
          offset = this.readBits(offsetBits);
          length = matchMode + 2;
        }
        if ((ptr - length) < 0) {
          throw new Error('buffer overrun');
        }
        if ((ptr + offset) > buf.length) {
          throw new Error('match out of range');
        }
        for (let byte_i = 0; byte_i < length; byte_i++) {
          buf[ptr - 1] = buf[ptr + offset]!
          ptr--;
        }
      }
    }
    return buf;
  }
  private readVarLengthInt(nbits: number, baseValue: number) {
    let length = baseValue;
    const allBits = (1 << nbits)-1;
    let add: number;
    do {
      length += (add = this.readBits(nbits));
    } while (add === allBits);
    return length;
  }
}
