import { Ingest, Price } from "../middleware/hardcoded-nodes";
import { NodeAddress } from "../middleware/kubernetes";
import { Stream, User, ApiToken } from "../schema/types";
import MessageQueue from "../store/rabbit-queue";
import { CliArgs } from "../parse-cli";

export enum AuthTokenType {
  JWT = "JWT",
  Bearer = "Bearer",
  Basic = "Basic",
}

declare global {
  namespace Express {
    // add custom properties to Request object
    export interface Request {
      config?: CliArgs;
      store?: IStore;
      queue?: MessageQueue;
      frontendDomain: string;

      user?: User;
      authTokenType?: AuthTokenType;
      isUIAdmin?: boolean;
      tokenName?: string;
      tokenId?: string;

      getBroadcasters?: () => Promise<NodeAddress[]>;
      getOrchestrators?: () => Promise<NodeAddress[]>;
      getIngest?: () => Promise<Ingest[]>;
      getPrices?: () => Promise<Price[]>;
    }
  }
}

export type StoredObject = Stream | User | ApiToken;

export interface IStoreListArgs {
  prefix: string;
  cursor?: any;
  limit?: number;
  cleanWriteOnly?: boolean;
  filter?: (obj: { [key: string]: StoredObject }) => boolean;
}

export interface IStoreQueryArgs {
  kind: string;
  query: object;
  cursor?: any;
  limit?: number;
  cleanWriteOnly?: boolean;
}

export interface IStoreQueryObjectsArgs {
  kind: string;
  query: object;
  cursor?: any;
  limit?: number | string;
  cleanWriteOnly?: boolean;
  filter?: (obj: StoredObject) => boolean;
}

export interface IStore {
  ready: Promise<void>;

  get<T extends StoredObject>(id: string, cleanWriteOnly?: boolean): Promise<T>;
  close(): Promise<void>;
  replace(data: StoredObject): Promise<void>;
  list<T = StoredObject>(
    args: IStoreListArgs
  ): Promise<{ data: Array<T>; cursor: string }>;
  listKeys(
    prefix: string,
    cursor?: string,
    limit?: number
  ): Promise<[Array<string>, string]>;
  query(
    args: IStoreQueryArgs
  ): Promise<{ data: Array<string>; cursor: string }>;
  queryObjects<T = StoredObject>(
    args: IStoreQueryObjectsArgs
  ): Promise<{ data: Array<T>; cursor: string }>;
  deleteKey(key: string): Promise<void>;
  delete(id: string): Promise<void>;
  create(data: StoredObject): Promise<StoredObject>;
}

export interface IStoreBackend {
  close(): Promise<void>;
  listKeys(
    prefix: string,
    cursor: any,
    limit: number
  ): Promise<[Array<string>, any]>;
  list(
    prefix: string,
    cursor: any,
    limit: number
  ): Promise<{ data: Array<StoredObject>; cursor: any }>;
  get(id: string): Promise<StoredObject>;
  create(key: string, data: StoredObject): Promise<StoredObject>;
  replace(key: string, data: StoredObject): Promise<void>;
  delete(id: string): Promise<void>;
}

// Type utilities

type Camel<T extends string> = T extends `${infer Left}-${infer Right}`
  ? Camel<`${Left}${Capitalize<Right>}`>
  : T;

export type CamelKeys<T> = {
  [K in keyof T as K extends string ? Camel<K> : K]: T[K];
};

export type UnboxPromise<T> = T extends Promise<infer U> ? U : T;
