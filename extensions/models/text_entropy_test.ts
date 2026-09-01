/**
 * Tests for the text-entropy model.
 *
 * @module
 */
import { assertEquals } from "jsr:@std/assert@1";
import { model } from "./text_entropy.ts";

/** Result of running `analyze` against a stubbed write context. */
interface AnalyzeRun {
  writes: { spec: string; name: string; data: Record<string, unknown> }[];
  result: { dataHandles: { name: string }[] };
}

/** Runs the analyze method with `text`, capturing resource writes. */
async function runAnalyze(text: string): Promise<AnalyzeRun> {
  const writes: AnalyzeRun["writes"] = [];
  const result = await model.methods.analyze.execute({}, {
    globalArgs: { text },
    writeResource: (spec, name, data) => {
      writes.push({ spec, name, data });
      return Promise.resolve({ name });
    },
  });
  return { writes, result };
}

Deno.test("analyze writes a result matching the resource schema", async () => {
  const { writes, result } = await runAnalyze("hello world");
  assertEquals(writes.length, 1);
  assertEquals(writes[0].spec, "result");
  assertEquals(writes[0].name, "result");
  model.resources.result.schema.parse(writes[0].data);
  assertEquals(result.dataHandles, [{ name: "result" }]);
});

Deno.test("empty string yields zero entropy", async () => {
  const { writes } = await runAnalyze("");
  assertEquals(writes[0].data, {
    text: "",
    length: 0,
    uniqueChars: 0,
    bitsPerChar: 0,
    totalBits: 0,
  });
});

Deno.test("single repeated character yields zero entropy", async () => {
  const { writes } = await runAnalyze("aaaa");
  assertEquals(writes[0].data, {
    text: "aaaa",
    length: 4,
    uniqueChars: 1,
    bitsPerChar: 0,
    totalBits: 0,
  });
});

Deno.test("two equally likely characters yield one bit per character", async () => {
  const { writes } = await runAnalyze("abab");
  assertEquals(writes[0].data.bitsPerChar, 1);
  assertEquals(writes[0].data.totalBits, 4);
  assertEquals(writes[0].data.uniqueChars, 2);
});

Deno.test("four equally likely characters yield two bits per character", async () => {
  const { writes } = await runAnalyze("abcd");
  assertEquals(writes[0].data.bitsPerChar, 2);
  assertEquals(writes[0].data.totalBits, 8);
});

Deno.test("skewed distribution rounds to three decimals", async () => {
  const { writes } = await runAnalyze("aab");
  assertEquals(writes[0].data.bitsPerChar, 0.918);
  assertEquals(writes[0].data.totalBits, 2.755);
});

Deno.test("astral characters count once per code point", async () => {
  const { writes } = await runAnalyze("😀😀");
  assertEquals(writes[0].data, {
    text: "😀😀",
    length: 2,
    uniqueChars: 1,
    bitsPerChar: 0,
    totalBits: 0,
  });
});

Deno.test("mixed astral and ASCII text uses code points throughout", async () => {
  const { writes } = await runAnalyze("😀a");
  assertEquals(writes[0].data, {
    text: "😀a",
    length: 2,
    uniqueChars: 2,
    bitsPerChar: 1,
    totalBits: 2,
  });
});
