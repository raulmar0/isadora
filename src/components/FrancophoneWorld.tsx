import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createWorld } from './world/createWorld';

export interface FrancophoneWorldProps {
  reducedMotion: boolean;
  paused: boolean;
  resetKey: number;
  onReady?: () => void;
  onError?: () => void;
}

interface WorldController {
  wake: () => void;
  reset: () => void;
}

export default function FrancophoneWorld({ reducedMotion, paused, resetKey, onReady, onError }: FrancophoneWorldProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<WorldController | null>(null);
  const preferencesRef = useRef({ reducedMotion, paused });
  const callbacksRef = useRef({ onReady, onError });
  preferencesRef.current = { reducedMotion, paused };
  callbacksRef.current = { onReady, onError };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      callbacksRef.current.onError?.();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-6, 6, 4.5, -4.5, 0.1, 80);
    camera.position.set(8.8, 7.3, 12.5);
    camera.lookAt(0, 1.55, 0);
    scene.add(new THREE.HemisphereLight('#fffbef', '#b8b697', 2.8));
    const sun = new THREE.DirectionalLight('#fff0d9', 4.2);
    sun.position.set(-4, 9, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -6;
    sun.shadow.camera.right = 6;
    sun.shadow.camera.top = 7;
    sun.shadow.camera.bottom = -5;
    sun.shadow.camera.near = 0.1;
    sun.shadow.camera.far = 24;
    sun.shadow.normalBias = 0.035;
    sun.shadow.bias = -0.0002;
    sun.shadow.radius = 4;
    scene.add(sun);
    const fill = new THREE.DirectionalLight('#e0f0f2', 0.9);
    fill.position.set(5, 3, -5);
    scene.add(fill);

    const world = createWorld(wake);
    scene.add(world.root);
    const shadowGeometry = new THREE.PlaneGeometry(30, 30);
    const shadowMaterial = new THREE.ShadowMaterial({ color: '#776841', opacity: 0.115 });
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.64;
    shadow.receiveShadow = true;
    scene.add(shadow);

    let disposed = false;
    let failed = false;
    let frame = 0;
    let lastTime = 0;
    let animationTime = 0;
    let ready = false;
    let visible = true;
    let targetRotation = -0.08;
    let rotation = -0.08;
    let activePointer: number | null = null;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let pointerRotation = 0;
    let dragging = false;
    let needsRender = true;

    function render(now: number) {
      frame = 0;
      if (disposed || failed || !visible || document.hidden) return;
      const delta = Math.min(lastTime ? (now - lastTime) / 1000 : 1 / 60, 0.05);
      lastTime = now;
      const motion = !preferencesRef.current.paused && !preferencesRef.current.reducedMotion;
      if (motion) animationTime += delta;
      const nextRotation = preferencesRef.current.reducedMotion
        ? targetRotation
        : THREE.MathUtils.lerp(rotation, targetRotation, 1 - Math.exp(-delta * 9));
      const settling = Math.abs(nextRotation - targetRotation) > 0.0001;
      if (motion || needsRender || settling || dragging) {
        rotation = nextRotation;
        world.root.rotation.y = rotation + (!preferencesRef.current.reducedMotion && !dragging ? Math.sin(animationTime * 0.22) * 0.035 : 0);
        world.animate(animationTime, !preferencesRef.current.reducedMotion);
        try {
          renderer.render(scene, camera);
          if (!ready) {
            ready = true;
            callbacksRef.current.onReady?.();
          }
        } catch {
          failed = true;
          callbacksRef.current.onError?.();
          return;
        }
        needsRender = false;
      }
      if (motion || settling || dragging) frame = window.requestAnimationFrame(render);
    }

    function wake() {
      needsRender = true;
      if (!disposed && !failed && !frame && visible && !document.hidden) {
        lastTime = 0;
        frame = window.requestAnimationFrame(render);
      }
    }

    function reset() {
      targetRotation = -0.08;
      animationTime = 0;
      if (preferencesRef.current.reducedMotion) rotation = targetRotation;
      wake();
    }
    controlsRef.current = { wake, reset };

    function resize() {
      const { width, height } = mount!.getBoundingClientRect();
      if (width < 1 || height < 1) return;
      const aspect = width / height;
      const viewHeight = Math.max(6.8, 9.7 / aspect);
      camera.left = -viewHeight * aspect / 2;
      camera.right = viewHeight * aspect / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      wake();
    }
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    function pointerDown(event: PointerEvent) {
      if (activePointer !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
      activePointer = event.pointerId;
      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      pointerRotation = targetRotation;
    }
    function pointerMove(event: PointerEvent) {
      if (activePointer !== event.pointerId) return;
      const dx = event.clientX - pointerStartX;
      const dy = event.clientY - pointerStartY;
      if (!dragging && Math.abs(dx) > 5 && Math.abs(dx) > Math.abs(dy)) {
        dragging = true;
        mount!.setPointerCapture(event.pointerId);
        mount!.style.cursor = 'grabbing';
      }
      if (dragging) {
        targetRotation = pointerRotation + dx * 0.008;
        wake();
      }
    }
    function pointerEnd(event: PointerEvent) {
      if (activePointer !== event.pointerId) return;
      if (mount!.hasPointerCapture(event.pointerId)) mount!.releasePointerCapture(event.pointerId);
      activePointer = null;
      dragging = false;
      mount!.style.cursor = 'grab';
      wake();
    }
    function pointerLeave(event: PointerEvent) {
      if (!dragging) pointerEnd(event);
    }
    function keyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        targetRotation += event.key === 'ArrowLeft' ? -0.22 : 0.22;
        wake();
      } else if (event.key === 'Home') {
        event.preventDefault();
        reset();
      }
    }
    function visibilityChange() {
      if (document.hidden && frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      } else wake();
    }
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible && frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      } else wake();
    }, { rootMargin: '100px' });
    intersectionObserver.observe(mount);
    function contextLost(event: Event) {
      event.preventDefault();
      failed = true;
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      callbacksRef.current.onError?.();
    }
    mount.addEventListener('pointerdown', pointerDown);
    mount.addEventListener('pointermove', pointerMove);
    mount.addEventListener('pointerup', pointerEnd);
    mount.addEventListener('pointercancel', pointerEnd);
    mount.addEventListener('pointerleave', pointerLeave);
    mount.addEventListener('lostpointercapture', pointerEnd);
    mount.addEventListener('keydown', keyDown);
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    document.addEventListener('visibilitychange', visibilityChange);

    return () => {
      disposed = true;
      controlsRef.current = null;
      if (frame) window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      mount.removeEventListener('pointerdown', pointerDown);
      mount.removeEventListener('pointermove', pointerMove);
      mount.removeEventListener('pointerup', pointerEnd);
      mount.removeEventListener('pointercancel', pointerEnd);
      mount.removeEventListener('pointerleave', pointerLeave);
      mount.removeEventListener('lostpointercapture', pointerEnd);
      mount.removeEventListener('keydown', keyDown);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      document.removeEventListener('visibilitychange', visibilityChange);
      world.dispose();
      shadowGeometry.dispose();
      shadowMaterial.dispose();
      sun.shadow.map?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);

  useEffect(() => { controlsRef.current?.wake(); }, [reducedMotion, paused]);
  useEffect(() => { controlsRef.current?.reset(); }, [resetKey]);

  return (
    <div
      ref={mountRef}
      className="francophone-world"
      lang="fr"
      role="group"
      aria-label="Un petit monde francophone en 3D. Faites glisser pour tourner, ou utilisez les flèches gauche et droite. La touche Début rétablit la vue."
      tabIndex={0}
      style={{ position: 'absolute', inset: 0, cursor: 'grab', touchAction: 'pan-y' }}
    />
  );
}

export { FrancophoneWorld };
