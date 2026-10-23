import { z } from "zod";

const ResultSchema = z.object({
  items: z.array(z.string().min(1)),
}).strict();

type Result = z.infer<typeof ResultSchema>;