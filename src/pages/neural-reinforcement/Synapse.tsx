import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SynapseProps {
  id: string;
  from: THREE.Vector3;
  to: THREE.Vector3;
  seed: number;
  connectionStrength: number;
  isLearned: boolean;
  pulseKey: number;
}

const SIGNAL_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SIGNAL_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform float uStrength;
  uniform float uLearned;
  uniform float uPulseBoost;
  uniform float uGrowth;

  varying vec2 vUv;

  void main() {
    vec3 dormant = vec3(0.66, 0.72, 0.95);
    vec3 learned = vec3(0.98, 0.55, 0.96);
    vec3 color = mix(dormant, learned, uLearned);

    float speed = 0.45 + uStrength * 0.08 + uPulseBoost * 1.8;
    float head = fract(uTime * speed);
    float distToHead = abs(vUv.x - head);
    float directionalPulse = smoothstep(0.18, 0.0, distToHead);
    float growthMask = smoothstep(uGrowth - 0.05, uGrowth, vUv.x);
    if (vUv.x > uGrowth) {
      discard;
    }

    float radial = smoothstep(0.0, 0.78, 1.0 - abs(vUv.y - 0.5) * 2.0);
    float intensity = directionalPulse * (0.65 + uPulseBoost * 0.5 + uLearned * 0.25) * radial * growthMask;

    gl_FragColor = vec4(color * intensity, intensity);
  }
`;

const BASE_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const BASE_FRAGMENT_SHADER = `
  uniform float uGrowth;
  uniform float uStrength;
  uniform float uLearned;

  varying vec2 vUv;

  void main() {
    if (vUv.x > uGrowth) {
      discard;
    }

    vec3 baseColor = mix(vec3(0.45, 0.48, 0.66), vec3(0.58, 0.5, 0.78), uLearned);
    float radial = smoothstep(0.0, 0.82, 1.0 - abs(vUv.y - 0.5) * 2.0);
    float body = (0.45 + uStrength * 0.025) * radial;
    float edgeFade = 1.0 - smoothstep(uGrowth - 0.06, uGrowth, vUv.x);
    gl_FragColor = vec4(baseColor * body, 0.9 * radial * edgeFade + 0.12);
  }
`;

const createSeededRandom = (seed: number): (() => number) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const buildConnectedCurve = (from: THREE.Vector3, to: THREE.Vector3, seed: number) => {
  const random = createSeededRandom(seed);
  const direction = to.clone().sub(from);
  const distance = direction.length();
  const unit = direction.clone().normalize();

  const side = new THREE.Vector3(random() - 0.5, random() - 0.5, random() - 0.5).normalize();
  const lift = new THREE.Vector3(0, 1, 0).multiplyScalar((random() - 0.5) * 0.16);

  const c1 = from.clone().add(unit.clone().multiplyScalar(distance * 0.28)).add(side.clone().multiplyScalar(0.16)).add(lift);
  const c2 = from.clone().add(unit.clone().multiplyScalar(distance * 0.68)).add(side.clone().multiplyScalar(-0.13)).add(lift.clone().multiplyScalar(-0.4));

  return new THREE.CatmullRomCurve3([from.clone(), c1, c2, to.clone()]);
};

const Synapse = ({ id, from, to, seed, connectionStrength, isLearned, pulseKey }: SynapseProps) => {
  const baseMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const signalMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const endpointMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const pulseBoostRef = useRef(0);
  const growthRef = useRef(0.08);

  const curve = useMemo(() => buildConnectedCurve(from, to, seed), [from, to, seed]);
  const thickness = 0.012 + Math.min(connectionStrength, 10) * 0.0018;

  useEffect(() => {
    pulseBoostRef.current = 1;
    growthRef.current = 0.08;
  }, [pulseKey]);

  useFrame(({ clock }, delta) => {
    pulseBoostRef.current = Math.max(0, pulseBoostRef.current - delta * 1.2);
    const growthSpeed = 0.42 + Math.min(connectionStrength, 10) * 0.08;
    growthRef.current = Math.min(1, growthRef.current + delta * growthSpeed);

    if (baseMaterialRef.current) {
      baseMaterialRef.current.uniforms.uGrowth.value = growthRef.current;
      baseMaterialRef.current.uniforms.uStrength.value = connectionStrength;
      baseMaterialRef.current.uniforms.uLearned.value = isLearned ? 1 : 0;
    }

    if (signalMaterialRef.current) {
      signalMaterialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      signalMaterialRef.current.uniforms.uStrength.value = connectionStrength;
      signalMaterialRef.current.uniforms.uLearned.value = isLearned ? 1 : 0;
      signalMaterialRef.current.uniforms.uPulseBoost.value = pulseBoostRef.current;
      signalMaterialRef.current.uniforms.uGrowth.value = growthRef.current;
    }

    if (endpointMaterialRef.current) {
      endpointMaterialRef.current.emissiveIntensity =
        (0.2 + Math.min(connectionStrength, 10) * 0.08) + growthRef.current * 0.9;
    }
  });

  return (
    <group>
      <mesh key={`${id}-base`} castShadow receiveShadow>
        <tubeGeometry args={[curve, 48, thickness, 10, false]} />
        <shaderMaterial
          ref={baseMaterialRef}
          transparent
          depthWrite={false}
          blending={THREE.NormalBlending}
          vertexShader={BASE_VERTEX_SHADER}
          fragmentShader={BASE_FRAGMENT_SHADER}
          uniforms={{
            uGrowth: { value: 0.08 },
            uStrength: { value: connectionStrength },
            uLearned: { value: isLearned ? 1 : 0 },
          }}
        />
      </mesh>

      <mesh key={`${id}-signal`}>
        <tubeGeometry args={[curve, 48, Math.max(0.003, thickness * 0.45), 8, false]} />
        <shaderMaterial
          ref={signalMaterialRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexShader={SIGNAL_VERTEX_SHADER}
          fragmentShader={SIGNAL_FRAGMENT_SHADER}
          uniforms={{
            uTime: { value: 0 },
            uStrength: { value: connectionStrength },
            uLearned: { value: isLearned ? 1 : 0 },
            uPulseBoost: { value: 0 },
            uGrowth: { value: 0.08 },
          }}
        />
      </mesh>

      <mesh position={to}>
        <sphereGeometry args={[0.028 + Math.min(connectionStrength, 10) * 0.002, 12, 12]} />
        <meshStandardMaterial
          ref={endpointMaterialRef}
          color={isLearned ? "#ffc1ff" : "#dbe6ff"}
          emissive={isLearned ? "#ff87ec" : "#9db5ff"}
          emissiveIntensity={0.2 + Math.min(connectionStrength, 10) * 0.08}
          roughness={0.3}
          metalness={0.05}
        />
      </mesh>
    </group>
  );
};

export default Synapse;
