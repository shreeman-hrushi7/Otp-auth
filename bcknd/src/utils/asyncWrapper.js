/**
 * Wraps an async route handler so any rejected promise
 * is forwarded to Express's next(err) automatically.
 *
 * Usage:
 *   router.post('/route', asyncWrapper(async (req, res, next) => { ... }));
 */
const asyncWrapper = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncWrapper;
