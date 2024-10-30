export type ContentInParams = {
    type?: "string" | "integer" | "number" | "boolean" | "array" | "object" | "json" | "file";
    in?: "path" | "query" | "body" | "formData";
    required?: boolean;
    enum?: string[];
    regex?: RegExp;
    items?: {
      type: "string" | "integer" | "number" | "boolean" | "object" | "file";
      in?: "path" | "query" | "body" | "formData";
      enum?: string[];
      props?: any;
    };
    minItems?: number;
    maxItems?: number;
    uniqueItems?: boolean;
    collectionFormat?: "csv" | "multi";
    props?: object;
  };
  
  export type Params =
    | { [key: string]: ContentInParams }
    | { jwt?: boolean }
    | ({ [key: string]: ContentInParams } & { jwt?: boolean });
  