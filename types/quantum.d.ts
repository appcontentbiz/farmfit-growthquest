declare module 'quantum-types' {
    export interface EnvironmentalFactors {
        temperature: number;
        humidity: number;
        soilPH: number;
        lightIntensity: number;
        co2Level: number;
    }

    export interface AnalysisResult {
        growthPotential: number;
        environmentalScore: number;
        quantumEfficiency: number;
        recommendations: string[];
        riskFactors: string[];
        confidenceScore: number;
        historicalData?: Array<{
            timestamp: Date;
            growthRate: number;
        }>;
    }

    export interface QuantumState {
        re: number;
        im: number;
        magnitude: number;
        phase: number;
    }

    export interface ModelPrediction {
        growthPotential: number;
        environmentalScore: number;
        quantumEfficiency: number;
    }

    export interface AnalysisDisplayProps extends AnalysisResult {
        onRefresh?: () => void;
        className?: string;
        style?: React.CSSProperties;
    }

    export interface EnvironmentalControlProps {
        factors: EnvironmentalFactors;
        onChange: (factors: EnvironmentalFactors) => void;
        disabled?: boolean;
        className?: string;
        style?: React.CSSProperties;
    }
}
