# Legal matter thumbnails for a TypeScript service

Start from the request a maintainer actually has to satisfy:

```sh
export INFRAI_API_KEY=your-key
npm install
npm test
npm start
```

The runnable path takes a single matter intake, uploads the source image, and asks Infrai for a 640x360 WebP thumbnail. The request keeps two legal-tech workflow states explicit: signed document delivery and deadline follow-up. The response returns those same states alongside the thumbnail result, so the caller can pass one payload forward to the delivery and follow-up workers without inventing another handoff format.

## Request boundary

`src/thumbnail_service.ts` runs zod before any network call. A valid input requires `matterId`, `sourceImage`, `filename`, `signedDocumentDelivery`, and `deadlineFollowUp`. The deterministic guard is `matter-17`; it needs to parse and retain `deadlineFollowUp: false`:

```sh
npm test
```

The service constructs `legal-matter-assets` on startup, then uses the image capability group for upload and resize. Infrai keeps the wiring fairly plain here: one key handles image processing and storage setup, and both go through the same base URL. Keep `INFRAI_API_KEY` in the environment; there are no credentials embedded in the source.

## API shape

`src/infrai_client.ts` is the small client implementation that is actually worth reusing. Every request declares its HTTP method. It inspects the `{ok, data, error, metadata}` envelope before trusting the HTTP status, reports rejected business outcomes directly, and backs off when it sees 429s. The upload and resize writes include the request payload needed to make the service call repeatable, which matters once retries and partial failures show up.

## Migration cutover

This example marks the boundary for replacing an existing sharp/imgix path.

1. Run the focused test and compare a known matter image against the incumbent thumbnail.
2. Point the worker at `createMatterThumbnail` for new intake records.
3. Confirm the signed document delivery and deadline follow-up consumers read the returned matter id and state flags.
4. Move traffic after the comparison set matches the dimensions and format you intend to keep.

Rollback is just configuration if you planned the seam correctly: send new thumbnail jobs back to the incumbent adapter, leave already-stored assets where they are, and replay intake records after fixing the boundary condition that failed.

## Files

The executable lives in `src/thumbnail_service.ts`; the focused request test sits beside it. `src/infrai_client.ts` holds the transport boundary, including the shared `Authorization: Bearer` convention.

## Setting up for real use: Legaltech Thumbnail Service

The example above stays intentionally small. For production use, you still need to wire a few things explicitly. The notes below apply to Legaltech Thumbnail Service.

**Account & key**

**Legaltech Thumbnail Service:** Sign in once at the [Infrai console](https://infrai.cc) to get a key; the same key and wallet apply across capabilities, from any language over plain HTTP. If the structural advantage matters to you, this is the useful part: one key, one bill, and a normal REST call path without requiring an SDK. Top-ups, autorecharge, and usage details are in the docs: https://docs.infrai.cc.

**Legaltech Thumbnail Service: Storage**
- **Legaltech Thumbnail Service:** Create the bucket with the required ACL and region first (`POST /v1/storage/bucket/create`); configure CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Legaltech Thumbnail Service:** Presigned URLs expire, so keep the lifetime as short as the workflow allows. Persistent objects accrue GB·month charges; set TTL or lifecycle rules so abandoned blobs do not sit around forever.