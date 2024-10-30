import fs from "fs";
import { Req } from "../routes/request";
import path from "path";
import ErrorHelper from "../common/error.helper";
import sharp from "sharp";
const crypto = require("crypto");
const iconv = require("iconv-lite");
export default class ImageService {
  static getBase64Hash(base64Data: any) {
    return crypto.createHash("md5").update(base64Data).digest("hex");
  }
  static async getListImage(filePath: any, data: any) {
    console.log("test success");
    return "get success";
  }

  static async writeFileAsync(filePath: any, data: any) {
    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, data, "base64", (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }
  static async writeFileExcelAsync(filePath: string, file: any) {
    try {
      return new Promise((resolve, reject) => {
        // Đọc dữ liệu từ file
        fs.readFile(file.path, (err, data) => {
          if (err) {
            return reject(err);
          }

          // Ghi dữ liệu vào file mới
          fs.writeFile(filePath, data, (err) => {
            if (err) {
              return reject(err);
            }
            resolve(filePath);
          });
        });
      });
    } catch (error) {
      console.log(error);
    }
  }
  static async resizeImage(imageBuffer: any) {
    try {
      // Decode base64 image
      let imgBuffer = Buffer.from(imageBuffer, "base64");

      // Resize the image and get the buffer
      const resizedBuffer = await sharp(imgBuffer)
        .toFormat("webp") // Convert to webp format
        .toBuffer();

      // Convert the buffer to base64 and return the result
      return `${resizedBuffer.toString("base64")}`;
    } catch (error) {
      console.error("Error resizing and converting image:", error);
      throw error;
    }
  }
  static async uploadImage({ redata, hostString }: Req) {
    const { imageBase64, filePath } = redata;
    console.log("asdsda");
    try {
      const regex = /([^\/]+)(?=\.(png|jpg|jpeg|gif|bmp|svg))/;
      const regexPath = /^(.*\/)([^\/]+\.(png|jpg|jpeg|gif|bmp|svg))/;
      const fileName = filePath.match(regex)[1];
      const uploadDir = "./storage/" + filePath.match(regexPath)[1];
      if (!fs.existsSync(uploadDir)) {
        try {
          fs.mkdirSync(uploadDir);
        } catch (error) {
          console.log(error);
        }
      }
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const dataResise = await ImageService.resizeImage(base64Data);
      const fileExtension = imageBase64.match(/^data:image\/(\w+);base64,/)[1];
      // Tính toán hash của file base64
      const fileHash = ImageService.getBase64Hash(dataResise);

      const existingFile = fs.readdirSync(uploadDir).find((file: any) => {
        try {
          const pathFile = path.join(uploadDir, file);

          // Check if the current item is a file and not a directory
          if (fs.statSync(pathFile).isFile()) {
            const fileContent = fs.readFileSync(pathFile); // Read as Buffer

            // Compare the hash of the file content with the provided hash
            return (
              ImageService.getBase64Hash(fileContent.toString("base64")) ===
              fileHash
            );
          }

          return false; // Skip if it's a directory
        } catch (err) {
          console.error(`Error reading file ${file}:`, err);
          return false;
        }
      });
      if (existingFile) {
        // Nếu file đã tồn tại, trả về đường dẫn của file đó
        const imageUrl = `${hostString}/storage/${
          filePath.match(regexPath)[1]
        }${existingFile}`;

        return imageUrl;
      } else {
        // Nếu file chưa tồn tại
        const uniqueFileName = `${fileName || Date.now()}-${Math.round(
          Math.random() * 1e9
        )}.${fileExtension}`;
        const pathFile = path.join(uploadDir, uniqueFileName);
        const resWrite = await ImageService.writeFileAsync(
          pathFile,
          dataResise
        );
        if (resWrite) {
          const imageUrl = `${hostString}/storage/${
            filePath.match(regexPath)[1]
          }${uniqueFileName}`;
          return imageUrl;
        } else {
          return ErrorHelper.error("Có lỗi xảy ra trong quá trình ghi file");
        }
      }
    } catch (error) {
      return ErrorHelper.error(
        "Định dạng Base64 không hợp lệ hoặc có lỗi xảy ra"
      );
    }
  }
  static checkFileExistence(uploadDir: any, uploadedFileName: any) {
    const fileNames = fs.readdirSync(uploadDir); // Lấy danh sách tên file trong thư mục

    const existingFiles = fileNames
      .map((fileName) => {
        const filePath = path.join(uploadDir, fileName);

        // Kiểm tra xem đây có phải là file không
        if (fs.statSync(filePath).isFile()) {
          // So sánh tên file với fieldname
          if (fileName === uploadedFileName) {
            // Dùng originalname thay vì fieldname
            return filePath; // Trả về đường dẫn file nếu đã tồn tại
          }
        }
        return null; // Trả về null nếu không khớp
      })
      .filter(Boolean); // Lọc ra các giá trị không null

    return existingFiles.length > 0 ? existingFiles : null; // Trả về mảng đường dẫn file hoặc null nếu không tìm thấy
  }
  static async uploadExcel(req: any, res: any) {
    try {
      const { files } = req;
      if (!files || files.length === 0) {
        return res.status(400).send("No files uploaded.");
      }
      const uploadedFile = files[0]; // Lấy file đầu tiên
      const uploadDir = "storage/excel/import";
      if (!fs.existsSync(uploadDir)) {
        try {
          fs.mkdirSync(uploadDir, { recursive: true });
        } catch (error) {
          console.log(error);
        }
      }
      // Tính toán hash của file base64
      const fileHash = ImageService.getBase64Hash(uploadedFile.path);

      const exitsName = ImageService.checkFileExistence(
        uploadDir,
        uploadedFile.fieldname
      );

      const decodedFileName = iconv.decode(
        Buffer.from(uploadedFile.fieldname, "latin1"),
        "utf8"
      );
      if (exitsName) {
        // Nếu file đã tồn tại, trả về đường dẫn của file đó
        const imageUrl = `${req.protocol}://${req.get(
          "host"
        )}/${uploadDir}/${exitsName}`;
        return res.status(200).json({
          reuslt: imageUrl,
        });
      } else {
        // Nếu file chưa tồn tại
        const uniqueFileName = `${decodedFileName}`;

        const newPathFile = path.join(uploadDir, uniqueFileName);
        const resWrite = await ImageService.writeFileExcelAsync(
          newPathFile,
          uploadedFile
        );
        if (resWrite) {
          const imageUrl = `${req.protocol}://${req.get(
            "host"
          )}/${uploadDir}/${uniqueFileName}`;
          return res.status(200).json({
            reuslt: imageUrl,
          });
        } else {
          return res.status(500).send("Error writing file.");
        }
      }
    } catch (error) {
      return res.status(500).send("Error writing file.");
    }
  }
}
