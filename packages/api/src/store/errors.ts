class APIError extends Error {
  type: string;
  status: number;
}

export function isAPIError(err: any): err is APIError {
  if (typeof err?.status !== "number") {
    return false;
  }
  return err.status >= 400 && err.status <= 599;
}

export class BadRequestError extends APIError {
  constructor(message) {
    super(message);
    this.type = "BadRequestError";
    this.status = 400;
  }
}

export class UnprocessableEntityError extends APIError {
  constructor(message) {
    super(message);
    this.type = "UnprocessableEntityError";
    this.status = 422;
  }
}

export class NotFoundError extends APIError {
  constructor(message) {
    super(message);
    this.type = "NotFoundError";
    this.status = 404;
  }
}

export class ForbiddenError extends APIError {
  constructor(message) {
    super(message);
    this.type = "ForbiddenError";
    this.status = 403;
  }
}

export class InternalServerError extends APIError {
  constructor(message) {
    super(message);
    this.type = "InternalServerError";
    this.status = 500;
  }
}
