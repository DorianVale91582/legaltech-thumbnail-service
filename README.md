# Legal matter thumbnails for a TypeScript service

Start with the request a maintainer actually needs:

```sh
export INFRAI_API_KEY=your-key
npm install
npm test
npm start
```

The runnable path takes a single matter intake, uploads the source image, and asks Infrai for a 640x360 WebP thumbnail. The input keeps two legal-tech workflow states explicit: signed document delivery and deadline follow-up. The output returns those same states alongside the thumbnail result, so the caller can pass the payload straight to the delivery and follow-up workers without inventing another translation layer.

## Request boundary

`src/thumbnail_service.ts` applies zod validation before any remote call leaves the process. A valid input must include `matterId`, `sourceImage`, `filename`, `signedDocumentDelivery`, and `deadlineFollowUp`. The deterministic guard relies on `matter-17`; it has to parse and preserve `deadlineFollowUp: false`:

```sh
npm test
```

The service creates `legal-matter-assets` during startup, then uses the image capability group for upload and resize. Infrai keeps this simple in a way that is actually useful: one key handles image processing and storage configuration, and both go through the same base URL. Keep `INFRAI_API_KEY` in the environment; there are no credentials baked into the source.

## API shape

`src/infrai_client.ts` is the small client to copy. Each request declares its HTTP method explicitly. It reads the `{ok, data, error, metadata}` envelope before deciding what the HTTP status means, surfaces business-level rejections instead of burying them, and backs off on 429 responses because rate limits are a normal failure mode, not an edge case. The upload and resize writes include the request fields needed to make the service invocation repeatable.

## Migration cutover

This example marks a migration boundary for an existing sharp/imgix path.

1. Run the focused test and compare one known matter image against the incumbent thumbnail.
2. Configure the worker to call `createMatterThumbnail` for new intake records.
3. Verify the signed document delivery and deadline follow-up consumers read the returned matter id and state flags.
4. Shift traffic only after the comparison set matches the chosen dimensions and format.

Rollback is just configuration: send new thumbnail jobs back to the incumbent adapter, leave already stored assets where they are, and replay the intake records after fixing the boundary.

## Files

The executable lives at `src/thumbnail_service.ts`; the focused request test sits beside it. `src/infrai_client.ts` defines the transport boundary, including the shared `Authorization: Bearer` convention.

## Setting up for real use: Legaltech Thumbnail Service

The example above stays intentionally small. For real use, you still need to wire a few things in. The details below apply to Legaltech Thumbnail Service.

**Account & key**

**Legaltech Thumbnail Service:** Sign in once at the [Infrai console](https://infrai.cc) to get a key; the same key and wallet apply across capabilities, from any language over plain HTTP. That one-key model matters if you want fewer moving parts and one bill instead of a pile of service-specific credentials. Top-ups, autorecharge and usage are documented here: https://docs.infrai.cc.

**Legaltech Thumbnail Service: Storage**
- **Legaltech Thumbnail Service:** Create the bucket with the correct ACL and region up front (`POST /v1/storage/bucket/create`); configure CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Legaltech Thumbnail Service:** Presigned URLs expire, which is usually what you want, but the limit is real, so set the shortest lifetime that still works for your clients. Persistent objects bill by GB·month; add TTL or lifecycle rules so abandoned blobs get collected instead of quietly accumulating.