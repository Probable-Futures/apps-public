import { useEffect } from "react";

function useFilterPanelWatcher() {
  useEffect(() => {
    const updateBodyClass = () => {
      const exists = !!document.querySelector(".filter-panel");
      document.body.classList.toggle("has-filter-panel", exists);
    };

    updateBodyClass();

    const observer = new MutationObserver(updateBodyClass);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);
}

export default useFilterPanelWatcher;
