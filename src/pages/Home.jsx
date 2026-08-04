import { Canvas } from "@react-three/fiber";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { Suspense, useEffect, useRef, useState } from "react";

import { HomeInfo, Loader } from "../components";
import { SpaceStation } from "../models/spaceStation.jsx";
import { Space } from "../models/Space.jsx";

const Home = () => {
  const [currentStage, setCurrentStage] = useState(null);
  const [isRotating, setIsRotating] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);

  useEffect(() => {
    if (currentStage === 0) {
      setShowGreeting(true);
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
    <MotionConfig reducedMotion="user">
      <section className="w-full h-screen relative overflow-hidden">
        {!currentStage && (
          <div className="absolute top-24 left-0 right-0 z-10 flex items-center justify-center">
            <AnimatePresence>
              {isLoaded && showGreeting && (
                <motion.h1
                  key="greeting"
                  className="font-accent text-white text-center text-[40px] leading-none"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }}
                  exit={{ opacity: 0, transition: { duration: 0.25 } }}
                >
                  Baidi Wang
                </motion.h1>
              )}
            </AnimatePresence>
          </div>
        )}
        <div className="absolute top-28 left-0 right-0 z-50 flex items-center justify-center pointer-events-auto">
          <AnimatePresence mode="wait">
            {currentStage && (
              <HomeInfo
                key={currentStage}
                currentStage={currentStage}
                setCurrentStage={setCurrentStage}
              />
            )}
          </AnimatePresence>
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
                setShowGreeting={setShowGreeting}
              />
            </Suspense>
          </Canvas>
        </div>
      </section>
    </MotionConfig>
  );
};

export default Home;
