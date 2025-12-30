
export type bit = 0b0 | 0b1;
export const bit = (v: number, shift = 0) => ((v >>> shift) & 0b1) as bit;

export type bit_duo = 0b00 | 0b01 | 0b10 | 0b11;
export const bit_duo = (v: number, shift = 0) => ((v >>> shift) & 0b11) as bit_duo;

export type bit_trio = 0b000 | 0b001 | 0b010 | 0b011 | 0b100 | 0b101 | 0b110 | 0b111;
export const bit_trio = (v: number, shift = 0) => ((v >>> shift) & 0b111) as bit_trio;

export type nibble = (
  | 0b0000 | 0b0001 | 0b0010 | 0b0011 | 0b0100 | 0b0101 | 0b0110 | 0b0111
  | 0b1000 | 0b1001 | 0b1010 | 0b1011 | 0b1100 | 0b1101 | 0b1110 | 0b1111
);
export const nibble = (v: number, shift = 0) => ((v >>> shift) & 0b1111) as nibble;

export namespace Size {
  export const BYTE = 0b00;
  export type BYTE = typeof BYTE;
  export const WORD = 0b01;
  export type WORD = typeof WORD;
  export const LONG = 0b10;
  export type LONG = typeof LONG;
  export const NONE = 0b11;
  export type NONE = typeof NONE;
}
export type Size = Size.BYTE | Size.WORD | Size.LONG | Size.NONE;
