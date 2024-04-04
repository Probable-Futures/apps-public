import { RefObject } from "react";
import { toPng } from "html-to-image";

const isSafari =
  navigator.userAgent.indexOf("Safari") > -1 && !(navigator.userAgent.indexOf("Chrome") > -1);

const saveAs = (uri: string, filename: string) => {
  const link = document.createElement("a");

  if (typeof link.download === "string") {
    link.href = uri;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    window.open(uri);
  }
};

export const exportComponentAsPNG = async (
  componentRef: RefObject<HTMLElement>,
  fileName: string,
) => {
  if (componentRef.current === null) {
    return;
  }

  if (isSafari) {
    // https://github.com/bubkoo/html-to-image/issues/147
    await toPng(componentRef.current, { cacheBust: true });
    await toPng(componentRef.current, { cacheBust: true });
  }

  const dataUrl = await toPng(componentRef.current, { cacheBust: true });
  saveAs(dataUrl, fileName);
};

export const downloadFile = (fileBlob: Blob, fileName: string) => {
  const url = URL.createObjectURL(fileBlob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
