// Shared typed errors. Routes map these to status codes; messages are safe to
// show the client (no internals).

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

export class AuthError extends Error {
  constructor(message = 'Not authenticated.') {
    super(message);
    this.name = 'AuthError';
    this.statusCode = 401;
  }
}

export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
  }
}
