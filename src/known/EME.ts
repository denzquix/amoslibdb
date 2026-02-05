import type { LibraryDef } from "../types.js";
import Music from "./Music.js";

namespace EME {
  export const V3_00DEMO = {
    md5: '956464c43f7d3a0f1b9031db2382c44c',
    type: 'creator',
    name: 'EME',
    version: 'V3_00DEMO',
    extends: Music.V1_54,
    same: {
      TrackSampleOff: 'TrackSampleOn',
    },
    routines: {
      MedCont: 111,
      MedLoad: 101,
      MedMidiOn: 108,
      MedPlay: 104,
      MedPlay_II: 106,
      MedPlay_I: 105,
      MedStop: 103,
      MedTempo: 112,
      PattLoopNo: 116,
      PattLoopOf: 114,
      PattLoopOn: 113,
      TrCredits: 119,
      TrackSampleOff: 117,
      TrackSampleOn: 118,
      TrackTempo: 97,
      Trlen: 99,
      Trpat: 100,
      Trpos: 98,
      Trstat: 115,
    },
  } satisfies LibraryDef;
  export const ProV3_00DEMO = {
    md5: 'b448154293965887ab6e116e091b12b3',
    type: 'pro',
    name: 'EME',
    version: 'V3_00DEMO',
    extends: Music.ProV2_00,
    same: {
      TrackSampleOff: 'TrackSampleOn',
    },
    routines: {
      PattLoopNo: 120,
      PattLoopOf: 114,
      PattLoopOn: 113,
      TrackSampleOff: 121,
      TrackSampleOn: 122,
      TrackTempo: 116,
      Trlen: 118,
      Trpat: 119,
      Trpos: 117,
      Trstat: 115,
    },
  } satisfies LibraryDef;
}

export default EME;
