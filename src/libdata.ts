import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { eachCodePatternToken, type CodePattern, type CodePatternToken } from "./amoslib.js";

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

function snapshotIterator<T>(iter: Iterator<T>) {
  const a: Array<T> = [];
  for (let step = iter.next(); !step.done; step = iter.next()) {
    a.push(step.value);
  }
  return a;
}

function literalWords(iter: Iterator<CodePatternToken>, count: number) {
  const list: string[] = [];
  for (let i = 0; i < count; i++) {
    const step = iter.next();
    if (step.done) return '';
    if (typeof step.value !== 'number') return '';
    list.push(step.value.toString(16).padStart(4, '0'));
  }
  return list.join(' ');
}

function* prefixIterator<T>(iter: Iterator<T>, ...values: T[]) {
  yield *values;
  for (let step = iter.next(); !step.done; step = iter.next()) {
    yield step.value;
  }
}

export function traceLibRoutineFromCodePattern(
  data: LibData,
  getCodePattern: (source: 'local' | 'main', routineNumber: number) => CodePattern,
  routineNumber: number,
): string | null {
  function match(iter: Iterator<CodePatternToken>, matcher: LibMatcher, stack: Iterator<CodePatternToken>[]): string | null {
    if (typeof matcher === 'string') {
      return matcher;
    }
    else if (Array.isArray(matcher)) {
      for (const op of matcher) {
        if (typeof op === 'string') {
          switch (op) {
            case 'follow-abs': {
              const step = iter.next();
              if (step.done) {
                return null;
              }
              let pattern: CodePattern | null = null;
              if (typeof step.value === 'object') {
                if (step.value.type === 'abs-local') {
                  pattern = getCodePattern('local', step.value.routineNumber);
                }
                else if (step.value.type === 'abs-main') {
                  pattern = getCodePattern('main', step.value.routineNumber);
                }
              }
              if (pattern === null) {
                return null;
              }
              iter = eachCodePatternToken(pattern);
              break;
            }
            case 'follow-rel': {
              const step = iter.next();
              if (step.done) {
                return null;
              }
              let pattern: CodePattern | null = null;
              if (typeof step.value === 'object' && step.value.type === 'pivot-local') {
                pattern = getCodePattern('local', step.value.routineNumber);
              }
              if (pattern === null) {
                return null;
              }
              iter = eachCodePatternToken(pattern);
              break;
            }
            case 'pop': {
              if (stack.length === 0) {
                throw new Error('pop without push');
              }
              iter = stack[stack.length-1]!;
              stack = stack.slice(0, -1);
              break;
            }
            case 'push': {
              const snapshot = snapshotIterator(iter);
              stack = [...stack, snapshot.values()];
              iter = snapshot.values();
              break;
            }
            case 'tail-call': {
              const next = iter.next();
              if (!next.done && typeof next.value === 'object' && next.value.type === 'tail-call') {
                const codePattern = getCodePattern('local', next.value.routineNumber);
                iter = eachCodePatternToken(codePattern);
              }
              else {
                iter = prefixIterator(iter, next.value);
              }
              break;
            }
          }
        }
        else if (Array.isArray(op)) {
          switch (op[0]) {
            case 'match': {
              if (!/^[0-9a-f]{4}( [0-9a-f]{4})*$/.test(op[1])) {
                throw new Error('invalid word sequence: ' + op[1]);
              }
              const count = (op[1].length + 1)/5;
              const literal = literalWords(iter, count);
              if (literal !== op[1]) {
                return null;
              }
              break;
            }
            case 'result': {
              return op[1];
            }
            case 'skip': {
              let count = op[1];
              while (count > 0) {
                const step = iter.next();
                if (step.done) return null;
                if (typeof step.value === 'object') {
                  if (step.value.type === 'abs-local' || step.value.type === 'abs-main') {
                    if (count === 1) {
                      throw new Error('cannot skip into halfway through 32-bit address');
                    }
                    count -= 2;
                  }
                  else if (step.value.type === 'tail-call') {
                    throw new Error('cannot skip through tail call');
                  }
                  else {
                    count--;
                  }
                }
                else {
                  count--;
                }
              }
              break;
            }
          }
        }
        else {
          return match(iter, op, stack);
        }
      }
      return null;
    }
    else {
      // matcher is object
      let wordCount = -1;
      for (const key of Object.keys(matcher)) {
        if (key === 'else') continue;
        if (!/^[0-9a-f]{4}( [0-9a-f]{4})*$/.test(key)) {
          throw new Error('invalid match entry: ' + key);
        }
        const count = (key.length+1)/5;
        if (wordCount === -1) {
          wordCount = count;
        }
        else if (wordCount !== count) {
          throw new Error('expected ' + wordCount + ' words, got ' + count + ': ' + key);
        }
      }
      let elseCase = matcher['else'];
      if (wordCount === -1) {
        if (elseCase) {
          return match(iter, elseCase, stack);
        }
      }
      else {
        if (elseCase) {
          const snapshot = snapshotIterator(iter);
          const snapshotIter = snapshot.values();
          const literal = literalWords(snapshotIter, wordCount);
          if (literal in matcher) {
            return match(snapshotIter, matcher[literal]!, stack);
          }
          return match(snapshot.values(), elseCase, stack);
        }
        else {
          const literal = literalWords(iter, wordCount);
          if (literal in matcher) {
            return match(iter, matcher[literal]!, stack);
          }
        }
      }
    }
    return null;
  }
  return match(eachCodePatternToken(getCodePattern('local', routineNumber)), data.dispatch, []);
}
