export const getUrlExtension = (url: string) => {
  const extension = url.split(/[#?]/)[0].split(".").pop();
  return extension ? extension.trim() : "";
};
