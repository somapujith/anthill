import { useEffect, useRef, useState } from "react";
import "./hero-mark.css";

export default function HeroMark() {
  const host = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = host.current;
    const abort = new AbortController();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let disposed = false;
    let failed = false;
    let visible = true;
    let frame = 0;
    let lastTime = 0;
    let renderer, scene, camera, rig, observer, intersection;
    const geometries = [];
    const materials = [];
    const target = { x: 0.08, y: -0.3 };
    const base = { x: 0.08, y: -0.3 };

    function requestFrame() {
      if (
        !disposed &&
        !failed &&
        visible &&
        !document.hidden &&
        !frame &&
        renderer
      )
        frame = requestAnimationFrame(draw);
    }

    function draw(time) {
      frame = 0;
      if (disposed || failed || !visible || document.hidden) return;
      try {
        const delta = Math.min((time - (lastTime || time)) / 1000, 0.05);
        lastTime = time;
        const amount = reduced.matches
          ? 1
          : 1 - Math.exp(-7 * Math.max(delta, 1 / 60));
        rig.rotation.x += (target.x - rig.rotation.x) * amount;
        rig.rotation.y += (target.y - rig.rotation.y) * amount;
        renderer.render(scene, camera);
        setReady(true);
        if (
          Math.abs(rig.rotation.x - target.x) +
            Math.abs(rig.rotation.y - target.y) >
          0.0002
        )
          requestFrame();
      } catch {
        failed = true;
        setReady(false);
      }
    }

    function resize() {
      if (!renderer || disposed) return;
      const { width, height } = element.getBoundingClientRect();
      if (!width || !height) return;
      const aspect = width / height;
      const halfHeight = Math.max(2.1, 1.5 / aspect);
      camera.left = -halfHeight * aspect;
      camera.right = halfHeight * aspect;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      requestFrame();
    }

    function move(event) {
      if (reduced.matches || !pointer.matches || !rig) return;
      const rect = element.getBoundingClientRect();
      target.x =
        base.x + ((event.clientY - rect.top) / rect.height - 0.5) * 0.16;
      target.y =
        base.y + ((event.clientX - rect.left) / rect.width - 0.5) * 0.3;
      requestFrame();
    }

    function reset() {
      Object.assign(target, base);
      requestFrame();
    }

    function visibility() {
      lastTime = 0;
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else requestFrame();
    }

    function loseContext(event) {
      event.preventDefault();
      failed = true;
      cancelAnimationFrame(frame);
      frame = 0;
      setReady(false);
    }

    async function initialize() {
      try {
        const [THREE, { SVGLoader }, response] = await Promise.all([
          import("three"),
          import("three/addons/loaders/SVGLoader.js"),
          fetch("/brand/mark-red.svg", { signal: abort.signal }),
        ]);
        if (!response.ok) throw new Error("Brand mark unavailable");
        const svg = await response.text();
        if (disposed) return;

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("webgl2", {
          alpha: true,
          antialias: true,
          powerPreference: "low-power",
        });
        if (!context) return;
        renderer = new THREE.WebGLRenderer({
          canvas,
          context,
          alpha: true,
          antialias: true,
          powerPreference: "low-power",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.setClearColor(0xffffff, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.NoToneMapping;
        renderer.domElement.setAttribute("aria-hidden", "true");
        renderer.domElement.addEventListener("webglcontextlost", loseContext);
        element.appendChild(renderer.domElement);

        scene = new THREE.Scene();
        camera = new THREE.OrthographicCamera(-2.1, 2.1, 2.1, -2.1, 0.1, 30);
        camera.position.set(0, 0, 8);
        rig = new THREE.Group();
        const artwork = new THREE.Group();
        const face = new THREE.MeshStandardMaterial({
          color: 0xe6212b,
          roughness: 0.53,
          metalness: 0.04,
        });
        const edge = new THREE.MeshStandardMaterial({
          color: 0xa8101a,
          roughness: 0.59,
          metalness: 0.03,
        });
        materials.push(face, edge);
        for (const path of new SVGLoader().parse(svg).paths) {
          for (const shape of SVGLoader.createShapes(path)) {
            const geometry = new THREE.ExtrudeGeometry(shape, {
              depth: 22,
              bevelEnabled: true,
              bevelSegments: 3,
              steps: 1,
              bevelSize: 0.7,
              bevelThickness: 0.7,
              curveSegments: 16,
            });
            geometries.push(geometry);
            artwork.add(new THREE.Mesh(geometry, [face, edge]));
          }
        }
        if (!geometries.length)
          throw new Error("Brand mark geometry unavailable");
        artwork.scale.y = -1;
        artwork.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(artwork);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        artwork.position.copy(center).multiplyScalar(-1);
        const scale = 3.25 / size.y;
        rig.scale.setScalar(scale);
        rig.add(artwork);
        rig.rotation.set(base.x, reduced.matches ? base.y : -0.58, -0.055);
        scene.add(rig);
        scene.add(new THREE.HemisphereLight(0xffffff, 0xe3d9d9, 1.1));
        const key = new THREE.DirectionalLight(0xffffff, 2.5);
        key.position.set(-3, 5, 6);
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xffffff, 0.4);
        fill.position.set(5, -1, 3);
        scene.add(fill);

        observer = new ResizeObserver(resize);
        observer.observe(element);
        intersection = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          lastTime = 0;
          if (visible) requestFrame();
          else {
            cancelAnimationFrame(frame);
            frame = 0;
          }
        });
        intersection.observe(element);
        resize();
      } catch {
        if (!disposed) {
          failed = true;
          setReady(false);
        }
      }
    }

    element.addEventListener("pointermove", move);
    element.addEventListener("pointerleave", reset);
    document.addEventListener("visibilitychange", visibility);
    reduced.addEventListener("change", reset);
    pointer.addEventListener("change", reset);
    initialize();
    return () => {
      disposed = true;
      abort.abort();
      cancelAnimationFrame(frame);
      observer?.disconnect();
      intersection?.disconnect();
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", reset);
      document.removeEventListener("visibilitychange", visibility);
      reduced.removeEventListener("change", reset);
      pointer.removeEventListener("change", reset);
      renderer?.domElement.removeEventListener("webglcontextlost", loseContext);
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={host}
      className={`hero-mark${ready ? " is-ready" : ""}`}
      aria-hidden="true"
    >
      <img
        className="hero-mark-fallback"
        src="/brand/mark-red.svg"
        alt=""
        width="152"
        height="212"
      />
    </div>
  );
}
