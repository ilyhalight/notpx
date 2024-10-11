export type TemplateListItem = {
  templateId: string;
  url: string;
};

export type Template = {
  id: number;
  url: string;
  x: number;
  y: number;
  imageSize: number;
  subscribers: number;
  hits: number;
  createdAt: number;
};
