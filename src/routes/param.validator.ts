import SwaggerDataTypes from "../swagger/swagger.data.type";
import SwaggerInTypes from "../swagger/swagger.in.type";
import { Req } from "./request";

export default function ParamValidate(req: Req, route: any, prefix: any) {
  const { path, query, body, files } = req;
  const [method, qpath, callback, parameters] = route;
  const host = `${req.protocol}://${req.get("host")}`;
  const errors: Array<any> = [];
  const missing = (key: string) => {
    errors.push(`'${key}' is required but missing`);
  };
  const wrongFormat = (key: string) => {
    errors.push(`'${key}' wrong type or format`);
  };
  const accessDenied = () => {
    errors.push(`Invalid Credentials`);
  };
  const parseMultipartArray = (data: any, param: any) => {
    if (param.items && param.items.type == "object") {
      if (Array.isArray(data)) {
        data.map((e, index) => {
          data[index] = JSON.parse(e);
        });
      }
    }
  };
  const multipart =
    parameters &&
    Object.keys(parameters).find((k) => {
      const param = parameters[k];
      return (
        param.in == "formData" ||
        param.type == "file" ||
        (param.type == "array" && param.items && param.items.type == "file")
      );
    });
  const typeCorrection = (data: any, type: string, itemType?: string) => {
    if (data == null) return null;
    switch (type) {
      case SwaggerDataTypes.integer:
        return parseInt(data);
      case SwaggerDataTypes.number:
        return parseFloat(data);
      case SwaggerDataTypes.boolean:
        return JSON.parse(data);
      case SwaggerDataTypes.array:
        const result: any[] = Array.isArray(data)
          ? itemType
            ? data.map((value: string) => typeCorrection(value, itemType))
            : data
          : [itemType ? typeCorrection(data, itemType) : data];
        return result;
    }
    return data;
  };

  const parseFormDataArray = (body: any) => {
    if (
      body &&
      Object.keys(body).find((e) => e.includes("[") && e.includes("]"))
    ) {
      const keys = Object.keys(body).filter(
        (e) => e.includes("[") && e.includes("]")
      );
      keys.map((e) => {
        const k = e.split("[")[0];
        if (!body[k]) body[k] = [];
        body[k].push(body[e]);
      });
    }
  };

  parseFormDataArray(body);
  parseFormDataArray(files);

  const dataModel: any = {};
  const requiresJWT =
    parameters && Object.keys(parameters).find((k: string) => k == "jwt");
  parameters &&
    Object.keys(parameters).map((k: string) => {
      const param = parameters[k];
      const isArrayType = param.type == "array";

      if (param.type == SwaggerDataTypes.file) {
        param.in = SwaggerInTypes.formData;
      }

      switch (param.in) {
        case SwaggerInTypes.path:
          {
            const pathIndex = `${prefix}${qpath}`
              .split("/")
              .filter((p: string) => p)
              .indexOf(`:${k}`);
            const paths = path.split("/").filter((p: string) => p);
            const data = paths.length > pathIndex ? paths[pathIndex] : "";

            if (param.required && (data == null || data == undefined))
              missing(k);
            if (data && !validateType(data, param)) wrongFormat(k);

            dataModel[k] = typeCorrection(data, param.type);
          }
          break;
        case SwaggerInTypes.query:
          {
            const data = query[k];

            if (param.required && (data == null || data == undefined))
              missing(k);
            if (data && !validateType(data, param)) wrongFormat(k);

            dataModel[k] = typeCorrection(data, param.type, param.items?.type);
          }
          break;
        case SwaggerInTypes.formData:
          const file = files && files[k] ? files[k] : null;
          dataModel[k] = file;

          if (param.required && !file) missing(k);
          if (file && !validateType(file, param.type)) wrongFormat(k);
          break;
        case SwaggerInTypes.body:
        default:
          {
            const malformedArray =
              isArrayType && !!body[k] && !Array.isArray(body[k]);
            const data = malformedArray ? [body[k]] : body[k];

            if (multipart && isArrayType) {
              parseMultipartArray(data, param);
            }

            if (param.required && (data == null || data == undefined))
              missing(k);
            if (data && !validateType(data, param)) wrongFormat(k);

            dataModel[k] = typeCorrection(data, param.type);
          }
          break;
      }
    });

  return { errors, data: dataModel, host };
}

export const validateType = (data: any, param: any) => {
  if (
    !!param.regex &&
    typeof data === "string" &&
    !(param.regex as RegExp).test(data)
  ) {
    return false;
  }
  switch (param.type) {
    case SwaggerDataTypes.integer:
      try {
        const integer = parseInt(data);
        return data.toString().indexOf(".") < 0 && `${+data}` == `${integer}`;
      } catch (err) {
        console.warn(err);
      }
      return false;
    case SwaggerDataTypes.number:
      try {
        const num = parseFloat(data);
        return `${data}` == `${num}`;
      } catch (err) {}
      return false;
    case SwaggerDataTypes.boolean:
      return (
        data === true || data === false || data === "true" || data === "false"
      );
    case SwaggerDataTypes.array:
      // return Array.isArray(data);
      return true;
    case SwaggerDataTypes.file:
      return data && data.name && data.tempFilePath;
    case SwaggerDataTypes.string:
    case SwaggerDataTypes.object:
    default:
      return true;
  }
};
