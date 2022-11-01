declare global {
  interface Window {
    _hsq: any;
  }
}

export const trackPageView = (email, path = null) => {
  var _hsq = (window._hsq = window._hsq || []);
  _hsq.push(["identify", { email: email }]);
  if (path) {
    _hsq.push(["setPath", path]);
  }
  _hsq.push(["trackPageView"]);
};
