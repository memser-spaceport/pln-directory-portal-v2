export function extractImagesAndClean(text: string): { images: string[]; cleanedText: string } {
  const imageRegex = /\[image:\s*([^\]]+)\]/g;

  const images: string[] = [];
  const cleanedText = text.replace(imageRegex, (_, imageName) => {
    images.push(imageName.trim());
    return ''; // remove from original string
  });

  return {
    images,
    cleanedText: cleanedText.trim().replace(/\s+/g, ' '), // clean up extra whitespace
  };
}
