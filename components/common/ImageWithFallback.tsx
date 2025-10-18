'use client';

import Image from 'next/image';
import { ComponentProps, useState } from 'react';

interface Props extends ComponentProps<typeof Image> {
  fallbackSrc: string;
}

export default function ImageWithFallback(props: Props) {
  const { src: pSrc, fallbackSrc, ...rest } = props;

  const [src, setSrc] = useState(pSrc);

  return <Image src={src} {...rest} onError={() => setSrc(fallbackSrc)} />;
}
