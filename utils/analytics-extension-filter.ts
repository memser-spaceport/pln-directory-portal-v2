const EXTENSION_SCHEMES = ['chrome-extension://', 'moz-extension://', 'safari-web-extension://'];

function isExtensionFrame(frame: any): boolean {
  const filename: string = frame?.filename ?? frame?.source ?? '';
  return EXTENSION_SCHEMES.some((scheme) => filename.startsWith(scheme));
}

// Returns true when every stack frame of an exception resolves to a browser
// extension. Such exceptions are thrown by injected extension scripts, not by
// the directory, so we drop them before capture.
export function isBrowserExtensionException(properties: any): boolean {
  const exceptionList = properties?.$exception_list;
  if (!Array.isArray(exceptionList) || exceptionList.length === 0) {
    return false;
  }

  const frames = exceptionList.flatMap((exception: any) => exception?.stacktrace?.frames ?? []);
  if (frames.length === 0) {
    return false;
  }

  return frames.every(isExtensionFrame);
}
