
export type RoutineDef = (
  | number
  | {type:'extern', library:LibraryDef, routineName:string}
  | {type:'return', value:number}
  | {type:'error', errcode:number}
  | {type:'common', func:never}
);

export interface LibraryDef {
  md5: string;
  type: 'creator' | 'pro';
  extends?: LibraryDef;
  removed?: string[];
  renamed?: {[name: string]: string};
  routines: {[name: string]: RoutineDef};
}
