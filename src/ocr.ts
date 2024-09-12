import path from "node:path";
import { styleText } from "node:util";
import { PNG } from "pngjs";

import { Color } from "./types/pixels";
import type {
  ColorArray,
  ColorCanvas,
  ColorLine,
  OCRData,
  OCRPixel,
} from "./types/ocr";

const chars = {
  // 1st row
  "228,110,110,255": {
    color: Color.LightCoral,
    symbol: "+",
  },
  "225,214,53,255": {
    color: Color.Yellow,
    symbol: "-",
  },
  "126,237,86,255": {
    color: Color.LimeGreen,
    symbol: "*",
  },
  "0,204,192,255": {
    color: Color.Turquoise,
    symbol: "=",
  },
  "81,233,244,255": {
    color: Color.SkyBlue,
    symbol: ";",
  },
  "148,179,255,255": {
    color: Color.LightBlue,
    symbol: "!",
  },
  "228,171,255,255": {
    color: Color.Lavender,
    symbol: ":",
  },
  "255,153,170,255": {
    color: Color.LightPink,
    symbol: "'",
  },
  "255,180,112,255": {
    color: Color.Peach,
    symbol: "<",
  },
  "255,255,255,255": {
    color: Color.White,
    symbol: "o",
  },
  // 2nd row
  "190,0,57,255": {
    color: Color.DarkRed,
    symbol: "$",
  },
  "255,150,0,255": {
    color: Color.Orange,
    symbol: "^",
  },
  "0,204,120,255": {
    color: Color.SeaGreen,
    symbol: "#",
  },
  "0,158,170,255": {
    color: Color.Teal,
    symbol: "]",
  },
  "54,158,234,255": {
    color: Color.Blue,
    symbol: "[",
  },
  "106,92,255,255": {
    color: Color.MediumPurple,
    symbol: "(",
  },
  "180,74,192,255": {
    color: Color.Violet,
    symbol: ")",
  },
  "255,56,129,255": {
    color: Color.HotPink,
    symbol: ",",
  },
  "156,105,38,255": {
    color: Color.Brown,
    symbol: "%",
  },
  "137,141,144,255": {
    color: Color.Gray,
    symbol: "№",
  },
  // 3rd row
  "109,0,26,255": {
    color: Color.DarkCrimson,
    symbol: "&",
  },
  "191,67,0,255": {
    color: Color.Rust,
    symbol: "?",
  },
  "0,163,104,255": {
    color: Color.EmeraldGreen,
    symbol: "~",
  },
  "0,117,111,255": {
    color: Color.DarkTeal,
    symbol: "@",
  },
  "36,80,164,255": {
    color: Color.NavyBlue,
    symbol: "\\",
  },
  "73,58,193,255": {
    color: Color.Purple,
    symbol: "/",
  },
  "129,30,159,255": {
    color: Color.Plum,
    symbol: "a",
  },
  "160,3,87,255": {
    color: Color.Crimson,
    symbol: "m",
  },
  "109,72,47,255": {
    color: Color.SaddleBrown,
    symbol: "c",
  },
  "0,0,0,255": {
    color: Color.Black,
    symbol: ".",
  },
  // transparent
  "0,0,0,0": {
    color: null,
    symbol: " ",
  },
};

const colorWidth = 4;

async function main() {
  const file = Bun.file(path.resolve(__dirname, "..", "result.png"));
  const buffer = await file.arrayBuffer();
  const png = new PNG({ colorType: 2 }).parse(buffer);

  let colorLine: ColorLine = [];
  let tempColor: ColorArray = [];
  const lineWidth = png.width * colorWidth;
  const pixels = png.data
    .reduce((result, colorCode, idx) => {
      tempColor.push(colorCode);
      if (idx === 0) {
        return result;
      }

      const colorId = idx + 1;
      if (colorId % colorWidth === 0) {
        colorLine.push(tempColor);
        tempColor = [];
      }

      if (colorId % lineWidth === 0) {
        result.push(colorLine);
        colorLine = [];
      }

      return result;
    }, [] as ColorCanvas)
    .map((line, lineIdx) =>
      line.map((color, colorIdx) => {
        const colorString = color.toString();
        if (!Object(chars).hasOwnProperty(colorString)) {
          console.log(colorString);
        }

        return {
          x: colorIdx,
          y: lineIdx,
          ...(chars[colorString as keyof typeof chars] ?? chars["0,0,0,255"]),
        } as OCRPixel;
      })
    );

  const result = {
    initialPos: [0, 0],
    width: png.width,
    height: png.height,
    totalPixels: png.data.length,
    pixels: (pixels.flat(Infinity) as OCRPixel[]).filter(
      (pixel) => pixel.color
    ),
  } as OCRData;

  Bun.write(
    path.resolve(__dirname, "..", "result.json"),
    JSON.stringify(result)
  );

  const image = pixels
    .map((line) => line.map((color) => color.symbol).join(""))
    .join("\n");

  console.log(`
    Result saved to ${styleText("yellow", "result.json")}
    Image Preview saved to ${styleText("yellowBright", "result.txt")}
  `);
  Bun.write(path.resolve(__dirname, "..", "result.txt"), image);
}

await main();
