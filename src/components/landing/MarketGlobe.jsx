import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  OrbitControls,
  Sphere,
} from "@react-three/drei";
import { useRef } from "react";

function Globe() {
  const mesh = useRef();

  useFrame((_, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.12;
      mesh.current.rotation.x += delta * 0.02;
    }
  });

  return (
    <Float
      speed={1.4}
      rotationIntensity={0.2}
      floatIntensity={0.4}
    >
      <Sphere
        ref={mesh}
        args={[1.55, 64, 64]}
      >
        <meshStandardMaterial
          wireframe
          transparent
          opacity={0.35}
        />
      </Sphere>
    </Float>
  );
}

export default function MarketGlobe() {
  return (
    <div className="market-globe">

      <Canvas camera={{ position: [0, 0, 4.5] }}>

        <ambientLight intensity={1} />

        <pointLight
          position={[3, 3, 3]}
          intensity={3}
        />

        <Globe />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
        />

      </Canvas>

    </div>
  );
}