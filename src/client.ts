type ClientConfig = {};

export function client<T extends new (...args: any[]) => any>(
  config?: ClientConfig
) {
  function entry(
    target: any,
    name: string,
    descriptor: TypedPropertyDescriptor<(...args: number[]) => Promise<T>>
  ) {
    if (!target.hasOwnProperty("name")) {
      throw `/${target.constructor.name}/${name} must be static`;
    }

    // This is needed for links
    const value = descriptor.value;
    const path = `/${target.name}/${name}`;
    const newValue = async function () {
      return [path, Array.from(arguments), value];
    } as any;
    descriptor.value = newValue;

    const splitted = location.pathname.split("/").slice(1);
    if (splitted[0] == target.name && splitted[1] == name) {
      async function wire() {
        let page = await (await newValue())[2].apply(
          target,
          splitted.slice(2).map((p) => JSON.parse(decodeURIComponent(p)))
        );

        (window as any).__handle = {};
        const dom = await page.body.renderNode([]);
        document.body.replaceWith(dom);
      }

      wire();
    }
  }

  function rpc(
    target: any,
    name: string,
    descriptor: TypedPropertyDescriptor<(...args: number[]) => Promise<any>>
  ) {
    if (!target.hasOwnProperty("name")) {
      throw `/${target.constructor.name}/${name} must be static`;
    }

    const path = `/${target.name}/${name}`;
    if (descriptor.value !== undefined) {
      descriptor.value = async function () {
        const body = [];
        for (const l of Array.from(arguments)) {
          body.push(l);
        }

        const result = await fetch(path, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });

        try {
          const text = await result.text();
          if (text !== "") {
            return JSON.parse(text);
          }

          return undefined;
        } catch {
          return undefined;
        }
      };
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
