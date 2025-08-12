/**
 * Refer to the following link:
 * https://usehooks-typescript.com/react-hook/use-on-click-outside
 */

import { RefObject, useEffect } from "react";

type AnyEvent = MouseEvent | TouchEvent;

function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: AnyEvent) => void,
  excludeSelectors?: string[],
  disabled = false,
): void {
  useEffect(() => {
    const listener = (event: AnyEvent) => {
      const el = ref?.current;
      const target = event.target as Element;

      // Do nothing if clicking ref's element or descendent elements
      if (!el || el.contains(event.target as Node)) {
        return;
      }

      if (disabled) {
        return;
      }

      if (excludeSelectors && excludeSelectors.length > 0) {
        for (const selector of excludeSelectors) {
          if (target.closest(selector)) {
            return;
          }
        }
      }
      handler(event);
    };

    document.addEventListener(`mousedown`, listener);
    document.addEventListener(`touchstart`, listener);

    return () => {
      document.removeEventListener(`mousedown`, listener);
      document.removeEventListener(`touchstart`, listener);
    };

    // Reload only if ref or handler changes
  }, [ref, handler, excludeSelectors, disabled]);
}

export default useOnClickOutside;
