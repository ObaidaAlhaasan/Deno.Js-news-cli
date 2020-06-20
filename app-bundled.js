// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.

// This is a specialised implementation of a System module loader.

"use strict";

// @ts-nocheck
/* eslint-disable */
let System, __instantiateAsync, __instantiate;

(() => {
  const r = new Map();

  System = {
    register(id, d, f) {
      r.set(id, { d, f, exp: {} });
    },
  };

  async function dI(mid, src) {
    let id = mid.replace(/\.\w+$/i, "");
    if (id.includes("./")) {
      const [o, ...ia] = id.split("/").reverse(),
        [, ...sa] = src.split("/").reverse(),
        oa = [o];
      let s = 0,
        i;
      while ((i = ia.shift())) {
        if (i === "..") s++;
        else if (i === ".") break;
        else oa.push(i);
      }
      if (s < sa.length) oa.push(...sa.slice(s));
      id = oa.reverse().join("/");
    }
    return r.has(id) ? gExpA(id) : import(mid);
  }

  function gC(id, main) {
    return {
      id,
      import: (m) => dI(m, id),
      meta: { url: id, main },
    };
  }

  function gE(exp) {
    return (id, v) => {
      v = typeof id === "string" ? { [id]: v } : id;
      for (const [id, value] of Object.entries(v)) {
        Object.defineProperty(exp, id, {
          value,
          writable: true,
          enumerable: true,
        });
      }
    };
  }

  function rF(main) {
    for (const [id, m] of r.entries()) {
      const { f, exp } = m;
      const { execute: e, setters: s } = f(gE(exp), gC(id, id === main));
      delete m.f;
      m.e = e;
      m.s = s;
    }
  }

  async function gExpA(id) {
    if (!r.has(id)) return;
    const m = r.get(id);
    if (m.s) {
      const { d, e, s } = m;
      delete m.s;
      delete m.e;
      for (let i = 0; i < s.length; i++) s[i](await gExpA(d[i]));
      const r = e();
      if (r) await r;
    }
    return m.exp;
  }

  function gExp(id) {
    if (!r.has(id)) return;
    const m = r.get(id);
    if (m.s) {
      const { d, e, s } = m;
      delete m.s;
      delete m.e;
      for (let i = 0; i < s.length; i++) s[i](gExp(d[i]));
      e();
    }
    return m.exp;
  }

  __instantiateAsync = async (m) => {
    System = __instantiateAsync = __instantiate = undefined;
    rF(m);
    return gExpA(m);
  };

  __instantiate = (m) => {
    System = __instantiateAsync = __instantiate = undefined;
    rF(m);
    return gExp(m);
  };
})();

// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
System.register(
  "https://deno.land/std/_util/assert",
  [],
  function (exports_1, context_1) {
    "use strict";
    var DenoStdInternalError;
    var __moduleName = context_1 && context_1.id;
    /** Make an assertion, if not `true`, then throw. */
    function assert(expr, msg = "") {
      if (!expr) {
        throw new DenoStdInternalError(msg);
      }
    }
    exports_1("assert", assert);
    return {
      setters: [],
      execute: function () {
        DenoStdInternalError = class DenoStdInternalError extends Error {
          constructor(message) {
            super(message);
            this.name = "DenoStdInternalError";
          }
        };
        exports_1("DenoStdInternalError", DenoStdInternalError);
      },
    };
  },
);
// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
System.register(
  "https://deno.land/std/flags/mod",
  ["https://deno.land/std/_util/assert"],
  function (exports_2, context_2) {
    "use strict";
    var assert_ts_1;
    var __moduleName = context_2 && context_2.id;
    function get(obj, key) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        return obj[key];
      }
    }
    function getForce(obj, key) {
      const v = get(obj, key);
      assert_ts_1.assert(v != null);
      return v;
    }
    function isNumber(x) {
      if (typeof x === "number") {
        return true;
      }
      if (/^0x[0-9a-f]+$/i.test(String(x))) {
        return true;
      }
      return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(String(x));
    }
    function hasKey(obj, keys) {
      let o = obj;
      keys.slice(0, -1).forEach((key) => {
        o = (get(o, key) ?? {});
      });
      const key = keys[keys.length - 1];
      return key in o;
    }
    /** Take a set of command line arguments, with an optional set of options, and
     * return an object representation of those argument.
     *
     *      const parsedArgs = parse(Deno.args);
     */
    function parse(
      args,
      {
        "--": doubleDash = false,
        alias = {},
        boolean = false,
        default: defaults = {},
        stopEarly = false,
        string = [],
        unknown = (i) => i,
      } = {},
    ) {
      const flags = {
        bools: {},
        strings: {},
        unknownFn: unknown,
        allBools: false,
      };
      if (boolean !== undefined) {
        if (typeof boolean === "boolean") {
          flags.allBools = !!boolean;
        } else {
          const booleanArgs = typeof boolean === "string" ? [boolean] : boolean;
          for (const key of booleanArgs.filter(Boolean)) {
            flags.bools[key] = true;
          }
        }
      }
      const aliases = {};
      if (alias !== undefined) {
        for (const key in alias) {
          const val = getForce(alias, key);
          if (typeof val === "string") {
            aliases[key] = [val];
          } else {
            aliases[key] = val;
          }
          for (const alias of getForce(aliases, key)) {
            aliases[alias] = [key].concat(
              aliases[key].filter((y) => alias !== y),
            );
          }
        }
      }
      if (string !== undefined) {
        const stringArgs = typeof string === "string" ? [string] : string;
        for (const key of stringArgs.filter(Boolean)) {
          flags.strings[key] = true;
          const alias = get(aliases, key);
          if (alias) {
            for (const al of alias) {
              flags.strings[al] = true;
            }
          }
        }
      }
      const argv = { _: [] };
      function argDefined(key, arg) {
        return ((flags.allBools && /^--[^=]+$/.test(arg)) ||
          get(flags.bools, key) ||
          !!get(flags.strings, key) ||
          !!get(aliases, key));
      }
      function setKey(obj, keys, value) {
        let o = obj;
        keys.slice(0, -1).forEach(function (key) {
          if (get(o, key) === undefined) {
            o[key] = {};
          }
          o = get(o, key);
        });
        const key = keys[keys.length - 1];
        if (
          get(o, key) === undefined ||
          get(flags.bools, key) ||
          typeof get(o, key) === "boolean"
        ) {
          o[key] = value;
        } else if (Array.isArray(get(o, key))) {
          o[key].push(value);
        } else {
          o[key] = [get(o, key), value];
        }
      }
      function setArg(key, val, arg = undefined) {
        if (arg && flags.unknownFn && !argDefined(key, arg)) {
          if (flags.unknownFn(arg, key, val) === false) {
            return;
          }
        }
        const value = !get(flags.strings, key) && isNumber(val) ? Number(val)
        : val;
        setKey(argv, key.split("."), value);
        const alias = get(aliases, key);
        if (alias) {
          for (const x of alias) {
            setKey(argv, x.split("."), value);
          }
        }
      }
      function aliasIsBoolean(key) {
        return getForce(aliases, key).some((x) =>
          typeof get(flags.bools, x) === "boolean"
        );
      }
      for (const key of Object.keys(flags.bools)) {
        setArg(key, defaults[key] === undefined ? false : defaults[key]);
      }
      let notFlags = [];
      // all args after "--" are not parsed
      if (args.includes("--")) {
        notFlags = args.slice(args.indexOf("--") + 1);
        args = args.slice(0, args.indexOf("--"));
      }
      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (/^--.+=/.test(arg)) {
          const m = arg.match(/^--([^=]+)=(.*)$/s);
          assert_ts_1.assert(m != null);
          const [, key, value] = m;
          if (flags.bools[key]) {
            const booleanValue = value !== "false";
            setArg(key, booleanValue, arg);
          } else {
            setArg(key, value, arg);
          }
        } else if (/^--no-.+/.test(arg)) {
          const m = arg.match(/^--no-(.+)/);
          assert_ts_1.assert(m != null);
          setArg(m[1], false, arg);
        } else if (/^--.+/.test(arg)) {
          const m = arg.match(/^--(.+)/);
          assert_ts_1.assert(m != null);
          const [, key] = m;
          const next = args[i + 1];
          if (
            next !== undefined &&
            !/^-/.test(next) &&
            !get(flags.bools, key) &&
            !flags.allBools &&
            (get(aliases, key) ? !aliasIsBoolean(key) : true)
          ) {
            setArg(key, next, arg);
            i++;
          } else if (/^(true|false)$/.test(next)) {
            setArg(key, next === "true", arg);
            i++;
          } else {
            setArg(key, get(flags.strings, key) ? "" : true, arg);
          }
        } else if (/^-[^-]+/.test(arg)) {
          const letters = arg.slice(1, -1).split("");
          let broken = false;
          for (let j = 0; j < letters.length; j++) {
            const next = arg.slice(j + 2);
            if (next === "-") {
              setArg(letters[j], next, arg);
              continue;
            }
            if (/[A-Za-z]/.test(letters[j]) && /=/.test(next)) {
              setArg(letters[j], next.split("=")[1], arg);
              broken = true;
              break;
            }
            if (
              /[A-Za-z]/.test(letters[j]) &&
              /-?\d+(\.\d*)?(e-?\d+)?$/.test(next)
            ) {
              setArg(letters[j], next, arg);
              broken = true;
              break;
            }
            if (letters[j + 1] && letters[j + 1].match(/\W/)) {
              setArg(letters[j], arg.slice(j + 2), arg);
              broken = true;
              break;
            } else {
              setArg(
                letters[j],
                get(flags.strings, letters[j]) ? "" : true,
                arg,
              );
            }
          }
          const [key] = arg.slice(-1);
          if (!broken && key !== "-") {
            if (
              args[i + 1] &&
              !/^(-|--)[^-]/.test(args[i + 1]) &&
              !get(flags.bools, key) &&
              (get(aliases, key) ? !aliasIsBoolean(key) : true)
            ) {
              setArg(key, args[i + 1], arg);
              i++;
            } else if (args[i + 1] && /^(true|false)$/.test(args[i + 1])) {
              setArg(key, args[i + 1] === "true", arg);
              i++;
            } else {
              setArg(key, get(flags.strings, key) ? "" : true, arg);
            }
          }
        } else {
          if (!flags.unknownFn || flags.unknownFn(arg) !== false) {
            argv._.push(
              flags.strings["_"] ?? !isNumber(arg) ? arg : Number(arg),
            );
          }
          if (stopEarly) {
            argv._.push(...args.slice(i + 1));
            break;
          }
        }
      }
      for (const key of Object.keys(defaults)) {
        if (!hasKey(argv, key.split("."))) {
          setKey(argv, key.split("."), defaults[key]);
          if (aliases[key]) {
            for (const x of aliases[key]) {
              setKey(argv, x.split("."), defaults[key]);
            }
          }
        }
      }
      if (doubleDash) {
        argv["--"] = [];
        for (const key of notFlags) {
          argv["--"].push(key);
        }
      } else {
        for (const key of notFlags) {
          argv._.push(key);
        }
      }
      return argv;
    }
    exports_2("parse", parse);
    return {
      setters: [
        function (assert_ts_1_1) {
          assert_ts_1 = assert_ts_1_1;
        },
      ],
      execute: function () {
      },
    };
  },
);
// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
System.register(
  "https://deno.land/std/fs/read_json",
  [],
  function (exports_3, context_3) {
    "use strict";
    var __moduleName = context_3 && context_3.id;
    /** Reads a JSON file and then parses it into an object */
    async function readJson(filePath) {
      const decoder = new TextDecoder("utf-8");
      const content = decoder.decode(await Deno.readFile(filePath));
      try {
        return JSON.parse(content);
      } catch (err) {
        err.message = `${filePath}: ${err.message}`;
        throw err;
      }
    }
    exports_3("readJson", readJson);
    /** Reads a JSON file and then parses it into an object */
    function readJsonSync(filePath) {
      const decoder = new TextDecoder("utf-8");
      const content = decoder.decode(Deno.readFileSync(filePath));
      try {
        return JSON.parse(content);
      } catch (err) {
        err.message = `${filePath}: ${err.message}`;
        throw err;
      }
    }
    exports_3("readJsonSync", readJsonSync);
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/std/fs/write_json",
  [],
  function (exports_4, context_4) {
    "use strict";
    var __moduleName = context_4 && context_4.id;
    /* Writes an object to a JSON file. */
    async function writeJson(
      filePath,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      object,
      options = {},
    ) {
      let contentRaw = "";
      try {
        contentRaw = JSON.stringify(object, options.replacer, options.spaces);
      } catch (err) {
        err.message = `${filePath}: ${err.message}`;
        throw err;
      }
      await Deno.writeFile(filePath, new TextEncoder().encode(contentRaw));
    }
    exports_4("writeJson", writeJson);
    /* Writes an object to a JSON file. */
    function writeJsonSync(
      filePath,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      object,
      options = {},
    ) {
      let contentRaw = "";
      try {
        contentRaw = JSON.stringify(object, options.replacer, options.spaces);
      } catch (err) {
        err.message = `${filePath}: ${err.message}`;
        throw err;
      }
      Deno.writeFileSync(filePath, new TextEncoder().encode(contentRaw));
    }
    exports_4("writeJsonSync", writeJsonSync);
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
System.register(
  "https://deno.land/std/fs/exists",
  [],
  function (exports_5, context_5) {
    "use strict";
    var __moduleName = context_5 && context_5.id;
    // Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
    /**
     * Test whether or not the given path exists by checking with the file system
     */
    async function exists(filePath) {
      try {
        await Deno.lstat(filePath);
        return true;
      } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
          return false;
        }
        throw err;
      }
    }
    exports_5("exists", exists);
    /**
     * Test whether or not the given path exists by checking with the file system
     */
    function existsSync(filePath) {
      try {
        Deno.lstatSync(filePath);
        return true;
      } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
          return false;
        }
        throw err;
      }
    }
    exports_5("existsSync", existsSync);
    return {
      setters: [],
      execute: function () {
      },
    };
  },
);
// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
/** A module to print ANSI terminal colors. Inspired by chalk, kleur, and colors
 * on npm.
 *
 * ```
 * import { bgBlue, red, bold } from "https://deno.land/std/fmt/colors.ts";
 * console.log(bgBlue(red(bold("Hello world!"))));
 * ```
 *
 * This module supports `NO_COLOR` environmental variable disabling any coloring
 * if `NO_COLOR` is set.
 *
 * This module is browser compatible. */
System.register(
  "https://deno.land/std/fmt/colors",
  [],
  function (exports_6, context_6) {
    "use strict";
    var noColor, enabled, ANSI_PATTERN;
    var __moduleName = context_6 && context_6.id;
    function setColorEnabled(value) {
      if (noColor) {
        return;
      }
      enabled = value;
    }
    exports_6("setColorEnabled", setColorEnabled);
    function getColorEnabled() {
      return enabled;
    }
    exports_6("getColorEnabled", getColorEnabled);
    function code(open, close) {
      return {
        open: `\x1b[${open.join(";")}m`,
        close: `\x1b[${close}m`,
        regexp: new RegExp(`\\x1b\\[${close}m`, "g"),
      };
    }
    function run(str, code) {
      return enabled
        ? `${code.open}${str.replace(code.regexp, code.open)}${code.close}`
        : str;
    }
    function reset(str) {
      return run(str, code([0], 0));
    }
    exports_6("reset", reset);
    function bold(str) {
      return run(str, code([1], 22));
    }
    exports_6("bold", bold);
    function dim(str) {
      return run(str, code([2], 22));
    }
    exports_6("dim", dim);
    function italic(str) {
      return run(str, code([3], 23));
    }
    exports_6("italic", italic);
    function underline(str) {
      return run(str, code([4], 24));
    }
    exports_6("underline", underline);
    function inverse(str) {
      return run(str, code([7], 27));
    }
    exports_6("inverse", inverse);
    function hidden(str) {
      return run(str, code([8], 28));
    }
    exports_6("hidden", hidden);
    function strikethrough(str) {
      return run(str, code([9], 29));
    }
    exports_6("strikethrough", strikethrough);
    function black(str) {
      return run(str, code([30], 39));
    }
    exports_6("black", black);
    function red(str) {
      return run(str, code([31], 39));
    }
    exports_6("red", red);
    function green(str) {
      return run(str, code([32], 39));
    }
    exports_6("green", green);
    function yellow(str) {
      return run(str, code([33], 39));
    }
    exports_6("yellow", yellow);
    function blue(str) {
      return run(str, code([34], 39));
    }
    exports_6("blue", blue);
    function magenta(str) {
      return run(str, code([35], 39));
    }
    exports_6("magenta", magenta);
    function cyan(str) {
      return run(str, code([36], 39));
    }
    exports_6("cyan", cyan);
    function white(str) {
      return run(str, code([37], 39));
    }
    exports_6("white", white);
    function gray(str) {
      return run(str, code([90], 39));
    }
    exports_6("gray", gray);
    function bgBlack(str) {
      return run(str, code([40], 49));
    }
    exports_6("bgBlack", bgBlack);
    function bgRed(str) {
      return run(str, code([41], 49));
    }
    exports_6("bgRed", bgRed);
    function bgGreen(str) {
      return run(str, code([42], 49));
    }
    exports_6("bgGreen", bgGreen);
    function bgYellow(str) {
      return run(str, code([43], 49));
    }
    exports_6("bgYellow", bgYellow);
    function bgBlue(str) {
      return run(str, code([44], 49));
    }
    exports_6("bgBlue", bgBlue);
    function bgMagenta(str) {
      return run(str, code([45], 49));
    }
    exports_6("bgMagenta", bgMagenta);
    function bgCyan(str) {
      return run(str, code([46], 49));
    }
    exports_6("bgCyan", bgCyan);
    function bgWhite(str) {
      return run(str, code([47], 49));
    }
    exports_6("bgWhite", bgWhite);
    /* Special Color Sequences */
    function clampAndTruncate(n, max = 255, min = 0) {
      return Math.trunc(Math.max(Math.min(n, max), min));
    }
    /** Set text color using paletted 8bit colors.
     * https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit */
    function rgb8(str, color) {
      return run(str, code([38, 5, clampAndTruncate(color)], 39));
    }
    exports_6("rgb8", rgb8);
    /** Set background color using paletted 8bit colors.
     * https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit */
    function bgRgb8(str, color) {
      return run(str, code([48, 5, clampAndTruncate(color)], 49));
    }
    exports_6("bgRgb8", bgRgb8);
    /** Set text color using 24bit rgb.
     * `color` can be a number in range `0x000000` to `0xffffff` or
     * an `Rgb`.
     *
     * To produce the color magenta:
     *
     *      rgba24("foo", 0xff00ff);
     *      rgba24("foo", {r: 255, g: 0, b: 255});
     */
    function rgb24(str, color) {
      if (typeof color === "number") {
        return run(
          str,
          code(
            [38, 2, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff],
            39,
          ),
        );
      }
      return run(
        str,
        code([
          38,
          2,
          clampAndTruncate(color.r),
          clampAndTruncate(color.g),
          clampAndTruncate(color.b),
        ], 39),
      );
    }
    exports_6("rgb24", rgb24);
    /** Set background color using 24bit rgb.
     * `color` can be a number in range `0x000000` to `0xffffff` or
     * an `Rgb`.
     *
     * To produce the color magenta:
     *
     *      bgRgba24("foo", 0xff00ff);
     *      bgRgba24("foo", {r: 255, g: 0, b: 255});
     */
    function bgRgb24(str, color) {
      if (typeof color === "number") {
        return run(
          str,
          code(
            [48, 2, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff],
            49,
          ),
        );
      }
      return run(
        str,
        code([
          48,
          2,
          clampAndTruncate(color.r),
          clampAndTruncate(color.g),
          clampAndTruncate(color.b),
        ], 49),
      );
    }
    exports_6("bgRgb24", bgRgb24);
    function stripColor(string) {
      return string.replace(ANSI_PATTERN, "");
    }
    exports_6("stripColor", stripColor);
    return {
      setters: [],
      execute: function () {
        noColor = globalThis.Deno?.noColor ?? true;
        enabled = !noColor;
        // https://github.com/chalk/ansi-regex/blob/2b56fb0c7a07108e5b54241e8faec160d393aedb/index.js
        ANSI_PATTERN = new RegExp(
          [
            "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
            "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))",
          ].join("|"),
          "g",
        );
      },
    };
  },
);
System.register(
  "file:///C:/Users/Terkwaz/Desktop/Deno-CLI/deps",
  [
    "https://deno.land/std/flags/mod",
    "https://deno.land/std/fs/read_json",
    "https://deno.land/std/fs/write_json",
    "https://deno.land/std/fs/exists",
    "https://deno.land/std/fmt/colors",
  ],
  function (exports_7, context_7) {
    "use strict";
    var __moduleName = context_7 && context_7.id;
    return {
      setters: [
        function (mod_ts_1_1) {
          exports_7({
            "parse": mod_ts_1_1["parse"],
          });
        },
        function (read_json_ts_1_1) {
          exports_7({
            "readJsonSync": read_json_ts_1_1["readJsonSync"],
          });
        },
        function (write_json_ts_1_1) {
          exports_7({
            "writeJsonSync": write_json_ts_1_1["writeJsonSync"],
          });
        },
        function (exists_ts_1_1) {
          exports_7({
            "existsSync": exists_ts_1_1["existsSync"],
          });
        },
        function (colors_ts_1_1) {
          exports_7({
            "red": colors_ts_1_1["red"],
            "green": colors_ts_1_1["green"],
            "bold": colors_ts_1_1["bold"],
            "cyan": colors_ts_1_1["cyan"],
            "yellow": colors_ts_1_1["yellow"],
            "magenta": colors_ts_1_1["magenta"],
          });
        },
      ],
      execute: function () {
      },
    };
  },
);
//error.ts
System.register(
  "file:///C:/Users/Terkwaz/Desktop/Deno-CLI/error",
  ["file:///C:/Users/Terkwaz/Desktop/Deno-CLI/deps"],
  function (exports_8, context_8) {
    "use strict";
    var deps_ts_1, displayHelpAndQuit;
    var __moduleName = context_8 && context_8.id;
    return {
      setters: [
        function (deps_ts_1_1) {
          deps_ts_1 = deps_ts_1_1;
        },
      ],
      execute: function () {
        // Shows help text, error message(if present) and exits the program
        exports_8(
          "displayHelpAndQuit",
          displayHelpAndQuit = (error) => {
            if (!error) {
            } else if (error === "INVALID_KEY") {
              console.log(
                deps_ts_1.bold(
                  deps_ts_1.red(
                    `Error: Invalid API key. Use --config flag to set key`,
                  ),
                ),
              );
            } else {
              console.log(deps_ts_1.bold(deps_ts_1.red(`Error: ${error}`)));
            }
            console.log(`Usage: newzzer [filters]\n`);
            console.log(`Optional flags:`);
            console.log(
              `   ${
                deps_ts_1.bold("-h, --help")
              }\t\t Shows this help message and exits`,
            );
            console.log(
              `   ${
                deps_ts_1.bold("-q, --query")
              }\t\t Find news related to a specific keyword`,
            );
            console.log(
              `   ${
                deps_ts_1.bold("-c, --category")
              }\t Find news in a valid category\n\t\t\t The valid categories are: business, entertainment, general, health, science, sports, technology`,
            );
            console.log(
              `   ${
                deps_ts_1.bold("--config <API_KEY>")
              }\t Set API key for news API. The key can be recieved from ${
                deps_ts_1.cyan(`https://newsapi.org/register`)
              }`,
            );
            // Exits the program
            Deno.exit();
          },
        );
      },
    };
  },
);
System.register(
  "file:///C:/Users/Terkwaz/Desktop/Deno-CLI/api",
  [],
  function (exports_9, context_9) {
    "use strict";
    var Api;
    var __moduleName = context_9 && context_9.id;
    return {
      setters: [],
      execute: function () {
        Api = class Api {
          // set API key
          constructor(apikey) {
            // private property
            this.#baseURL = "https://newsapi.org/v2/top-headlines";
            this.#apiKey = "";
            this.getNews = async (category, query) => {
              let additional = "";
              let country = "IN"; // Use US for USA , refer documentation for the complete list
              if (category) {
                additional += `&category=${category}`;
              }
              if (query) {
                additional += `&q=${encodeURI(query)}`;
              }
              try {
                const rawResult = await fetch(
                  `${this.#baseURL}?language=en&pageSize=10${additional}&apiKey=${this.#apiKey}&sortBy=popularity&country=${country}`,
                );
                const result = await rawResult.json();
                if (result.status === "error") {
                  return "INVALID_KEY";
                }
                let news = result.articles;
                return news;
              } catch (err) {
                return "Cannot connect to server. Please check your internet conection";
              }
            };
            this.#apiKey = apikey;
          }
          // private property
          #baseURL;
          #apiKey;
        };
        exports_9("default", Api);
      },
    };
  },
);
System.register(
  "file:///C:/Users/Terkwaz/Desktop/Deno-CLI/mod",
  [
    "file:///C:/Users/Terkwaz/Desktop/Deno-CLI/deps",
    "file:///C:/Users/Terkwaz/Desktop/Deno-CLI/error",
    "file:///C:/Users/Terkwaz/Desktop/Deno-CLI/api",
  ],
  function (exports_10, context_10) {
    "use strict";
    var deps_ts_2,
      error_ts_1,
      api_ts_1,
      setApiKey,
      getApiKey,
      displayBanner,
      displayArticles,
      invalidCategory,
      showFlags;
    var __moduleName = context_10 && context_10.id;
    return {
      setters: [
        function (deps_ts_2_1) {
          deps_ts_2 = deps_ts_2_1;
        },
        function (error_ts_1_1) {
          error_ts_1 = error_ts_1_1;
        },
        function (api_ts_1_1) {
          api_ts_1 = api_ts_1_1;
        },
      ],
      execute: async function () {
        // ***************
        // FUNCTIONS
        // ***************
        setApiKey = (parsedArgs) => {
          // Get home directory address
          let homeEnv = Deno.env.get("HOME");
          let home = "";
          if (typeof homeEnv === "string") {
            home = homeEnv;
          }
          let configFilePath = `${home}/.newzzer.json`;
          //   Check if api-key is provided
          if (typeof parsedArgs.config === "string") {
            //   If the file is not present, then create file
            if (!deps_ts_2.existsSync(configFilePath)) {
              Deno.createSync(configFilePath);
            }
            // Write apiKey in the file
            deps_ts_2.writeJsonSync(
              configFilePath,
              { apiKey: parsedArgs.config },
            );
            console.log(
              `${
                deps_ts_2.green(deps_ts_2.bold("Success"))
              } ApiKey set Successfully`,
            );
            error_ts_1.displayHelpAndQuit();
          } //   Handling if apiKey is not present after --config
          else {
            error_ts_1.displayHelpAndQuit(
              "Config flag should be followed by apiKey",
            );
          }
        };
        getApiKey = () => {
          // Get home directory address
          let homeEnv = Deno.env.get("HOME");
          let home = "";
          if (typeof homeEnv === "string") {
            home = homeEnv;
          }
          let configFilePath = `${home}/.newzzer.json`;
          try {
            //   try to read ~/.newzzer.json
            let file = deps_ts_2.readJsonSync(configFilePath);
            if (typeof file === "object" && file !== null) {
              let configFile = file;
              if (configFile.apiKey) {
                return configFile.apiKey;
              } //   If apiKey not present in file show error
              else {
                error_ts_1.displayHelpAndQuit(
                  "apiKey not found in the config file ",
                );
              }
            }
          } catch (err) {
            //    if file is not present, show error message and quit
            error_ts_1.displayHelpAndQuit(
              "Config file not present. Use --config to set apiKey",
            );
          }
        };
        displayBanner = () => {
          // Clears the terminal
          console.clear();
          console.log(deps_ts_2.bold("---------------"));
          console.log(deps_ts_2.bold(deps_ts_2.green(`
   Newzzer
`)));
          console.log(deps_ts_2.bold("---------------"));
          console.log(
            deps_ts_2.bold(
              deps_ts_2.green(
                `\nFind your quick news byte at your terminal. Powered by News API\n`,
              ),
            ),
          );
        };
        displayArticles = (news) => {
          if (news.length === 0) {
            console.log(
              deps_ts_2.magenta(`Uh Oh! Looks like we cannot find any news`),
            );
          }
          news.forEach((article, i) => {
            console.log(
              deps_ts_2.bold(
                deps_ts_2.magenta(`   ${i + 1}\t${article.title}`),
              ),
            );
            if (article.description) {
              console.log(`\t${article.description}`);
            }
            if (article.url) {
              console.log(
                deps_ts_2.cyan(
                  `${deps_ts_2.bold(`\tMore info:`)} ${article.url}\n`,
                ),
              );
            }
          });
        };
        invalidCategory = (category) => {
          if (category === undefined) {
            return true;
          }
          const validCategories = new Set([
            "business",
            "entertainment",
            "general",
            "health",
            "science",
            "sports",
            "technology",
          ]);
          return !validCategories.has(category);
        };
        showFlags = (parsedArgs) => {
          let flagToName = new Map([
            ["q", "query"],
            ["c", "category"],
          ]);
          let flagsInfo = [];
          Object.keys(parsedArgs).forEach((arg) => {
            if (arg !== "_") {
              let argName = flagToName.has(arg) ? flagToName.get(arg) : arg;
              flagsInfo.push(
                `${deps_ts_2.green(`${argName}: `)}${parsedArgs[arg]}`,
              );
            }
          });
          console.log(`Getting news by- \t${flagsInfo.join("\t")}\n`);
        };
        // ***************
        // Main method
        // ***************
        if (context_10.meta.main) {
          const { args } = Deno;
          const parsedArgs = deps_ts_2.parse(args);
          displayBanner();
          //   If option to set API Key i.e. --config flag is passed
          if (parsedArgs.config) {
            setApiKey(parsedArgs);
          }
          //   otherwise Check for API key
          let apiKey = getApiKey();
          const apiClient = new api_ts_1.default(apiKey);
          //   Show flags passed as inputs if not config and other flag is set
          if (
            parsedArgs.config === undefined &&
            args.length !== 0 &&
            !parsedArgs.help &&
            !parsedArgs.h
          ) {
            showFlags(parsedArgs);
          }
          //   Check if all flags are valid
          if (parsedArgs.category) {
            let error = invalidCategory(parsedArgs.category);
            if (error) {
              error_ts_1.displayHelpAndQuit("Invalid category value found");
            }
          }
          if (args.length === 0 || parsedArgs.h || parsedArgs.help) {
            error_ts_1.displayHelpAndQuit();
          } else if (
            parsedArgs.c ||
            parsedArgs.category ||
            parsedArgs.query ||
            parsedArgs.q
          ) {
            let category = parsedArgs.category || parsedArgs.c;
            let query = parsedArgs.query || parsedArgs.q;
            let newsResponse = await apiClient.getNews(category, query);
            if (typeof newsResponse === "object") {
              displayArticles(newsResponse);
            } else {
              error_ts_1.displayHelpAndQuit(newsResponse);
            }
          } else {
            error_ts_1.displayHelpAndQuit("Invalid argument");
          }
        }
      },
    };
  },
);

await __instantiateAsync("file:///C:/Users/Terkwaz/Desktop/Deno-CLI/mod");
