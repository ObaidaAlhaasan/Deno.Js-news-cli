import { parse } from "https://deno.land/std/flags/mod.ts";
const { args } = Deno;
console.log(args);
console.log(parse(args));
