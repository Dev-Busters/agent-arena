/**
 * Post-Processing Test Scene
 * Demonstrates all effects with test controls
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  usePostProcessing,
  useEffectPreset,
  usePerformanceMode,
  useDamageEffect,
  useBloom,
  useEffectToggles,
  type EffectPreset,
} from './index';

export function PostProcessingTestScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const animationRef = useRef<number>();

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create renderer
    const rend = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: false, // FXAA will handle AA
    });
    rend.setSize(800, 600);
    rend.setPixelRatio(window.devicePixelRatio);

    // Create scene
    const sc = new THREE.Scene();
    sc.background = new THREE.Color(0x111111);

    // Create camera
    const cam = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    cam.position.set(0, 2, 10);
    cam.lookAt(0, 0, 0);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    sc.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.5, 100);
    pointLight.position.set(5, 5, 5);
    sc.add(pointLight);

    // Add test objects
    // 1. Glowing sphere (test bloom)
    const glowingSphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0xff00ff,
        emissive: 0xff00ff,
        emissiveIntensity: 2.0,
      })
    );
    glowingSphere.position.set(-3, 0, 0);
    sc.add(glowingSphere);

    // 2. Normal cube (test DOF)
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.MeshStandardMaterial({ color: 0x00ff00 })
    );
    cube.position.set(0, 0, 0);
    sc.add(cube);

    // 3. Distant sphere (test DOF blur)
    const distantSphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x0000ff })
    );
    distantSphere.position.set(3, 0, -5);
    sc.add(distantSphere);

    // 4. Ground plane
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    sc.add(ground);

    setRenderer(rend);
    setScene(sc);
    setCamera(cam);

    return () => {
      rend.dispose();
    };
  }, []);

  // Setup post-processing
  const { render, resize, getEffects, averageFPS } = usePostProcessing(
    renderer,
    scene,
    camera,
    {
      enabled: true,
      bloom: {
        strength: 1.5,
        threshold: 0.85,
        radius: 0.4,
        hdr: true,
      },
      depthOfField: {
        focusDistance: 10,
        aperture: 5.6,
        autoFocus: false,
      },
      motionBlur: {
        intensity: 0.5,
        samples: 8,
        velocityBased: true,
      },
      filmGrain: {
        intensity: 0.35,
        animated: true,
        vignette: true,
      },
      chromaticAberration: {
        offset: 0.002,
        radial: true,
      },
      targetFPS: 60,
    }
  );

  // Preset control
  const { currentPreset, applyPreset, getPresets } = useEffectPreset(
    getEffects() ? { getEffects, applyPreset: () => {}, getConfig: () => ({} as any) } as any : null,
    'exploration'
  );

  // Performance monitoring
  const { performanceMode, togglePerformanceMode, fps } = usePerformanceMode(
    getEffects() ? { getEffects, setPerformanceMode: () => {}, getAverageFPS: () => fps } as any : null,
    true,
    45
  );

  // Damage effect
  const { triggerDamage, triggerImpact } = useDamageEffect(
    getEffects() ? { getEffects } as any : null
  );

  // Bloom control
  const { pulse } = useBloom(
    getEffects() ? { getEffects, updateConfig: () => {} } as any : null
  );

  // Effect toggles
  const { enabledEffects, toggleEffect } = useEffectToggles(
    getEffects() ? { getEffects, setEffectEnabled: () => {} } as any : null
  );

  // Animation loop
  useEffect(() => {
    if (!scene || !camera) return;

    let time = 0;
    const animate = () => {
      time += 0.016;

      // Rotate objects for motion blur test
      scene.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.rotation.y += 0.01;
        }
      });

      // Camera orbit for motion blur
      if (camera) {
        camera.position.x = Math.sin(time * 0.2) * 12;
        camera.position.z = Math.cos(time * 0.2) * 12;
        camera.lookAt(0, 0, 0);
      }

      render(0.016);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [scene, camera, render]);

  // Window resize
  useEffect(() => {
    const handleResize = () => {
      if (camera && renderer && canvasRef.current) {
        const width = canvasRef.current.clientWidth;
        const height = canvasRef.current.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        resize(width, height);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [camera, renderer, resize]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
      <h1>Post-Processing Test Scene</h1>

      <canvas
        ref={canvasRef}
        style={{ width: '800px', height: '600px', border: '2px solid #333' }}
      />

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {/* Preset Selection */}
        <div>
          <h3>Effect Presets</h3>
          {getPresets().map((preset) => (
            <button
              key={preset}
              onClick={() => applyPreset(preset)}
              style={{
                margin: '0.25rem',
                padding: '0.5rem',
                background: currentPreset === preset ? '#4CAF50' : '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Effect Triggers */}
        <div>
          <h3>Effect Triggers</h3>
          <button onClick={() => triggerDamage('light')}>Light Damage</button>
          <button onClick={() => triggerDamage('medium')}>Medium Damage</button>
          <button onClick={() => triggerDamage('heavy')}>Heavy Damage</button>
          <button onClick={() => triggerImpact()}>Impact Effect</button>
          <button onClick={() => pulse(500, 3.0)}>Bloom Pulse</button>
        </div>

        {/* Effect Toggles */}
        <div>
          <h3>Effect Toggles</h3>
          <label>
            <input
              type="checkbox"
              checked={enabledEffects.bloom}
              onChange={() => toggleEffect('bloom')}
            />
            Bloom
          </label>
          <label>
            <input
              type="checkbox"
              checked={enabledEffects.depthOfField}
              onChange={() => toggleEffect('dof')}
            />
            Depth of Field
          </label>
          <label>
            <input
              type="checkbox"
              checked={enabledEffects.motionBlur}
              onChange={() => toggleEffect('motionBlur')}
            />
            Motion Blur
          </label>
          <label>
            <input
              type="checkbox"
              checked={enabledEffects.filmGrain}
              onChange={() => toggleEffect('filmGrain')}
            />
            Film Grain
          </label>
          <label>
            <input
              type="checkbox"
              checked={enabledEffects.chromaticAberration}
              onChange={() => toggleEffect('ca')}
            />
            Chromatic Aberration
          </label>
        </div>

        {/* Performance Stats */}
        <div>
          <h3>Performance</h3>
          <p>FPS: {fps.toFixed(1)}</p>
          <p>Avg FPS: {averageFPS.toFixed(1)}</p>
          <p>Performance Mode: {performanceMode ? 'ON' : 'OFF'}</p>
          <button onClick={togglePerformanceMode}>Toggle Performance Mode</button>
        </div>
      </div>

      <div style={{ marginTop: '1rem', padding: '1rem', background: '#222', borderRadius: '4px' }}>
        <h3>Test Verification</h3>
        <ul>
          <li>✅ Glowing magenta sphere (left) - Tests bloom effect</li>
          <li>✅ Green cube (center) - In focus for DOF test</li>
          <li>✅ Blue sphere (back right) - Out of focus, should blur with DOF</li>
          <li>✅ Camera orbits - Tests motion blur during movement</li>
          <li>✅ Film grain - Visible animated noise overlay</li>
          <li>✅ Use damage buttons - Tests chromatic aberration flash</li>
          <li>✅ Performance stats - Monitor FPS (target: 45-60 FPS)</li>
        </ul>
      </div>
    </div>
  );
}
