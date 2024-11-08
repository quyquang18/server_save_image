import express, { Request, Response } from "express";
import HttpException from "./common/http-exception";
import ParamValidate from "./routes/param.validator";
import { methods, routes } from "./routes";
import { Req } from "./routes/request";

const prefix = "/api/";
const router = express.Router();
// Middleware để thêm header Cross-Origin-Resource-Policy
router.use((req: Request, res: Response, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});
router.use("/uploads", express.static("uploads"));
router.use("/storage", express.static("./storage"));
declare global {
  namespace Express {
    interface Request {
      files?: File[];
    }
  }
}

routes.map((route: any) => {
  const [method, path, , , roles] = route;
  const handler = route[2] as any;
  const middlewares: any = [];
  const routeHandler = async (req: Request, res: Response) => {
    const body = {};
    const request = req as Req;
    try {
      if (request.error) {
        return res.status(403).json({ error: request.error });
      }
      const { errors, data, host } = ParamValidate(req as Req, route, prefix);
      if (errors && errors.length != 0) {
        return res.status(422).json({ error: errors.join("\n") });
      }
      request.redata = data;
      request.hostString = host;

      handler(req, res)
        .then((result: any) => {
          if (result.error) {
            throw result.error;
          }
          return res
            .status(200)
            .send(
              JSON.stringify({ result }, (key, value) =>
                typeof value === "bigint" ? value.toString() : value
              )
            );
        })
        .catch((e: any) => {
          const error = e as HttpException;
          return res.status(error.statusCode || 500).json({ error });
        });
    } catch (e) {
      const error = e as HttpException;
      return res.status(error.statusCode || 500).json({ error });
    }
  };
  const endpoint = prefix + path;
  switch (method) {
    case methods.POST:
      router.post(endpoint, middlewares, routeHandler);
      break;
    case methods.PUT:
      router.put(endpoint, middlewares, routeHandler);
      break;
    case methods.DELETE:
      router.delete(endpoint, middlewares, routeHandler);
      break;
    case methods.GET:
    default:
      router.get(endpoint, middlewares, routeHandler);
      break;
  }
});

export default router;
