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

declare module "bun" {
  interface Env {
    API_ID: number;
    API_HASH: string;
    SESSION_ACTION?: string;
    OCR_ACTION?: string;
    REFERAL_ID?: string;
    TEMPLATE_ID?: string;
  }
}
