import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import Neuron, { type NeuronModel } from "./Neuron";
import Synapse from "./Synapse";
import NeuralEffects from "./NeuralEffects";

interface Neural3DVisualizationProps {
  connectionStrength: number;
  pulseKey: number;
  isLearned: boolean;
}

interface SynapseModel {
  id: string;
  from: number;
  to: number;
  seed: number;
  fromPoint: THREE.Vector3;
  toPoint: THREE.Vector3;
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

const createNeuronNetwork = (): NeuronModel[] => {
  const random = createSeededRandom(934_552);
  return [
    {
      id: "neuron-a",
      position: new THREE.Vector3(-1.8, 0.55, -0.7),
      baseRadius: 0.28 + random() * 0.03,
      seed: 101,
    },
    {
      id: "neuron-b",
      position: new THREE.Vector3(0.2, -0.15, -1.05),
      baseRadius: 0.25 + random() * 0.03,
      seed: 202,
    },
    {
      id: "neuron-c",
      position: new THREE.Vector3(1.65, 0.35, 0.15),
      baseRadius: 0.27 + random() * 0.03,
      seed: 303,
    },
    {
      id: "neuron-d",
      position: new THREE.Vector3(-0.35, -0.65, 1.2),
      baseRadius: 0.24 + random() * 0.03,
      seed: 404,
    },
  ];
};

const createSynapses = (neurons: NeuronModel[]): SynapseModel[] => {
  const random = createSeededRandom(771_902);
  const links: Array<[number, number]> = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
  ];

  return links.map(([from, to], idx) => {
    const src = neurons[from];
    const dst = neurons[to];
    const dir = dst.position.clone().sub(src.position).normalize();

    const tangent = new THREE.Vector3(
      dir.z,
      -dir.x * 0.35 + (random() - 0.5) * 0.2,
      -dir.x,
    ).normalize();

    const fromPoint = src.position
      .clone()
      .add(dir.clone().multiplyScalar(src.baseRadius * 1.22))
      .add(tangent.clone().multiplyScalar((random() - 0.5) * 0.08));

    const toPoint = dst.position
      .clone()
      .add(dir.clone().multiplyScalar(-dst.baseRadius * 1.05))
      .add(tangent.clone().multiplyScalar((random() - 0.5) * 0.14));

    return {
      id: `synapse-${from}-${to}`,
      from,
      to,
      seed: 600 + idx * 31,
      fromPoint,
      toPoint,
    };
  });
};

const CameraDrift = ({ isLearned }: { isLearned: boolean }) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useFrame(({ clock }) => {
    if (!controlsRef.current) return;

    const t = clock.getElapsedTime();
    const driftScale = isLearned ? 0.35 : 0.22;
    controlsRef.current.target.set(
      Math.sin(t * 0.17) * driftScale,
      Math.cos(t * 0.13) * driftScale * 0.5,
      Math.sin(t * 0.11) * driftScale,
    );
    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={3.9}
      maxDistance={9.5}
      enablePan={false}
      autoRotate
      autoRotateSpeed={isLearned ? 0.62 : 0.35}
    />
  );
};

const NetworkCore = ({ connectionStrength, pulseKey, isLearned }: Neural3DVisualizationProps) => {
  const rootRef = useRef<THREE.Group>(null);
  const neurons = useMemo(() => createNeuronNetwork(), []);
  const synapses = useMemo(() => createSynapses(neurons), [neurons]);

  const dendriteAnchorByNeuron = useMemo(() => {
    const map: Record<string, THREE.Vector3[]> = {};
    neurons.forEach((n) => {
      map[n.id] = [];
    });

    synapses.forEach((synapse) => {
      const targetNeuron = neurons[synapse.to];
      map[targetNeuron.id].push(synapse.toPoint);
    });

    return map;
  }, [neurons, synapses]);

  const axonDirectionByNeuron = useMemo(() => {
    const map: Record<string, THREE.Vector3 | undefined> = {};
    neurons.forEach((n) => {
      map[n.id] = undefined;
    });
    synapses.forEach((synapse) => {
      const sourceNeuron = neurons[synapse.from];
      const dir = synapse.toPoint.clone().sub(sourceNeuron.position).normalize();
      map[sourceNeuron.id] = dir;
    });
    return map;
  }, [neurons, synapses]);

  useFrame(({ clock }) => {
    if (!rootRef.current) return;

    const t = clock.getElapsedTime();
    rootRef.current.rotation.y = Math.sin(t * 0.12) * 0.08;
    rootRef.current.rotation.x = Math.sin(t * 0.09) * 0.04;
    rootRef.current.position.y = Math.sin(t * 0.3) * 0.12;
  });

  return (
    <group ref={rootRef}>
      {synapses.map((synapse) => (
        <Synapse
          key={synapse.id}
          id={synapse.id}
          from={synapse.fromPoint}
          to={synapse.toPoint}
          seed={synapse.seed}
          connectionStrength={connectionStrength}
          isLearned={isLearned}
          pulseKey={pulseKey}
        />
      ))}

      {neurons.map((neuron) => (
        <Neuron
          key={neuron.id}
          neuron={neuron}
          dendriteAnchorsWorld={dendriteAnchorByNeuron[neuron.id]}
          axonDirectionWorld={axonDirectionByNeuron[neuron.id]}
          connectionStrength={connectionStrength}
          isLearned={isLearned}
          pulseKey={pulseKey}
        />
      ))}
    </group>
  );
};

const Neural3DVisualization = ({ connectionStrength, pulseKey, isLearned }: Neural3DVisualizationProps) => {
  return (
    <div className="relative overflow-hidden rounded-xl border border-cyan-300/20 bg-[radial-gradient(circle_at_40%_20%,rgba(92,38,140,0.28),rgba(4,8,22,0.96))] shadow-[0_0_60px_rgba(104,74,255,0.2)]">
      <div className="h-[360px] sm:h-[430px]">
        <Canvas
          shadows
          dpr={[1, 1.8]}
          camera={{ position: [0.8, 1.2, 6.4], fov: 43 }}
          gl={{ antialias: true, alpha: true }}
        >
          <color attach="background" args={["#030312"]} />
          <fog attach="fog" args={["#040317", 3.2, 11]} />

          <ambientLight intensity={0.22} />
          <pointLight position={[2.5, 2.7, 1.8]} intensity={1.05} color={isLearned ? "#ff65ea" : "#6d7dff"} castShadow />
          <pointLight position={[-2.8, -1.6, -2.4]} intensity={0.68} color={isLearned ? "#4ec3ff" : "#8a7dff"} />
          <spotLight
            position={[0, 4.6, 2.8]}
            angle={0.44}
            penumbra={0.65}
            intensity={0.7}
            color={isLearned ? "#ff80f2" : "#8896ff"}
            castShadow
          />

          <NetworkCore connectionStrength={connectionStrength} pulseKey={pulseKey} isLearned={isLearned} />
          <CameraDrift isLearned={isLearned} />
          <NeuralEffects connectionStrength={connectionStrength} isLearned={isLearned} />
        </Canvas>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_55%_80%,rgba(255,58,240,0.14),transparent_58%)]" />
    </div>
  );
};

export default Neural3DVisualization;
