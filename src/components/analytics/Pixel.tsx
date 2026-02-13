'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function Pixel() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (pathname && FB_PIXEL_ID) {
            import('react-facebook-pixel')
                .then((x) => x.default)
                .then((ReactPixel) => {
                    ReactPixel.init(FB_PIXEL_ID as string);
                    ReactPixel.pageView();
                });
        }
    }, [pathname, searchParams]);

    return (
        <>
            {/* Google Analytics */}
            {GA_ID && (
                <>
                    <script
                        async
                        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
                    />
                    <script
                        dangerouslySetInnerHTML={{
                            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `,
                        }}
                    />
                </>
            )}
        </>
    );
}
