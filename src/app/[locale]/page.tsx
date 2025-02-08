"use client"
import CanvasContainer from "@/components/CanvasContainer";
import Overlay from "@/components/Overlay/Overlay";
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { useEffect, useState } from "react";

function Home() {
  const [windowsReady, setWindowsReady] = useState<boolean>(false)
  const setPlayerId = async () => {
    try {
      let data = await fetch('/api/ping')
      let response = await data.json()
    } catch (err) {

    }
  }

  useEffect(() => {
    setPlayerId()
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowsReady(true)
    }
  }, [])

  return (
    <main>
      <Analytics />
      <SpeedInsights />
      <div className="fixed top-0 left-0 w-full h-full">
        {windowsReady && <CanvasContainer />}
        <Overlay />
      </div>
    </main>
  );
}

export default Home