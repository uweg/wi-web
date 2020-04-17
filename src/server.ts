import { Express, json } from "express";
import { getFunctionArguments, TContent } from "./helper";

type ServerConfig = {
  prerender: boolean;
};

const services: string[] = [];

export function server<T extends TContent>(
  app: Express,
  content: T,
  render: (content: InstanceType<T> | null) => Promise<string>,
  config: ServerConfig = { prerender: false }
) {
  app.use(json({}));

  function entry(
    target: any,
    name: string,
    descriptor: TypedPropertyDescriptor<(...args: number[]) => Promise<T>>
  ) {
    if (!target.hasOwnProperty("name")) {
      throw `/${target.constructor.name}/${name} must be static`;
    }

    const path = `/${target.name}/${name}`;
    if (services.indexOf(path) > -1) {
      throw `Path ${path} already exists.`;
    }
    services.push(path);

    const value = descriptor.value;
    // This is needed for links
    descriptor.value = async function () {
      return [path, Array.from(arguments), value];
    } as any;
    const argNames = getFunctionArguments(value?.toString() || "");
    let pathWithArgs = path;
    for (const n of argNames) {
      pathWithArgs += `/:${n}`;
    }

    app.get(pathWithArgs, async (req, res) => {
      let pg: any = null;

      if (config.prerender) {
        const aaaaa = [];
        for (const n of argNames) {
          aaaaa.push(JSON.parse(decodeURIComponent(req.params[n])));
        }

        pg = await (await target[name]())[2].apply(null, aaaaa);
        while (!(pg instanceof content)) {
          pg = await (await (pg as any)[2]).apply(null, (pg as any)[1]);
        }
      }

      res.send(await render(pg));
    });

    console.log("GET " + pathWithArgs);
  }

  function rpc(
    target: any,
    name: string,
    descriptor: TypedPropertyDescriptor<(...args: number[]) => Promise<any>>
  ) {
    if (!target.hasOwnProperty("name")) {
      throw `/${target.constructor.name}/${name} must be static`;
    }

    if (descriptor.value !== undefined) {
      const path = `/${target.name}/${name}`;
      if (services.indexOf(path) > -1) {
        throw `Path ${path} already exists.`;
      }
      services.push(path);

      app.post(path, async (req, res) => {
        const result = await descriptor.value?.apply(null, req.body);
        res.json(result);
      });

      console.log("RPC " + path);
    }
  }

  if (typeof window === "undefined") {
    (global as any).entry = entry;
    (global as any).rpc = rpc;
  } else {
    (global as any).entry = entry;
    (global as any).rpc = rpc;
  }
}
