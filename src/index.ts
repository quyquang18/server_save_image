import bodyParser from "body-parser";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import router from "./router";
import ImageService from "./service/image.service";
const multer = require("multer");
const allowedOrigins = [
  "http://app.luxas.com.vn",
  "http://app.luxas.com.vn:82",
  "http://125.212.231.227",
  "http://125.212.231.227:82",
  "http://localhost:3000",
  "http://localhost:8080",
  "http://192.168.1.219:3000",
];

const app = express();
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use(express.json());
app.use(
  cors({
    origin: allowedOrigins,
    optionsSuccessStatus: 200,
  })
);
app.use(helmet());
const upload = multer({
  dest: "../storage/excel/", // Location where files will be saved
});
app.post("/api/upload/file-excel", upload.any(), ImageService.uploadExcel);
app.use(router);

app.listen(8080, "0.0.0.0", () => {
  console.log(`Listening on port ${8080}`);
});
//>ssh -f -N -R 9090:192.168.1.189:8080 root@125.212.231.227
