import { Params } from "../../swagger/params.type";

export const FileExcelUpload: Params = {
  formData: {
    in: "formData",
  },
  filePath: {
    type: "string",
  },
  fileName: {
    type: "string",
  },
};
