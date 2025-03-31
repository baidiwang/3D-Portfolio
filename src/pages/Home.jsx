import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import { Typewriter } from "react-simple-typewriter";

import sakura from "../assets/sakura.mp3";
import { HomeInfo, Loader } from "../components";
import { soundoff, soundon } from "../assets/icons";
import { SpaceStation } from "../models/SpaceStation.jsx";
import { Space } from "../models/Space.jsx";

const Home = () => {
  const audioRef = useRef(new Audio(sakura));
  audioRef.current.volume = 0.4;
  audioRef.current.loop = true;

  const [currentStage, setCurrentStage] = useState(null);
  const [isRotating, setIsRotating] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showTypewriter, setShowTypewriter] = useState(true);

  useEffect(() => {
    if (currentStage === 0) {
      setShowTypewriter(true);
    }
  }, [currentStage]);

  useEffect(() => {
    if (isPlayingMusic) {
      audioRef.current.play();
    }

    return () => {
      audioRef.current.pause();
    };
  }, [isPlayingMusic]);

  const adjustBiplaneForScreenSize = () => {
    let screenScale, screenPosition;

    // If screen width is less than 768px, adjust the scale and position
    if (window.innerWidth < 768) {
      screenScale = [1.5, 1.5, 1.5];
      screenPosition = [0, -1.5, 0];
    } else {
      screenScale = [3, 3, 3];
      screenPosition = [0, -4, -4];
    }

    return [screenScale, screenPosition];
  };

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

  // const [biplaneScale, biplanePosition] = adjustBiplaneForScreenSize();
  const [spaceStationScale, spaceStationPosition] =
    adjustSpaceStationForScreenSize();

  return (
    <section className="w-full h-screen relative">
      {!currentStage && (
        <div className="absolute top-24 left-0 right-0 z-10 flex items-center justify-center">
          {/* <h1 className="text-white text-center px-4 sm:text-2xl text-lg leading-snug">
            Hi, I'm <span className="font-semibold">Baidi</span> 👋
            <br />A Design Engineer in NYC 🗽
          </h1> */}

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
                onTypeDone={() => setShowButtons(true)}
              />
            </h1>
          )}
        </div>
      )}
      <div className="absolute top-28 left-0 right-0 z-10 flex items-center justify-center">
        {currentStage && (
          <HomeInfo
            currentStage={currentStage}
            setCurrentStage={setCurrentStage}
          />
        )}
      </div>

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
            setCurrentStage={setCurrentStage}
            // position={islandPosition}
            rotation={[0.1, 6.15, 0]}
            // scale={islandScale}
            setIsLoaded={setIsLoaded}
            setShowTypewriter={setShowTypewriter}
          />
        </Suspense>
      </Canvas>

      {/* <div className="absolute bottom-2 left-2">
        <img
          src={!isPlayingMusic ? soundoff : soundon}
          alt="jukebox"
          onClick={() => setIsPlayingMusic(!isPlayingMusic)}
          className="w-10 h-10 cursor-pointer object-contain"
        />
      </div> */}
    </section>
  );
};

export default Home;
