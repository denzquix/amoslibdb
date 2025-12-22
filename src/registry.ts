
export interface LibInfo {
  name: string;
  version: string;
  libraryNumber: number;
}

const registry: {[md5: string]: LibInfo} = {
  // official
  'ab1d615bde71d06d53de098768e5384e': {name:'Core', version:'ProV2', libraryNumber:0},
  'ddf2f65aaa9df85d642317e199105d53': {name:'Music', version:'ProV2', libraryNumber:1},
  '57e035efd4d37cb5504bd7d619a99933': {name:'Compact', version:'ProV2', libraryNumber:2},
  '7d3df35f6a37886c2d4c84542b9300e0': {name:'Requester', version:'ProV2', libraryNumber:3},
  '241e45afbbad3871e5dad9135dacd1cb': {name:'IOPorts', version:'ProV2', libraryNumber:6},

  // third party
  '18ed1e8c39eb633bd26a5da129002a64': {name:'OpalVision', version:'V1.1', libraryNumber:21},
};

export default registry;
