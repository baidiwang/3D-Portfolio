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
    label: "Web & AI",
  },
  {
    id: 3,
    position: [-0.2, -0.2, 0.9],
    lookAt: [0.7, 0.5, 0.8],
    lookPosition: [-10, -10, 25],
    label: "Design",
  },
  {
    id: 4,
    position: [-0.5, 0.4, 1],
    lookAt: [-0.8, 0.3, 0.5],
    lookPosition: [-15, 5, 40],
    label: "Game/XR",
  },
];

export function SpaceStation({
  isRotating,
  setIsRotating,
  currentStage,
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
    "https://pub-900982d21fee47f8b53d6e8c8ac9a4cf.r2.dev/spaceStation.glb",
  );
  const { actions } = useAnimations(animations, group);

  const [showMarkers, setShowMarkers] = useState(false);

  // Use a ref for the last mouse x position
  const lastX = useRef(0);
  // Use a ref for rotation speed
  const rotationSpeed = useRef(0);
  // Define a damping factor to control rotation damping
  const dampingFactor = 0.95;

  // Handle pointer (mouse or touch) down event — only ever bound to the
  // canvas itself (see effect below), so this can never intercept taps on
  // HTML UI (nav links, buttons) layered above/around the 3D scene.
  // Note: no stopPropagation() here — React Three Fiber's own raycasting
  // event dispatch (marker hover/click) listens on this same canvas, and
  // stopping propagation would swallow the event before R3F ever sees it.
  const handlePointerDown = (event) => {
    event.preventDefault();
    setIsRotating(true);

    lastX.current = event.clientX;
  };

  // Handle pointer (mouse or touch) up event
  const handlePointerUp = () => {
    setIsRotating(false);
  };

  // Handle pointer (mouse or touch) move event
  const handlePointerMove = (event) => {
    if (!isRotating) return;
    // Only suppress the default action (page scroll/selection) while an
    // actual drag is in progress.
    event.preventDefault();

    // calculate the change in the horizontal position of the pointer,
    // relative to the viewport's width
    const delta = (event.clientX - lastX.current) / viewport.width;

    // Update the island's rotation based on the mouse/touch movement
    spaceStationRef.current.rotation.y += delta * 0.1 * Math.PI;

    // Update the reference for the last clientX position
    lastX.current = event.clientX;

    // Update the rotation speed
    rotationSpeed.current = delta * 0.1 * Math.PI;
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

  useEffect(() => {
    // Pointer Events unify mouse/touch/pen, so a single set of listeners
    // covers both — no separate touchstart/touchmove handlers needed.
    //
    // pointerdown is bound to the canvas ONLY (not document/window): that's
    // what previously let every tap anywhere on the page — including the
    // "View ... Projects" links rendered above the 3D scene — start a drag
    // and have its default action (and therefore its click) suppressed.
    // pointermove/pointerup stay on window so a drag that started on the
    // canvas keeps tracking smoothly even if the pointer strays off it.
    //
    // { passive: false } is explicit here because handlePointerDown/Move
    // call preventDefault() to suppress page scroll/selection during a drag.
    const canvas = gl.domElement;
    canvas.addEventListener("pointerdown", handlePointerDown, { passive: false });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Remove event listeners when component unmounts
    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
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
    }
  });

  const handleMarkerClick = (marker) => {
    spaceStationRef.current.rotation.y = 0;

    if (currentStage === marker.id) {
      setCurrentStage(0);
    } else {
      setCurrentStage(marker.id);
      setTargetPosition(marker);
      setShowTypewriter(false);
    }
  };

  useEffect(() => {
    if (currentStage === 0) {
      // 重置相机到初始位置
      setTargetPosition({
        id: 0,
        position: [0, 0, 0],
        lookAt: [0, 0, 0],
        lookPosition: [0, 0, 50],
        label: "",
      });
      setShowTypewriter(true);
    }
  }, [currentStage]);

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
        <planeGeometry args={[0.19, 0.02]} />
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
