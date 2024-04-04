import Plausible from "plausible-tracker";

const { trackEvent } = Plausible({
  trackLocalhost: false,
});

export { trackEvent };
