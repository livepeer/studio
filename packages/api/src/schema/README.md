# Studio API Schema

Our API schema is generated from the 3 YAML files in this repository:

- `api-schema.yaml` - The schema file for our public API. This is the base and
  used by the code and docs/SDKs
- `ai-api-schema.yaml` - The schema for the AI Gateway APIs. This is also used
  by code and docs/SDKs, but is kept separate since it's pulled from
  `livepeer/ai-worker`.
- `db-schema.yaml` - The schema file for internal fields we use in our code.
  This is used by the code, but not for docs/SDK generation since it contains
  internal abstractions.

These files are deep merged on a key-by-key basis to generate the final schema
file, in the order specified above (the later can override the previous ones).
It is recursive, so if you want to set only 1 key in a nested object you can
specify only the nested field and all the other fields in the objects path will
be left intact.

e.g. `{a:{b:{c:d:"hello"}}}` will set only the `d` field in the `c` nested obj.

## Where to add new fields?

When creating new fields, give preference to adding them to the
`api-schema.yaml` file so they show up in our public API reference. Some
possible reasons to use `db-schema` instead:

- A non-JSON schema property that is only available in our code (e.g. `table`,
  `index`, `indexType`)
- A property that is only used internally and would have no meaning to our users
  (e.g. `userId`, `deleted`)
- A property that may contain sensitive info which we make sure to delete from
  returned objects in our code (e.g. `password`, `createdByTokenId`)
- Deprecated fields we don't want anyone using (e.g. `wowza`, `detection`)

The `ai-api-schema.yaml` file should never be edited manually. Instead, run
`yarn pull-ai-schema` to update it from the source of truth
(`livepeer/ai-worker`).

## Outputs

The schema files are used to generate the following files:

- `schema.yaml` simply the merged object from `api` and `db` schema files
- `schema.json` the JSON version of the above file, plus with JSON $refs
  dereferenced in the `components` section.
- `types.d.ts` the TypeScript types for the above JSON schema, used by our API
  server and client code.
- `validators/` folder has generated code for JSON validation. These are used in
  our API code to validate request payloads (`middleware/validators.js`)

Check `compile-schemas.js` for more details on the whole process.

## AI APIs

The flow for the AI Gateway schemas is:

- When there are changes to the upstream AI Gateway schema, a developer can run
  `yarn pull-ai-schema` to update the version in the repository with it.
- The `ai-api-schema.yaml` file is merged into the code abstractions in the
  `compile-schemas.js` script above.
- The `ai-api-schema.yaml` file is also used on the automatic SDK and docs
  generation to include the AI APIs.
