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
    USE_TEMPLATE?: string;
    AUTO_UPGRADE?: string;
    TEMPLATE_ID?: string;
    MAX_REPAINT_LEVEL?: number;
    MAX_RECHARGE_LEVEL?: number;
    MAX_ENERGY_LEVEL?: number;
    STOP_ON_TOURNAMENT_BREAK?: string;
  }
}
