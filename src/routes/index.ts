import ImageService from "../service/image.service";
import ResourceService from "../service/resource.service";
import { PathId } from "./common/PathId";
import { FileExcelUpload } from "./image/excel.upload";
import { ImageUpload } from "./image/image.upload";

export const methods = {
  GET: "get",
  POST: "post",
  PUT: "put",
  DELETE: "delete",
};

export const routes = [
  // uploads
  [methods.POST, "upload/image", ImageService.uploadImage, ImageUpload],
  // [
  //   methods.POST,
  //   "upload/file-excel",
  //   ImageService.uploadExcel,
  //   FileExcelUpload,
  // ],
  [methods.GET, "test/server", ImageService.getListImage],
  [methods.GET, "/uploads/:id", ResourceService.index, PathId],
];

export default routes;
