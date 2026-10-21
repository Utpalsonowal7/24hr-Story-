import { imageDimensions, type StoryImage } from "./stories";

export const MAX_FILE_SIZE = 20 * 1024 * 1024;
export const ACCEPTED_IMAGES =
  "image/jpeg,image/png,image/webp,image/avif,image/gif";

export async function prepareImage(file: File): Promise<StoryImage> {
  if (!ACCEPTED_IMAGES.split(",").includes(file.type)) {
    throw new Error("Choose a JPG, PNG, WebP, AVIF, or GIF image.");
  }
  if (!file.size || file.size > MAX_FILE_SIZE)
    throw new Error("Choose an image smaller than 20 MB.");
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    try {
      await img.decode();
    } catch {
      throw new Error("We couldn’t open this image. Try another file.");
    }
    const dimensions = imageDimensions(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("Your browser does not support image processing.");
    context.drawImage(img, 0, 0, dimensions.width, dimensions.height);
    let dataUrl = "";
    // Keep each base64 story compact enough for several moments in localStorage.
    for (const quality of [0.85, 0.7, 0.55, 0.4]) {
      dataUrl = canvas.toDataURL("image/webp", quality);
      if (dataUrl.length <= 600_000) break;
    }
    if (
      !/^data:image\/(webp|png);base64,/.test(dataUrl) ||
      dataUrl.length > 1_200_000
    ) {
      throw new Error(
        "This image is too detailed to save. Try a smaller image.",
      );
    }
    return { ...dimensions, dataUrl, name: file.name.slice(0, 100) };
  } finally {
    URL.revokeObjectURL(url);
  }
}
