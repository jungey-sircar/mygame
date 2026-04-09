import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface NeuronModel {
  id: string;
  position: THREE.Vector3;
  baseRadius: number;
  seed: number;
}

interface DendriteCurve {
  id: string;
  curve: THREE.CatmullRomCurve3;
  radius: number;
}

interface NeuronProps {
  neuron: NeuronModel;
  dendriteAnchorsWorld: THREE.Vector3[];
  axonDirectionWorld?: THREE.Vector3;
  connectionStrength: number;
  isLearned: boolean;
  pulseKey: number;
}

const createSeededRandom = (seed: number): (() => number) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const recursiveBranch = (
  start: THREE.Vector3,
  direction: THREE.Vector3,
  depth: number,
  length: number,
  random: () => number,
  out: DendriteCurve[],
  baseId: string,
  radius: number,
) => {
  if (depth <= 0) return;

  const control1 = start.clone().add(direction.clone().multiplyScalar(length * 0.35));
  const bend = new THREE.Vector3(random() - 0.5, random() - 0.5, random() - 0.5)
    .normalize()
    .multiplyScalar(length * 0.22);
  const control2 = start.clone().add(direction.clone().multiplyScalar(length * 0.7)).add(bend);
  const end = start.clone().add(direction.clone().multiplyScalar(length)).add(bend.clone().multiplyScalar(0.45));

  out.push({
    id: `${baseId}-${depth}-${out.length}`,
    curve: new THREE.CatmullRomCurve3([start.clone(), control1, control2, end]),
    radius,
  });

  const forkCount = depth > 1 ? 2 : 1;
  for (let i = 0; i < forkCount; i++) {
    const childDir = direction
      .clone()
      .add(new THREE.Vector3(random() - 0.5, random() - 0.5, random() - 0.5).multiplyScalar(0.9))
      .normalize();
    recursiveBranch(end, childDir, depth - 1, length * 0.62, random, out, `${baseId}-${i}`, Math.max(0.003, radius * 0.72));
  }
};

const buildDendrites = (
  neuron: NeuronModel,
  anchorsLocal: THREE.Vector3[],
  connectionStrength: number,
): DendriteCurve[] => {
  const random = createSeededRandom(neuron.seed + 77);
  const curves: DendriteCurve[] = [];
  const rootRadius = 0.012 + Math.min(connectionStrength, 10) * 0.0015;

  if (anchorsLocal.length === 0) {
    const dir = new THREE.Vector3(0.8, 0.1, -0.4).normalize();
    recursiveBranch(new THREE.Vector3(0, 0, 0), dir, 3, neuron.baseRadius * 1.6, random, curves, "fallback", rootRadius);
    return curves;
  }

  anchorsLocal.forEach((anchor, idx) => {
    const toAnchor = anchor.clone().normalize();
    const trunkEnd = toAnchor.clone().multiplyScalar(anchor.length() * 0.82);
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      toAnchor.clone().multiplyScalar(neuron.baseRadius * 0.65),
      trunkEnd,
      anchor.clone(),
    ]);

    curves.push({
      id: `trunk-${idx}`,
      curve: trunkCurve,
      radius: rootRadius,
    });

    const tangent = toAnchor.clone().add(new THREE.Vector3(random() - 0.5, random() - 0.5, random() - 0.5)).normalize();
    recursiveBranch(
      trunkEnd,
      tangent,
      2 + Math.min(1, Math.floor(connectionStrength / 4)),
      neuron.baseRadius * (0.75 + random() * 0.35),
      random,
      curves,
      `anchor-branch-${idx}`,
      Math.max(0.004, rootRadius * 0.7),
    );
  });

  return curves;
};

const buildAxonStump = (
  neuron: NeuronModel,
  axonDirectionWorld: THREE.Vector3 | undefined,
  connectionStrength: number,
): DendriteCurve | null => {
  if (!axonDirectionWorld) return null;
  const dir = axonDirectionWorld.clone().normalize();
  const start = new THREE.Vector3(0, 0, 0);
  const c1 = dir.clone().multiplyScalar(neuron.baseRadius * 0.9);
  const c2 = dir.clone().multiplyScalar(neuron.baseRadius * 1.35).add(new THREE.Vector3(0.04, -0.02, 0.03));
  const end = dir.clone().multiplyScalar(neuron.baseRadius * 1.75);

  return {
    id: `${neuron.id}-axon-stump`,
    curve: new THREE.CatmullRomCurve3([start, c1, c2, end]),
    radius: 0.014 + Math.min(connectionStrength, 10) * 0.0017,
  };
};

const Neuron = ({
  neuron,
  dendriteAnchorsWorld,
  axonDirectionWorld,
  connectionStrength,
  isLearned,
  pulseKey,
}: NeuronProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const activationRef = useRef(0);

  const anchorsLocal = useMemo(
    () => dendriteAnchorsWorld.map((point) => point.clone().sub(neuron.position)),
    [dendriteAnchorsWorld, neuron.position],
  );

  const dendrites = useMemo(
    () => buildDendrites(neuron, anchorsLocal, connectionStrength),
    [neuron, anchorsLocal, connectionStrength],
  );

  const axonStump = useMemo(
    () => buildAxonStump(neuron, axonDirectionWorld, connectionStrength),
    [neuron, axonDirectionWorld, connectionStrength],
  );

  useEffect(() => {
    activationRef.current = 1;
  }, [pulseKey]);

  useFrame(({ clock }, delta) => {
    activationRef.current = Math.max(0, activationRef.current - delta * 1.25);

    const t = clock.getElapsedTime();
    const breathe = 1 + Math.sin(t * 0.55 + neuron.seed * 0.01) * 0.03;
    const microX = Math.sin(t * 0.9 + neuron.seed * 0.02) * 0.015;
    const microZ = Math.cos(t * 0.7 + neuron.seed * 0.017) * 0.014;

    if (groupRef.current) {
      groupRef.current.scale.setScalar(breathe + activationRef.current * 0.05);
      groupRef.current.rotation.x = microX;
      groupRef.current.rotation.z = microZ;
    }

    if (coreRef.current) {
      const mat = coreRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity =
        (isLearned ? 1.3 : 0.85) + Math.min(connectionStrength, 10) * 0.08 + activationRef.current * 0.9;
      coreRef.current.scale.setScalar(0.38 + activationRef.current * 0.08);
    }
  });

  const somaColor = isLearned ? "#9e79ff" : "#7a8ac7";
  const dendriteColor = isLearned ? "#a38cff" : "#6a7ca5";

  return (
    <group ref={groupRef} position={neuron.position}>
      <mesh castShadow receiveShadow>
        <icosahedronGeometry args={[neuron.baseRadius, 3]} />
        <meshStandardMaterial
          color={somaColor}
          roughness={0.42}
          metalness={0.06}
          transparent
          opacity={0.9}
          emissive={isLearned ? "#5f4cff" : "#3e4f7a"}
          emissiveIntensity={0.35 + Math.min(connectionStrength, 10) * 0.035}
        />
      </mesh>

      <mesh ref={coreRef} castShadow>
        <sphereGeometry args={[neuron.baseRadius * 0.37, 16, 16]} />
        <meshStandardMaterial
          color={isLearned ? "#ff88f3" : "#b8c6ff"}
          emissive={isLearned ? "#ff55dd" : "#89a5ff"}
          emissiveIntensity={1}
          roughness={0.25}
          metalness={0.1}
        />
      </mesh>

      {dendrites.map((branch) => (
        <mesh key={branch.id}>
          <tubeGeometry args={[branch.curve, 30, branch.radius, 8, false]} />
          <meshStandardMaterial
            color={dendriteColor}
            emissive={isLearned ? "#8a6dff" : "#5b6ba0"}
            emissiveIntensity={0.18 + Math.min(connectionStrength, 10) * 0.025}
            roughness={0.55}
            metalness={0.03}
            transparent
            opacity={0.88}
          />
        </mesh>
      ))}

      {axonStump ? (
        <mesh>
          <tubeGeometry args={[axonStump.curve, 34, axonStump.radius, 8, false]} />
          <meshStandardMaterial
            color={isLearned ? "#b67cff" : "#8b7fbd"}
            emissive={isLearned ? "#9c5cff" : "#5f5e8e"}
            emissiveIntensity={0.26 + Math.min(connectionStrength, 10) * 0.03}
            roughness={0.45}
            metalness={0.05}
          />
        </mesh>
      ) : null}
    </group>
  );
};

export default Neuron;
