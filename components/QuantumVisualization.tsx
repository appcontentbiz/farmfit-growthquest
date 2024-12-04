import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import * as THREE from 'three';
import { GLView } from 'expo-gl';
import QuantumSimulation from '../scripts/quantum-simulation';

interface QuantumVisualizationProps {
    gridSize?: number;
    onStateChange?: (data: any) => void;
}

const QuantumVisualization: React.FC<QuantumVisualizationProps> = ({
    gridSize = 10,
    onStateChange
}) => {
    const [simulation] = useState(() => new QuantumSimulation(gridSize));
    const glRef = useRef<GLView>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const animationFrameRef = useRef<number>();

    useEffect(() => {
        // Initialize Three.js scene
        const initScene = () => {
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(
                75,
                Dimensions.get('window').width / Dimensions.get('window').height,
                0.1,
                1000
            );
            
            camera.position.z = 5;
            sceneRef.current = scene;
            cameraRef.current = camera;

            // Add ambient light
            const ambientLight = new THREE.AmbientLight(0x404040);
            scene.add(ambientLight);

            // Add point light
            const pointLight = new THREE.PointLight(0xffffff, 1, 100);
            pointLight.position.set(10, 10, 10);
            scene.add(pointLight);
        };

        initScene();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            simulation.cleanup();
        };
    }, []);

    const updateVisualization = () => {
        if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;

        const visualData = simulation.getVisualizationData();
        const { probabilities } = visualData;

        // Update quantum state visualization
        sceneRef.current.children = sceneRef.current.children.filter(
            child => child instanceof THREE.Light
        );

        // Create grid of spheres representing quantum states
        probabilities.forEach((row: number[], i: number) => {
            row.forEach((prob: number, j: number) => {
                const geometry = new THREE.SphereGeometry(0.2, 32, 32);
                const material = new THREE.MeshPhongMaterial({
                    color: new THREE.Color(0, prob, 0),
                    transparent: true,
                    opacity: 0.8
                });
                const sphere = new THREE.Mesh(geometry, material);
                
                sphere.position.x = (i - gridSize / 2) * 0.5;
                sphere.position.y = (j - gridSize / 2) * 0.5;
                
                sceneRef.current?.add(sphere);
            });
        });

        // Notify parent component of state change
        onStateChange?.(visualData);
    };

    const animate = () => {
        if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;

        animationFrameRef.current = requestAnimationFrame(animate);
        
        // Rotate camera around the scene
        const time = Date.now() * 0.001;
        cameraRef.current.position.x = Math.cos(time) * 5;
        cameraRef.current.position.z = Math.sin(time) * 5;
        cameraRef.current.lookAt(0, 0, 0);

        rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    const onContextCreate = async (gl: WebGLRenderingContext) => {
        const renderer = new THREE.WebGLRenderer({
            canvas: {
                width: gl.drawingBufferWidth,
                height: gl.drawingBufferHeight,
                style: {},
                addEventListener: () => {},
                removeEventListener: () => {},
                clientWidth: gl.drawingBufferWidth,
                clientHeight: gl.drawingBufferHeight,
            } as any,
            context: gl,
        });

        renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
        rendererRef.current = renderer;

        updateVisualization();
        animate();
    };

    return (
        <View style={styles.container}>
            <GLView
                ref={glRef}
                style={styles.glView}
                onContextCreate={onContextCreate}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    glView: {
        flex: 1,
    },
});

export default QuantumVisualization;
