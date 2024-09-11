declare module "pngjs" {
  type PNGOpts = {
    colorType?: number;
  };
  class PNG {
    constructor(PNGOpts?);
    parse: (data: ArrayBuffer | Buffer, callback?: Function) => PNG;
    width: number;
    height: number;
    data: number[];
  }
}
