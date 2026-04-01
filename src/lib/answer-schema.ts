import { z } from "zod";

/**
 * Structured answer payload (GST-3 plan §3); validated server-side before UI.
 */
export const answerSectionsSchema = z.object({
  situation: z.string().min(1),
  task: z.string().min(1),
  action: z.string().min(1),
  result: z.string().min(1),
  citations: z
    .array(
      z.object({
        chunkId: z.string().min(1),
        label: z.string().optional(),
      })
    )
    .default([]),
});

export type AnswerSections = z.infer<typeof answerSectionsSchema>;

export function parseAnswerSections(json: unknown): AnswerSections {
  return answerSectionsSchema.parse(json);
}
