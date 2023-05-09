# Studio API Schema

Our API schema is generated from the 2 YAML files in this repository:

- `api-schema.yaml` - the schema file for our public API
- `db-schema.yaml` - the schema file for internal fields we use in our code

These 2 files are deep merged on a key-by-key basis to generate the final schema
file, with `api-schema.yaml` going first (so `db-schema` can override values).
It is recursive, so if you want to set only 1 key in a nested object you can set
only that and all the other fields in the objects will be left intact.

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
