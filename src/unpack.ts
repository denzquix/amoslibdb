import { createHash } from "node:crypto";
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

  if (hf.hunks.length === 3
    && hf.hunks[0]!.type === "HUNK_CODE"
    && hf.hunks[0]!.data.length === 76
    && createHash('md5').update(hf.hunks[0]!.data).digest('hex') === '769130d87b9517f4ba90889f2a392dd9'
    && hf.hunks[1]!.type === "HUNK_CODE"
    && hf.hunks[1]!.data.length > 396
    && createHash('md5').update(hf.hunks[1]!.data.subarray(0, 396)).digest('hex') === 'cd6e1a62d3dfdc1a59d8a050a855b3ae'
    && hf.hunks[2]!.type === "HUNK_END"
  ) {

    const packed = hf.hunks[1]!.data.subarray(392);
    const unpacked = new StoneCrackerS404Decoder(packed).read();
    const newhunkfile = stonecrackedToHunkFile(unpacked);
    return parseHunk(newhunkfile);
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

class StoneCrackerS404Decoder {
  private readonly rawSize: number;
  private readonly eff: number;
  private readonly orgSrcPos: number;
  
  private srcWordPos: number;
  private bitBuf: number;
  private bitsInBuf: number;
  
  private out: Buffer;
  private dstPos: number;

  constructor(readonly packed: Buffer) {
    if (packed.length < 16) {
      throw new Error("S404: truncated header");
    }
    if (packed.toString('binary', 0, 4) !== "S404") {
      throw new Error("S404: wrong FourCC");
    }

    // Header (big-endian)
    // +0  : "S404"
    // +4  : security length (ignored for decoding)
    // +8  : raw size
    // +12 : packed length (excluding the 2-byte tail)
    this.rawSize = this.u32(8);
    const packedLen = this.u32(12);

    const payloadStart = 16;
    const tailOff = payloadStart + packedLen;
    const endOffExclusive = tailOff + 2;

    if (endOffExclusive > packed.length) {
      throw new Error("S404: truncated payload");
    }

    this.orgSrcPos = payloadStart;
    this.srcWordPos = tailOff;

    const bitCount = this.u16(this.srcWordPos) & 0x000f;
    this.srcWordPos -= 2;

    const valueWord = this.u16(this.srcWordPos);
    this.srcWordPos -= 2;

    this.eff = this.u16(this.srcWordPos);
    this.srcWordPos -= 2;
    if (this.eff < 10 || this.eff > 14) {
      throw new Error("S404: invalid eff/modeBits");
    }

    if (bitCount > 0) {
      this.bitBuf = (valueWord >>> (16 - bitCount)) >>> 0;
      this.bitsInBuf = bitCount;
    }
    else {
      this.bitBuf = 0;
      this.bitsInBuf = 0;
    }

    this.out = Buffer.alloc(this.rawSize);
    this.dstPos = this.rawSize;
  }

  private u16(off: number): number {
    return this.packed.readUInt16BE(off);
  }

  private u32(off: number): number {
    return this.packed.readUInt32BE(off);
  }

  private refill16(): void {
    if (this.srcWordPos < this.orgSrcPos) throw new Error("S404: input underrun");
    const w = this.u16(this.srcWordPos);
    this.srcWordPos -= 2;
    this.bitBuf = ((this.bitBuf << 16) | w) >>> 0;
    this.bitsInBuf += 16;
  }

  private getBits(nbits: number): number {
    if (nbits <= 0 || nbits > 16) throw new Error("S404: bad bit request");

    while (this.bitsInBuf < nbits) this.refill16();

    const shift = this.bitsInBuf - nbits;
    const mask = (1 << nbits) - 1;
    const out = (this.bitBuf >>> shift) & mask;

    this.bitsInBuf -= nbits;
    if (this.bitsInBuf === 0) {
      this.bitBuf = 0;
    }
    else {
      this.bitBuf &= (1 << this.bitsInBuf) - 1;
    }
    return out;
  }

  private writeByteBack(b: number): void {
    if (this.dstPos <= 0) {
      throw new Error("S404: output overrun");
    }
    this.out[--this.dstPos] = b & 0xff;
  }

  private copyBack(len: number, distPlus1: number): void {
    if (len < 0) {
      throw new Error("S404: bad length");
    }
    if (distPlus1 <= 0) {
      throw new Error("S404: bad distance");
    }
    if (len > this.dstPos) {
      throw new Error("S404: token overruns output");
    }

    for (let i = 0; i < len; i++) {
      const d = this.dstPos - 1;
      const s = d + distPlus1;
      if (d < 0) {
        throw new Error("S404: output underrun");
      }
      if (s >= this.rawSize) {
        throw new Error("S404: copy out of range");
      }
      this.out[d] = this.out[s]!;
      this.dstPos--;
    }
  }

  private decodeDistLongFromLowBits(lowBits: number, extraBits: number): number {
    const v = (lowBits << extraBits) | this.getBits(extraBits);
    return v + 544;
  }

  read(): Buffer {
    if (this.rawSize === 0) return Buffer.alloc(0);

    while (this.dstPos > 0) {
      const prefix9 = this.getBits(9);

      // 0 + 8 bits: literal single byte
      if (prefix9 < 0x100) {
        this.writeByteBack(prefix9);
        continue;
      }

      // 10011111x + 4 bits: literal run length 14..45
      if (prefix9 === 0x13e || prefix9 === 0x13f) {
        const w = (prefix9 << 4) | this.getBits(4);
        let len = (w & 0x1f) + 14;
        if (len > this.dstPos) {
          throw new Error("S404: literal run overruns output");
        }
        while (len-- > 0) {
          this.writeByteBack(this.getBits(8));
        }
        continue;
      }

      // Match token
      let len: number;
      let dist: number;

      if (prefix9 >= 0x180) {
        // copy 2..3
        len = (prefix9 & 0x40) ? 3 : 2;

        if (prefix9 & 0x20) {
          dist = this.decodeDistLongFromLowBits(prefix9 & 0x1f, this.eff - 5);
        }
        else if (prefix9 & 0x30) {
          dist = ((prefix9 & 0x0f) << 1) | this.getBits(1);
        }
        else {
          dist = (((prefix9 & 0x0f) << 5) | this.getBits(5)) + 32;
        }
      }
      else if (prefix9 >= 0x140) {
        // copy 4..7
        len = ((prefix9 & 0x30) >>> 4) + 4;

        if (prefix9 & 0x08) {
          dist = this.decodeDistLongFromLowBits(prefix9 & 0x07, this.eff - 3);
        }
        else if (prefix9 & 0x0c) {
          dist = ((prefix9 & 0x03) << 3) | this.getBits(3);
        }
        else {
          dist = (((prefix9 & 0x03) << 7) | this.getBits(7)) + 32;
        }
      }
      else if (prefix9 >= 0x120) {
        // copy 8..22
        len = ((prefix9 & 0x1e) >>> 1) + 8;

        if (prefix9 & 0x01) {
          dist = this.getBits(this.eff) + 544;
        }
        else {
          const t6 = this.getBits(6);
          if (t6 & 0x20) {
            dist = t6 & 0x1f;
          }
          else {
            dist = ((t6 << 4) | this.getBits(4)) + 32;
          }
        }
      }
      else {
        // copy 23+ (variable length extension)
        let w = ((prefix9 & 0x1f) << 3) | this.getBits(3);
        len = 23;
        while (w === 0xff) {
          len += w;
          w = this.getBits(8);
        }
        len += w;

        const d7 = this.getBits(7);
        if (d7 & 0x40) {
          dist = this.decodeDistLongFromLowBits(d7 & 0x3f, this.eff - 6);
        }
        else if (d7 & 0x20) {
          dist = d7 & 0x1f;
        }
        else {
          dist = ((d7 << 4) | this.getBits(4)) + 32;
        }
      }

      this.copyBack(len, dist + 1);
    }

    return this.out;
  }
}

function stonecrackedToHunkFile(buf: Buffer) {
  const hunkCount = buf.readUint32BE(0) + 1;
  const hunkSizes = Array.from({length:hunkCount}, (_, i) => buf.readUint32BE(4 + i*4));
  let pos = 4 + hunkCount*4;
  const hunks = Array.from({length:hunkCount}, (_,i) => {
    if ((pos + 4) > buf.length) {
      throw new Error('invalid hunk data');
    }
    const type = buf.readUint16BE(pos);
    const size = buf.readUint16BE(pos + 2) * 4;
    if ((pos + 4 + size) > buf.length) {
      throw new Error('invalid hunk data');
    }
    const data = buf.subarray(pos + 4, pos + 4 + size);
    pos += 4 + size;
    return {type, data, length:hunkSizes[i]!};
  });
  if (pos+2 !== buf.length || buf.readUint16BE(pos) !== 0xffff) {
    throw new Error('invalid hunk data');
  }


  const buffers: Buffer[] = [];

  // HUNK_HEADER ($3F3)
  const headerBuf = Buffer.alloc(20 + hunks.length * 4);
  let offset = 0;

  headerBuf.writeUInt32BE(0x3f3, offset); // HUNK_HEADER
  offset += 4;

  headerBuf.writeUInt32BE(0, offset); // No resident library names
  offset += 4;

  headerBuf.writeUInt32BE(hunks.length, offset); // Number of hunks
  offset += 4;

  headerBuf.writeUInt32BE(0, offset); // First hunk to load
  offset += 4;

  headerBuf.writeUInt32BE(hunks.length - 1, offset); // Last hunk to load
  offset += 4;

  // Hunk sizes (with memory flags from type word)
  for (const hunk of hunks) {
    // Length is already in longwords
    // Preserve any memory flags that might be in the upper bits of length
    headerBuf.writeUInt32BE(hunk.length, offset);
    offset += 4;
  }

  buffers.push(headerBuf);

  // Each hunk's content
  for (const hunk of hunks) {
    const typeWord = hunk.type;

    // Check if bit 14 is set (Code or Data hunk)
    if (!(typeWord & 0x4000)) {
      if (typeWord === 0) {
        throw new Error("NYI: BSS hunks and relocations not yet implemented");
      }
      throw new Error(`NYI: Unknown hunk type word: 0x${typeWord.toString(16)}`);
    }

    // Bit 15 set = DATA ($3EA), clear = CODE ($3E9)
    const hunkType = typeWord & 0x8000 ? 0x3ea : 0x3e9;

    // Size in longwords from the data buffer
    const sizeInLongwords = hunk.data.length / 4;

    const hunkHeader = Buffer.alloc(8);
    hunkHeader.writeUInt32BE(hunkType, 0);
    hunkHeader.writeUInt32BE(sizeInLongwords, 4);
    buffers.push(hunkHeader);

    buffers.push(hunk.data);

    // HUNK_END ($3F2)
    const endBuf = Buffer.alloc(4);
    endBuf.writeUInt32BE(0x3f2, 0);
    buffers.push(endBuf);
  }

  return Buffer.concat(buffers);  
}
