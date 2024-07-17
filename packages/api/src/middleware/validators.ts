import { RequestHandler } from "express";
import validators from "../schema/validators";

export const validatePost = (name: string): RequestHandler => {
  const validate = validators[name];
  if (!validate) {
    throw new Error(`no validator found for ${name}`);
  }

  return (req, res, next) => {
    const { body } = req;
    if (!validate(body)) {
      res.status(422);
      return res.json({
        errors: validate.errors.map((err) => JSON.stringify(err)),
      });
    }
    next();
  };
};

export const validateFormData = (name: string): RequestHandler => {
  const validate = validators[name];
  if (!validate) {
    throw new Error(`no validator found for ${name}`);
  }

  return (req, res, next) => {
    if (!req.is("multipart/form-data")) {
      return res.status(422).json({
        errors: ["Expected multipart/form-data content-type"],
      });
    }

    const { body, files } = req;
    const allFields = {};
    for (const [key, value] of Object.entries(body)) {
      const fval = Number.parseFloat(value as string);
      if (!Number.isNaN(fval)) {
        allFields[key] = fval;
      } else if (value === "true" || value === "false") {
        allFields[key] = value === "true";
      } else {
        allFields[key] = value;
      }
    }
    if (Array.isArray(files)) {
      for (const file of files) {
        // we don't need to validate the file contents, just that it is there
        allFields[file.fieldname] = "dummy";
      }
    }

    if (!validate(allFields)) {
      res.status(422);
      return res.json({
        errors: validate.errors.map((err) => JSON.stringify(err)),
      });
    }
    next();
  };
};
