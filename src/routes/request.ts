import { Request, Response } from "express";

export type Req = {
  hostString:string;
  files: any;
  redata: any;
  error: any;
} & Request;

export type Res = Response;