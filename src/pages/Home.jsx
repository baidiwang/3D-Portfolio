import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import { Typewriter } from "react-simple-typewriter";

import { HomeInfo, Loader } from "../components";
import { SpaceStation } from "../models/spaceStation.jsx";
import { Space } from "../models/Space.jsx";

const Home = () => {
  const [currentStage, setCurrentStage] = useState(null);
  const [isRotating, setIsRotating] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showTypewriter, setShowTypewriter] = useState(true);

  useEffect(() => {
    if (currentStage === 0) {
      setShowTypewriter(true);
    }
  }, [currentStage]);

  const adjustSpaceStationForScreenSize = () => {
    let screenScale, screenPosition;

    if (window.innerWidth < 768) {
      screenScale = [0.9, 0.9, 0.9];
      screenPosition = [0, 0, 0];
    } else {
      screenScale = [1, 1, 1];
      screenPosition = [0, 0, 0];
    }

    return [screenScale, screenPosition];
  };

  const [spaceStationScale, spaceStationPosition] =
    adjustSpaceStationForScreenSize();

  useEffect(() => {
    const handleTouchOutside = (e) => {
      if (window.innerWidth >= 768) return;

      const target = e.target;
      if (target.closest(".info-box a")) {
        return;
      }
      if (e.target.closest(".info-box")) return;

      setCurrentStage(null);
    };

    document.addEventListener("pointerdown", handleTouchOutside, {
      capture: true,
    });

    return () => {
      document.removeEventListener("pointerdown", handleTouchOutside, true);
    };
  }, [currentStage]);

  return (
    <section className="w-full h-screen relative overflow-hidden">
      {!currentStage && (
        <div className="absolute top-24 left-0 right-0 z-10 flex items-center justify-center">
          {isLoaded && showTypewriter && (
            <h1 className="font-mono text-white text-center text-2xl sm:text-2xl font-bold leading-snug">
              <Typewriter
                words={["Hi, I'm Baidi", "A UX/Design Engineer in NYC"]}
                loop={false}
                cursor
                cursorStyle="_"
                typeSpeed={50}
                deleteSpeed={30}
                delaySpeed={1200}
              />
            </h1>
          )}
        </div>
      )}
      <div className="absolute top-28 left-0 right-0 z-50 flex items-center justify-center pointer-events-auto">
        {currentStage && (
          <HomeInfo
            currentStage={currentStage}
            setCurrentStage={setCurrentStage}
          />
        )}
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none">
        <Canvas
          className={`w-full h-screen bg-transparent ${
            isRotating ? "cursor-grabbing" : "cursor-grab"
          }`}
          camera={{ near: 0.1, far: 1000, position: [0, 0, 50] }}
        >
          <Suspense fallback={<Loader />}>
            <directionalLight position={[1, 1, 1]} intensity={2} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 5, 10]} intensity={2} />
            <spotLight
              position={[0, 50, 10]}
              angle={0.15}
              penumbra={1}
              intensity={2}
            />
            <hemisphereLight
              skyColor="#b1e1ff"
              groundColor="#000000"
              intensity={1}
            />

            <Space isRotating={isRotating} />
            <SpaceStation
              isRotating={isRotating}
              setIsRotating={setIsRotating}
              currentStage={currentStage}
              setCurrentStage={setCurrentStage}
              rotation={[0.1, 6.15, 0]}
              setIsLoaded={setIsLoaded}
              setShowTypewriter={setShowTypewriter}
            />
          </Suspense>
        </Canvas>
      </div>
    </section>
  );
};

export default Home;
