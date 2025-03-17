import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import spaceScene from '../assets/3d/space.glb'
import { useFrame } from '@react-three/fiber';

export function Space(props) {
  const { nodes, materials } = useGLTF(spaceScene)
  const spaceRef = useRef();

  useFrame((_, delta) => {
    if (props.isRotating) {
      spaceRef.current.rotation.y += 0.25 * delta; // Adjust the rotation speed as needed
    }
  });

  return (
    <group {...props} dispose={null} ref={spaceRef}>
      <group position={[-1.007, -6.611, 0]} rotation={[Math.PI / 2, 0, -Math.PI]} scale={0.05}>
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
  )
}

useGLTF.preload(spaceScene)
