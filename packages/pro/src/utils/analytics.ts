import Plausible from "plausible-tracker";

const { enableAutoPageviews } = Plausible({
  trackLocalhost: false,
});

export { enableAutoPageviews };
