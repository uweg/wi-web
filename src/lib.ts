import { TContent } from "./helper";

export { server } from "./server";
export { client } from "./client";

export type Entry<T extends TContent> = (
  target: any,
  name: string,
  descriptor: TypedPropertyDescriptor<
    (...args: any[]) => Promise<InstanceType<T>>
  >
) => void;

export type Rpc = (
  target: any,
  name: string,
  descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>
) => void;
