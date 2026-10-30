import assert from "node:assert/strict";
import { matterIntake } from "./thumbnail_service.ts";

const parsed = matterIntake.safeParse({
  matterId: "matter-17",
  sourceImage: "data:image/jpeg;base64,abc",
  filename: "signed-order.jpg",
  signedDocumentDelivery: true,
  deadlineFollowUp: false
});
assert.equal(parsed.success, true);
assert.equal(parsed.success && parsed.data.matterId, "matter-17");
assert.equal(parsed.success && parsed.data.deadlineFollowUp, false);
console.log("matter-17 accepts a thumbnail request and preserves follow-up state");
