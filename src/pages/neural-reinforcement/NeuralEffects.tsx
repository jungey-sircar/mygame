import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";

interface NeuralEffectsProps {
  connectionStrength: number;
  isLearned: boolean;
}

const NeuralEffects = ({ connectionStrength, isLearned }: NeuralEffectsProps) => {
  const strengthFactor = Math.min(connectionStrength, 10) / 10;

  return (
    <EffectComposer multisampling={4}>
      <Bloom
        intensity={isLearned ? 1.35 + strengthFactor * 1.2 : 0.75 + strengthFactor * 0.6}
        luminanceThreshold={0.08}
        luminanceSmoothing={0.35}
        mipmapBlur
      />
      <Noise opacity={isLearned ? 0.08 : 0.05} premultiply />
      <Vignette eskil={false} offset={0.18} darkness={isLearned ? 0.52 : 0.63} />
    </EffectComposer>
  );
};

export default NeuralEffects;
