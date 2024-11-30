import BaseRequest from "./base";
import type {
  Color,
  GetPixelResponse,
  SetPixelResponse,
} from "../types/pixels";
import config from "../config";

export class PixelRequest extends BaseRequest {
  calcPixelId(x: number, y: number) {
    return x + y * config.canvasSize + 1;
  }

  async getPixel(x: number, y: number) {
    const pixelId = this.calcPixelId(x, y);
    try {
      const res = await this.request(`/api/v1/image/get/${pixelId}`);
      const data = await res.json();
      if (data.hasOwnProperty("error")) {
        throw new Error(data.error);
      }

      return data as GetPixelResponse;
    } catch (err) {
      console.error("Failed to get pixel, reason:", (err as Error)?.message);
      return undefined;
    }
  }

  async setPixel(x: number, y: number, color: Color) {
    const pixelId = this.calcPixelId(x, y);
    try {
      const res = await this.request(`/api/v1/repaint/start`, {
        method: "POST",
        body: JSON.stringify({
          newColor: color,
          pixelId,
        }),
      });
      const data = await res.json();
      if (data.hasOwnProperty("error")) {
        throw new Error(data.error);
      }

      return data as SetPixelResponse;
    } catch (err) {
      console.error("Failed to set pixel, reason:", (err as Error)?.message);
      return undefined;
    }
  }

  async getImage() {
    // return image in webp format
    try {
      const res = await this.request("/api/v2/image/");
      return await res.blob();
    } catch (err) {
      console.error("Failed to get image, reason:", (err as Error)?.message);
      return undefined;
    }
  }
}
