// Stub thing to call when we don't want the whole frontend there
export default function () {
  return (req, res, next) => {
    next();
  };
}
