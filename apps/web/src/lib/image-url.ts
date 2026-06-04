/** Cloudinary transform for faster, smaller delivery. Pass-through for other URLs. */
export function optimizedImageUrl(url: string, width = 640): string {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }
  if (url.includes("/upload/w_")) return url;
  return url.replace("/upload/", `/upload/w_${width},c_limit,q_auto,f_auto/`);
}
