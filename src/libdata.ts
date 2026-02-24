import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export type LibMatchOp = (
  | ['skip', number]
  | ['match', string]
  | 'pop'
  | 'push'
  | 'tail-call'
  | 'follow-abs'
  | 'follow-rel'
  | ['result', string]
  | {[key: string]: LibMatcher}
);

export type LibMatcher = (
  | string
  | {[key: string]: LibMatcher}
  | Array<LibMatchOp>
);

export interface LibData {
  remap?: {[key: string]: string};
  dispatch: LibMatcher;
}

export async function loadData() {
  return JSON.parse(await readFile( fileURLToPath(import.meta.resolve('../data/amoslibdb.json')), {encoding:'utf-8'})) as LibData;
}

export function pruneData(matcher: LibMatcher, filter: (str: string) => boolean): LibMatcher {
  if (typeof matcher === 'string') {
    return filter(matcher) ? matcher : {};
  }
  if (Array.isArray(matcher)) {
    const replace = new Array<LibMatchOp>();
    for (const op of matcher) {
      if (Array.isArray(op)) {
        if (op[0] === 'result' && !filter(op[1])) {
          return {};
        }
      }
      else if (typeof op === 'object') {
        const filtered = pruneData(op, filter);
        if (typeof filtered === 'string') {
          return filtered;
        }
        else if (Array.isArray(filtered)) {
          replace.push(...filtered);
        }
        else {
          const keys = Object.keys(filtered);
          if (keys.length === 0) {
            return {};
          }
          replace.push(filtered);
        }
        continue;
      }
      replace.push(op);
    }
    return replace;
  }
  const entries = Object.entries(matcher);
  const newEntries: typeof entries = [];
  for (const [key, entry] of entries) {
    const newEntry = pruneData(entry, filter);
    if (typeof newEntry === 'object' && !Array.isArray(newEntry) && Object.keys(newEntry).length === 0) {
      continue;
    }
    if (typeof newEntry === 'string' && !filter(newEntry)) {
      continue;
    }
    newEntries.push([key, newEntry]);
  }
  if (newEntries.length === 1) {
    return newEntries[0]![1];
  }
  return Object.fromEntries(newEntries);
}

