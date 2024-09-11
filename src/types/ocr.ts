import type { PixelInput } from "./bot";
import type { Color } from "./pixels";

export type ColorCanvas = number[][][];
export type ColorLine = number[][];
export type ColorArray = number[];

export type OCRPixel = {
  x: number;
  y: number;
  color: Color;
  symbol: string;
};

export type OCRData = {
  initialPos: PixelInput;
  width: number;
  height: number;
  totalPixels: number;
  pixels: OCRPixel[];
};
