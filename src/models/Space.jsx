import React, { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

// Slow, continuous drift — "the cosmos gently turning" — independent of the
// user drag-rotate interaction below. ~5 minutes per full rotation, so it
// reads as ambient life rather than a spinning background.
const AMBIENT_SPIN = 0.02; // rad/s
const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function Space(props) {
  const { nodes, materials } = useGLTF(
    "https://pub-900982d21fee47f8b53d6e8c8ac9a4cf.r2.dev/space.glb"
  );
  const spaceRef = useRef();

  useFrame((_, delta) => {
    if (!spaceRef.current) return;
    if (!prefersReducedMotion) {
      spaceRef.current.rotation.y += AMBIENT_SPIN * delta;
    }
    if (props.isRotating) {
      spaceRef.current.rotation.y += 0.25 * delta; // Adjust the rotation speed as needed
    }
  });

  return (
    <group {...props} dispose={null} ref={spaceRef}>
      <group
        position={[-1.007, -6.611, 0]}
        rotation={[Math.PI / 2, 0, -Math.PI]}
        scale={0.05}
      >
        <group rotation={[Math.PI / 2, 0, 0]}>
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.Object_4.geometry}
            material={materials.material}
            position={[-0.511, -3.321, -0.134]}
            rotation={[0.354, -0.348, -3.024]}
            scale={0.999}
          />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(
  "https://pub-900982d21fee47f8b53d6e8c8ac9a4cf.r2.dev/space.glb"
);
