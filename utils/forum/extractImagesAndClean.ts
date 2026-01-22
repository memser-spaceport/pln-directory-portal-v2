/**
 * Extracts image references and cleans the text content.
 */
export function extractImagesAndClean(text: string): { images: string[]; cleanedText: string } {
  const imageRegex = /\[image:\s*([^\]]+)\]/g;

  const images: string[] = [];
  const cleanedText = text.replace(imageRegex, (_, imageName) => {
    images.push(imageName.trim());
    return '';
  });

  return {
    images,
    cleanedText: cleanedText.trim().replace(/\s+/g, ' '),
  };
}
