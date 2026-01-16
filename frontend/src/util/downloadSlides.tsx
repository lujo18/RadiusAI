import JSZip from "jszip";
import { saveAs } from "file-saver";
// Download all slide images (excluding thumbnail) as a zip file
export async function downloadSlides(post: any) {
  const storageUrls = post.storage_urls as any;
  if (!storageUrls || !Array.isArray(storageUrls.slides)) return;
  const slidesArr = storageUrls.slides;
  const zip = new JSZip();
  const mainFolder = zip.folder("main");
  const slidesFolder = mainFolder?.folder("slides");

  for (let i = 0; i < slidesArr.length; i++) {
    const url = slidesArr[i];
    if (typeof url === "string" && url) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.error(`Failed to fetch ${url}: ${response.status}`);
          continue;
        }
        const blob = await response.blob();
        slidesFolder?.file(`slide-${i}${getFileExtension(url)}`, blob);
      } catch (e) {
        console.error(`Error fetching ${url}:`, e);
      }
    } else {
      console.warn(`Invalid slide URL at index ${i}:`, url);
    }
  }
  // Add caption.txt file in main/
  const caption = post.content?.caption || "";
  const hashtags = Array.isArray(post.content?.hashtags) ? "#" + post.content.hashtags.join(" #") : "";
  const captionText = `${caption}\n\n${hashtags}`;
  mainFolder?.file("caption.txt", captionText);
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `${post.id}_slides.zip`);
}


function getFileExtension(url: string) {
  const match = url.match(/\.[a-zA-Z0-9]+(?=($|\?))/);
  return match ? match[0] : "";
}