import { toBlob } from "html-to-image";

interface ShareExportOptions {
  width: number;
  height: number;
  backgroundColor?: string;
}

export async function createShareCardBlob(node: HTMLElement, options: ShareExportOptions) {
  const blob = await toBlob(node, {
    cacheBust: true,
    pixelRatio: 2,
    canvasWidth: options.width,
    canvasHeight: options.height,
    backgroundColor: options.backgroundColor ?? "transparent",
  });

  if (!blob) {
    throw new Error("Could not generate share card image.");
  }

  return blob;
}

export async function downloadBlobAsPng(blob: Blob, filename = "liber-reading-activity.png") {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadShareCard(node: HTMLElement, options: ShareExportOptions, filename?: string) {
  const blob = await createShareCardBlob(node, options);
  await downloadBlobAsPng(blob, filename);
}

export async function shareCardImage(
  node: HTMLElement,
  {
    title,
    text,
    exportOptions,
    filename = "liber-reading-activity.png",
  }: { title: string; text: string; exportOptions: ShareExportOptions; filename?: string },
) {
  const blob = await createShareCardBlob(node, exportOptions);
  const file = new File([blob], filename, { type: "image/png" });

  if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title, text });
    return "shared";
  }

  await downloadBlobAsPng(blob, filename);
  return "downloaded";
}
