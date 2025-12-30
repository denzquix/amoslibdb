import type MnemonicCode from "../mnemonic.js";
import { Size } from "../util.js";

const used = new Set<number>();

const IC = (mnemonicCode: MnemonicCode, size: Size = Size.NONE, extensionWords: 0 | 1 | 2 = 0, overload: 0 | 1 | 2 | 3 | 4 | 5 = 0) => {
  const instructionCode = (overload << 12) | (extensionWords << 10) | (size << 8) | mnemonicCode;
  if (used.has(instructionCode)) {
    throw new Error('duplicate instruction code');
  }
  used.add(instructionCode);
  return instructionCode;
};

export default IC;
