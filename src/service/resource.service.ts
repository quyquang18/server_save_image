import { Request, Response } from "express";
import fs from "fs";

export default class ResourceService {
  static async index(req: Request, res: Response) {
    const { path } = req;
    const id = path.split("/")[1];

    if (id) {
      try {
        var s = fs.createReadStream(path);
        s.on("open", function () {
          res.set("Content-Type", "image/png");
          s.pipe(res);
        });
      } catch (e) {}
    }
    return false;
  }

  static upload(file: any, dest: string) {
    if (!file || !dest) return;

    let ext = file.name.split(".").reverse()[0];
    if (!ext) {
      ext = file.mimetype.split("/").reverse()[0];
    }
    fs.rename(file.tempFilePath, dest + "." + ext, () => {});
    return "." + ext;
  }

  static getImage(path: String) {
    return ResourceService.baseURL() + "/uploads/" + path;
  }

  static baseURL() {
    //return `https://${process.env.HOST_DNS}`;
    return `http://${process.env.HOST_DNS}${
      !process.env.PORT || process.env.PORT == "80" ? "" : ":" + process.env.PORT
    }`;
  }
}
