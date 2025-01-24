import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import Loader from "../components/Loader";
import spaceStation from "../models/spaceStation";

const Home = () => {
  return (
    <section className="w-full h-screen relatetive">
      <Canvas
        className="w-full h-screen bg-transparent"
        camera={{ near: 0.1, far: 1000 }}
      >
        <Suspense fallback={<Loader />}>
          <directionalLight />
          <ambientLight />
          <pointLight />
          <spotLight />
          <hemisphereLight />

          <spaceStation />
        </Suspense>
      </Canvas>
    </section>
  );
};

export default Home;
