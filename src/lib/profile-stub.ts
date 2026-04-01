import { z } from "zod";

export const profileStubSchema = z.object({
  roleTitle: z.string().max(200).optional(),
  employer: z.string().max(200).optional(),
  stackNote: z.string().max(500).optional(),
});

export type ProfileStub = z.infer<typeof profileStubSchema>;
