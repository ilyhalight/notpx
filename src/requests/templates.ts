import BaseRequest from "./base";
import type { Template, TemplateListItem } from "../types/templates";

export class TemplateRequest extends BaseRequest {
  async getList(offset: number = 0, limit: number = 12) {
    try {
      const res = await this.request(
        `/api/v1/tournament/template/list?limit=${limit}&offset=${offset}`
      );
      return (await res.json()) as TemplateListItem[];
    } catch (err) {
      console.error(
        "Failed to get template list, reason:",
        (err as Error)?.message
      );
      return undefined;
    }
  }

  async getTemplate(templateId: number | string = "my") {
    try {
      const res = await this.request(
        `/api/v1/tournament/template/${templateId}`
      );
      const data = await res.json();
      if (data.hasOwnProperty("error")) {
        throw new Error(data.error);
      }

      return data as Template;
    } catch (err) {
      console.error("Failed to get template, reason:", (err as Error)?.message);
      return undefined;
    }
  }

  async getTemplateImage(templateId: number | string) {
    // return image in webp format ( "me")
    try {
      if (templateId === "me") {
        throw new Error("TemplateId 'me' doesn't support in this request");
      }

      const res = await fetch(
        `https://static.notpx.app/tournament/${templateId}.png`,
        {
          headers: {
            "User-Agent": this.userAgent,
          },
        }
      );
      return await res.blob();
    } catch (err) {
      console.error(
        "Failed to get tournament template, reason:",
        (err as Error)?.message
      );
      return undefined;
    }
  }

  async subscribeTemplate(templateId: number | string) {
    try {
      const res = await this.request(
        `/api/v1/tournament/template/subscribe/${templateId}`,
        {
          method: "PUT",
        }
      );
      return res.status === 204;
    } catch (err) {
      console.error(
        "Failed to subscribe template, reason:",
        (err as Error)?.message
      );
      return undefined;
    }
  }
}
