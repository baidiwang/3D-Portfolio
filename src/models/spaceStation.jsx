/**
 * IMPORTANT: Loading glTF models into a Three.js scene is a lot of work.
 * Before we can configure or animate our model’s meshes, we need to iterate through
 * each part of our model’s meshes and save them separately.
 *
 * But luckily there is an app that turns gltf or glb files into jsx components
 * For this model, visit https://gltf.pmnd.rs/
 * And get the code. And then add the rest of the things.
 * YOU DON'T HAVE TO WRITE EVERYTHING FROM SCRATCH
 */

import fontCode from "/public/SpaceMono-Bold.ttf";
import { a, useSpring } from "@react-spring/three";
import { useEffect, useRef, useState } from "react";
import { useGLTF, useAnimations, Text } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";

// import spaceStation from "/public/models/3d/spaceStation.glb";
import { Astronaut } from "./Astronaut.jsx";

const markers = [
  {
    id: 1,
    position: [0, 0.7, 0],
    lookAt: [0, 15, 0],
    lookPosition: [0, 10, 20],
    label: "About Me",
  },
  {
    id: 2,
    position: [0.7, 0.5, 0.8],
    lookAt: [0.7, 0.5, 0.8],
    lookPosition: [25, 0, 30],
    label: "Engineering",
  },
  {
    id: 3,
    position: [-0.2, -0.2, 0.9],
    lookAt: [0.7, 0.5, 0.8],
    lookPosition: [-10, -10, 25],
    label: "Design",
  },
];

export function SpaceStation({
  isRotating,
  setIsRotating,
  setCurrentStage,
  currentFocusPoint,
  setIsLoaded,
  setShowTypewriter,
  ...props
}) {
  const [targetPosition, setTargetPosition] = useState(null);
  const { camera } = useThree();
  const spaceStationRef = useRef();
  // Get access to the Three.js renderer and viewport
  const { gl, viewport } = useThree();
  // const { nodes, materials } = useGLTF(islandScene);

  const group = useRef();

  const { nodes, materials, animations } = useGLTF(
    "/models/3d/spaceStation.glb"
  );
  const { actions } = useAnimations(animations, group);

  const [showMarkers, setShowMarkers] = useState(false);

  // Use a ref for the last mouse x position
  const lastX = useRef(0);
  // Use a ref for rotation speed
  const rotationSpeed = useRef(0);
  // Define a damping factor to control rotation damping
  const dampingFactor = 0.95;

  // Handle pointer (mouse or touch) down event
  const handlePointerDown = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setIsRotating(true);

    // Calculate the clientX based on whether it's a touch event or a mouse event
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;

    // Store the current clientX position for reference
    lastX.current = clientX;
  };

  // Handle pointer (mouse or touch) up event
  const handlePointerUp = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setIsRotating(false);
  };

  // Handle pointer (mouse or touch) move event
  const handlePointerMove = (event) => {
    event.stopPropagation();
    event.preventDefault();
    if (isRotating) {
      // If rotation is enabled, calculate the change in clientX position
      const clientX = event.touches ? event.touches[0].clientX : event.clientX;

      // calculate the change in the horizontal position of the mouse cursor or touch input,
      // relative to the viewport's width
      const delta = (clientX - lastX.current) / viewport.width;

      // Update the island's rotation based on the mouse/touch movement
      spaceStationRef.current.rotation.y += delta * 0.1 * Math.PI;

      // Update the reference for the last clientX position
      lastX.current = clientX;

      // Update the rotation speed
      rotationSpeed.current = delta * 0.1 * Math.PI;
    }
  };

  // Handle keydown events
  const handleKeyDown = (event) => {
    if (event.key === "ArrowLeft") {
      if (!isRotating) setIsRotating(true);

      spaceStationRef.current.rotation.y += 0.05 * Math.PI;
      rotationSpeed.current = 0.07;
    } else if (event.key === "ArrowRight") {
      if (!isRotating) setIsRotating(true);

      spaceStationRef.current.rotation.y -= 0.05 * Math.PI;
      rotationSpeed.current = -0.07;
    }
  };

  // Handle keyup events
  const handleKeyUp = (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      setIsRotating(false);
    }
  };

  // Touch events for mobile devices
  const handleTouchStart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsRotating(true);

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    lastX.current = clientX;
  };

  const handleTouchEnd = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsRotating(false);
  };

  const handleTouchMove = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (isRotating) {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const delta = (clientX - lastX.current) / viewport.width;

      spaceStationRef.current.rotation.y += delta * 0.1 * Math.PI;
      lastX.current = clientX;
      rotationSpeed.current = delta * 0.1 * Math.PI;
    }
  };

  useEffect(() => {
    // Add event listeners for pointer and keyboard events
    const canvas = gl.domElement;
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchend", handleTouchEnd);
    document.addEventListener("touchmove", handleTouchMove);
    // canvas.addEventListener("click", () => {
    //   setCurrentStage(1);
    // });

    // Remove event listeners when component unmounts
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, [gl, handlePointerDown, handlePointerUp, handlePointerMove]);

  // This function is called on each frame update
  useFrame(() => {
    // If not rotating, apply damping to slow down the rotation (smoothly)
    if (!isRotating) {
      // Apply damping factor
      rotationSpeed.current *= dampingFactor;

      // Stop rotation when speed is very small
      if (Math.abs(rotationSpeed.current) < 0.001) {
        rotationSpeed.current = 0;
      }

      spaceStationRef.current.rotation.y += rotationSpeed.current;
    } else {
      // When rotating, determine the current stage based on island's orientation
      const rotation = spaceStationRef.current.rotation.y;

      /**
       * Normalize the rotation value to ensure it stays within the range [0, 2 * Math.PI].
       * The goal is to ensure that the rotation value remains within a specific range to
       * prevent potential issues with very large or negative rotation values.
       *  Here's a step-by-step explanation of what this code does:
       *  1. rotation % (2 * Math.PI) calculates the remainder of the rotation value when divided
       *     by 2 * Math.PI. This essentially wraps the rotation value around once it reaches a
       *     full circle (360 degrees) so that it stays within the range of 0 to 2 * Math.PI.
       *  2. (rotation % (2 * Math.PI)) + 2 * Math.PI adds 2 * Math.PI to the result from step 1.
       *     This is done to ensure that the value remains positive and within the range of
       *     0 to 2 * Math.PI even if it was negative after the modulo operation in step 1.
       *  3. Finally, ((rotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) applies another
       *     modulo operation to the value obtained in step 2. This step guarantees that the value
       *     always stays within the range of 0 to 2 * Math.PI, which is equivalent to a full
       *     circle in radians.
       */
      // const normalizedRotation =
      //   ((rotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      //
      // // Set the current stage based on the island's orientation
      // switch (true) {
      //   case normalizedRotation >= 5.45 && normalizedRotation <= 5.85:
      //     setCurrentStage(4);
      //     break;
      //   case normalizedRotation >= 0.85 && normalizedRotation <= 1.3:
      //     setCurrentStage(3);
      //     break;
      //   case normalizedRotation >= 2.4 && normalizedRotation <= 2.6:
      //     setCurrentStage(2);
      //     break;
      //   case normalizedRotation >= 4.25 && normalizedRotation <= 4.75:
      //     setCurrentStage(1);
      //     break;
      //   default:
      //     setCurrentStage(null);
      // }
    }
  });

  const handleMarkerClick = (marker) => {
    spaceStationRef.current.rotation.y = 0;

    if (marker === targetPosition) {
      setCurrentStage(0);
      setTargetPosition({
        id: 0,
        position: [0, 0, 0],
        lookAt: [0, 0, 0],
        lookPosition: [0, 0, 50],
        label: "",
      });
    } else {
      setCurrentStage(marker.id);
      setTargetPosition(marker);
      setShowTypewriter(false);
    }
  };

  const { pos, lookAt, lookPos } = useSpring({
    pos: targetPosition ? targetPosition.position : camera.position.toArray(),
    lookAt: targetPosition ? targetPosition.lookAt : [0, 0, 0],
    lookPos: targetPosition ? targetPosition.lookPosition : [0, 0, 0],
    config: { mass: 1, tension: 120, friction: 14 },
  });

  useFrame(() => {
    if (targetPosition) {
      camera.position.set(...lookPos.get());
      camera.lookAt(...lookAt.get());
    }
  });

  // Page loads frist then the typewritter effect shows
  // Maker buttons fade in
  useEffect(() => {
    if (nodes && materials) {
      setIsLoaded(true);
      setShowMarkers(true);
    }
  }, [nodes, materials]);

  return (
    <a.group ref={spaceStationRef} {...props}>
      <group ref={group} {...props} dispose={null}>
        <group name="Sketchfab_Scene">
          <group
            name="Sketchfab_model"
            rotation={[-1.444, 0.213, -6.061]}
            scale={25}
          >
            <group name="root">
              <group name="GLTF_SceneRootNode" rotation={[Math.PI / 2, 0, 0]}>
                <group name="SpaceStation_low_0">
                  <mesh
                    name="Object_4"
                    castShadow
                    receiveShadow
                    geometry={nodes.Object_4.geometry}
                    material={materials.spacestation_main2}
                  />
                </group>
                <group name="SpaceStation001_low_1">
                  <mesh
                    name="Object_6"
                    castShadow
                    receiveShadow
                    geometry={nodes.Object_6.geometry}
                    material={materials.spacestation_smalllights}
                  />
                </group>
                <group name="SpaceStation002_low_2">
                  <mesh
                    name="Object_8"
                    castShadow
                    receiveShadow
                    geometry={nodes.Object_8.geometry}
                    material={materials.spacestation_main2}
                  />
                </group>
                <group name="SpaceStation003_low_3">
                  <mesh
                    name="Object_10"
                    castShadow
                    receiveShadow
                    geometry={nodes.Object_10.geometry}
                    material={materials.spacestation_main2}
                  />
                </group>
                <group name="SpaceStation004_low_4">
                  <mesh
                    name="Object_12"
                    castShadow
                    receiveShadow
                    geometry={nodes.Object_12.geometry}
                    material={materials.spacestation_main}
                  />
                </group>
                <group name="SpaceStation005_low_5">
                  <mesh
                    name="Object_14"
                    castShadow
                    receiveShadow
                    geometry={nodes.Object_14.geometry}
                    material={materials.spacestation_main}
                  />
                </group>
                <group
                  name="SpaceStation006_low_6"
                  rotation={[Math.PI, -0.545, Math.PI]}
                >
                  <mesh
                    name="Object_16"
                    castShadow
                    receiveShadow
                    geometry={nodes.Object_16.geometry}
                    material={materials.spacestation_main}
                  />
                </group>
                <group name="SpaceStation007_low_7">
                  <mesh
                    name="Object_18"
                    castShadow
                    receiveShadow
                    geometry={nodes.Object_18.geometry}
                    material={materials.spacestation_main}
                  />
                </group>
                <Astronaut position={[0, 0.25, 0]} />
                {markers.map((marker) => (
                  <GlowingMarker
                    key={marker.id}
                    marker={marker}
                    showMarkers={showMarkers}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      handleMarkerClick(marker);
                    }}
                  />
                ))}
              </group>
            </group>
          </group>
        </group>
      </group>
    </a.group>
  );
}

function GlowingMarker({ marker, showMarkers, ...rest }) {
  const meshRef = useRef();
  const [intensity, setIntensity] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (showMarkers) {
      setIntensity(3);
    }
  }, [showMarkers]);

  useFrame(({ clock }) => {
    const pulse = Math.sin(clock.elapsedTime * 3) * 1.5 + 3;
    setIntensity(hovered ? pulse + 2 : pulse);
  });

  return (
    <mesh
      ref={meshRef}
      position={marker.position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 2.2 : 1.8}
      {...rest}
    >
      {/* <sphereGeometry args={[0.015, 32, 32]} /> */}
      {/* <meshStandardMaterial
        color={hovered ? "orange" : "#a85032"}
        transparent
        opacity={showMarkers ? 1 : 0} // buttons fade in
        emissive={hovered ? "yellow" : "#a85032"}
        emissiveIntensity={intensity}
      /> */}
      <mesh position={[0, 0.035, -0.01]}>
        <planeGeometry args={[0.25, 0.02]} />
        <meshBasicMaterial color="yellow" transparent opacity={0.5} />
      </mesh>
      <Text
        position={[0, 0.05, 0]}
        fontSize={0.035}
        color="white"
        font={fontCode}
        // outlineWidth={0.003}
        anchorX="center"
        anchorY="middle"
        onPointerOver={(e) => e.object.material.color.set("yellow")}
        onPointerOut={(e) => e.object.material.color.set("white")}
      >
        {marker.label}
      </Text>
    </mesh>
  );
}
