import { z } from "zod";
import { InfraiClient } from "./infrai_client.ts";

export const matterIntake = z.object({
  matterId: z.string().min(1),
  sourceImage: z.string().min(1),
  filename: z.string().min(1),
  signedDocumentDelivery: z.boolean(),
  deadlineFollowUp: z.boolean()
});
export type MatterIntake = z.infer<typeof matterIntake>;

export async function createMatterThumbnail(input: MatterIntake, client: InfraiClient) {
  const matter = matterIntake.parse(input);
  await client.request("/v1/storage/bucket/create", "POST", { name: "legal-matter-assets" });
  const uploaded = await client.request<{ id: string }>("/v1/image/upload", "POST", {
    file: matter.sourceImage,
    filename: matter.filename
  });
  const thumbnail = await client.request<{ url?: string; id?: string }>("/v1/image/resize", "POST", {
    image: uploaded.id,
    width: 640,
    height: 360,
    fit: "cover",
    enlarge: false,
    format: "webp",
    store: true
  });
  return {
    matterId: matter.matterId,
    thumbnail,
    deliveryReady: matter.signedDocumentDelivery,
    followUpReady: matter.deadlineFollowUp
  };
}

if (import.meta.main) {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("Set INFRAI_API_KEY before starting the service");
  const result = await createMatterThumbnail({
    matterId: "matter-demo-001",
    sourceImage: process.env.SOURCE_IMAGE ?? "data:image/jpeg;base64,",
    filename: "signed-intake.jpg",
    signedDocumentDelivery: true,
    deadlineFollowUp: true
  }, new InfraiClient(key));
  console.log(JSON.stringify(result, null, 2));
}
