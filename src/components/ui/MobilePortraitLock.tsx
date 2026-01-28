'use client'

export default function MobilePortraitLock() {
    return (
        <style jsx global>{`
            @media screen and (orientation: landscape) and (max-height: 600px) {
                html {
                    transform: rotate(-90deg);
                    transform-origin: left top;
                    width: 100vh;
                    height: 100vw;
                    overflow-x: hidden;
                    position: absolute;
                    top: 100%;
                    left: 0;
                }
                body {
                    height: 100vw;
                    width: 100vh;
                }
            }
        `}</style>
    )
}
