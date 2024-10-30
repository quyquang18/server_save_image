import { Params } from "../../swagger/params.type";

export const ImageUpload: Params = {
    imageBase64: {
        type: 'string',
        required: true,
    },
     filePath: {
        type: 'string',
        required: true,
    },
};
