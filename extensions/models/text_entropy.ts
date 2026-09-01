/**
 * Computes the Shannon entropy of a piece of text.
 *
 * @module
 */
import { z } from "npm:zod@4";

/** Global arguments: the text whose entropy we measure. */
const GlobalArgsSchema = z.object({
  text: z.string().describe("The text to measure entropy for"),
});

/** Shape of the stored entropy result. */
const ResultSchema = z.object({
  text: z.string(),
  length: z.number(),
  uniqueChars: z.number(),
  bitsPerChar: z.number(),
  totalBits: z.number(),
});

/**
 * Returns the Shannon entropy of `text` in bits per character.
 *
 * @param text The input string.
 * @returns Entropy in bits per character; `0` for an empty string.
 */
function shannonEntropy(text: string): number {
  if (text.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const char of text) {
    counts.set(char, (counts.get(char) ?? 0) + 1);
  }
  let entropy = 0;
  for (const count of counts.values()) {
    const p = count / text.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/** Model definition for measuring text entropy. */
export const model = {
  type: "@riethmayer/text-entropy",
  version: "2026.09.01.1",

  globalArguments: GlobalArgsSchema,

  resources: {
    result: {
      description: "Shannon entropy statistics for the configured text",
      schema: ResultSchema,
      lifetime: "infinite" as const,
      garbageCollection: 10,
    },
  },

  methods: {
    analyze: {
      description: "Measure the Shannon entropy of the configured text",
      arguments: z.object({}),
      execute: async (
        _args: Record<string, unknown>,
        context: {
          globalArgs: z.infer<typeof GlobalArgsSchema>;
          writeResource: (
            spec: string,
            name: string,
            data: z.infer<typeof ResultSchema>,
          ) => Promise<{ name: string }>;
        },
      ): Promise<{ dataHandles: { name: string }[] }> => {
        const { text } = context.globalArgs;
        const bitsPerChar = shannonEntropy(text);
        const uniqueChars = new Set(text).size;

        const handle = await context.writeResource("result", "result", {
          text,
          length: text.length,
          uniqueChars,
          bitsPerChar: Math.round(bitsPerChar * 1000) / 1000,
          totalBits: Math.round(bitsPerChar * text.length * 1000) / 1000,
        });

        return { dataHandles: [handle] };
      },
    },
  },
};
