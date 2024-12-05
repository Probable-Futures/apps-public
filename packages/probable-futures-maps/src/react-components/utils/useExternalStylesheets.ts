import { useCallback, useEffect } from "react";

const useExternalStylesheets = (useFonts: boolean) => {
  const addStylesheet = useCallback((id: string, href: string) => {
    if (!document.getElementById(id)) {
      const head = document.head;
      const firstChild = head.firstChild;
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = href;
      link.type = "text/css";
      head.insertBefore(link, firstChild);
    }
  }, []);

  useEffect(() => {
    if (useFonts) {
      const fontStylesId = "pf-font-styles";
      if (!document.getElementById(fontStylesId)) {
        const style = document.createElement("style");
        style.id = fontStylesId;
        style.type = "text/css";
        style.textContent = `
          @font-face {
            font-family: "LinearSans";
            src: url("https://pf-fonts.s3.us-west-2.amazonaws.com/LinearSans-Regular.otf") format("opentype");
            font-weight: 400;
            font-style: normal;
          }
          @font-face {
            font-family: "LinearSans";
            src: url("https://pf-fonts.s3.us-west-2.amazonaws.com/linear-sans-semibold.eot");
            src: url("https://pf-fonts.s3.us-west-2.amazonaws.com/linear-sans-semibold.eot?#iefix") format("embedded-opentype"),
                 url("https://pf-fonts.s3.us-west-2.amazonaws.com/linear-sans-semibold.woff2") format("woff2"),
                 url("https://pf-fonts.s3.us-west-2.amazonaws.com/linear-sans-semibold.woff") format("woff");
            font-weight: 600;
            font-style: normal;
          }
          @font-face {
            font-family: "RelativeMono";
            src: url("https://pf-fonts.s3.us-west-2.amazonaws.com/relative-mono-10-pitch-pro.otf") format("opentype");
            font-weight: 400;
            font-style: normal;
          }
          @font-face {
            font-family: "Cambon";
            src: url("https://pf-fonts.s3.us-west-2.amazonaws.com/Cambon-Regular.otf") format("opentype");
            font-weight: 400;
            font-style: normal;
          }
        `;
        document.head.appendChild(style);
      }
    }

    addStylesheet(
      "mapbox-gl-stylesheet",
      "https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css",
    );
  }, [useFonts]);

  return { addStylesheet };
};

export default useExternalStylesheets;
