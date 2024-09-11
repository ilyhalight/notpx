import type { PixelOwner } from "./users";

export enum Color {
  // 1st row
  LightCoral = "#e46e6e",
  Yellow = "#FFD635",
  LimeGreen = "#7EED56",
  Turquoise = "#00CCC0",
  SkyBlue = "#51E9F4",
  LightBlue = "#94B3FF",
  Lavender = "#E4ABFF",
  LightPink = "#FF99AA",
  Peach = "#FFB470",
  White = "#FFFFFF",

  // 2nd row
  DarkRed = "#BE0039",
  Orange = "#FF9600",
  SeaGreen = "#00CC78",
  Teal = "#009EAA",
  Blue = "#3690EA",
  MediumPurple = "#6A5CFF",
  Violet = "#B44AC0",
  HotPink = "#FF3881",
  Brown = "#9C6926",
  Gray = "#898D90",

  // 3rd row
  DarkCrimson = "#6D001A",
  Rust = "#bf4300",
  EmeraldGreen = "#00A368",
  DarkTeal = "#00756F",
  NavyBlue = "#2450A4",
  Purple = "#493AC1",
  Plum = "#811E9F",
  Crimson = "#a00357",
  SaddleBrown = "#6D482F",
  Black = "#000000",
}

export type Pixel = {
  id: number;
  x: number;
  y: number;
  ownerId: number;
  repaints: number;
  color: Color;
  dateObtained: string; // ISO Date
};

export type GetPixelResponse = {
  id: number;
  pixel: Pixel;
  owner: PixelOwner;
  isAvailable: boolean;
};

export type SetPixelResponse = {
  balance: number;
};
