"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Loader2, Sparkles, Sun, Moon, Globe2 } from 'lucide-react';
import type { SimulationRow, FilterState, TimeMode } from '@/lib/spis/types';
import { getColorForValue } from '@/lib/spis/colorScale';
import { isDaytime, subsolarPoint } from '@/lib/spis/solar';
import { fetchOvation, type OvationData } from '@/lib/spis/ovation';
const worldTextureUrl = '/spis/world-map.jpg';

interface Globe3DProps {
  simData: SimulationRow[];
  filters: FilterState;
  mapDataRange: { min: number; max: number };
  now: Date;
}

const RADIUS = 1;

// Convert lat/lon (deg) to a unit sphere position scaled by radius.
function latLonToVec3(lat: number, lon: number, r = RADIUS): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

function hslStringToColor(hsl: string): THREE.Color {
  const m = hsl.match(/hsl\(([-\d.]+),\s*([\d.]+)%?,\s*([\d.]+)%?\)/);
  if (!m) return new THREE.Color('white');
  const c = new THREE.Color();
  c.setHSL(parseFloat(m[1]) / 360, parseFloat(m[2]) / 100, parseFloat(m[3]) / 100);
  return c;
}

/* ---------------- Earth with day/night shader ---------------- */

interface EarthProps {
  texture: THREE.Texture;
  subsolarLat: number;
  subsolarLon: number;
}

function Earth({ texture, subsolarLat, subsolarLon }: EarthProps) {
  const sunDir = useMemo(() => latLonToVec3(subsolarLat, subsolarLon, 1), [subsolarLat, subsolarLon]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          dayTexture: { value: texture },
          sunDirection: { value: sunDir.clone() },
        },
        vertexShader: /* glsl */ `
          varying vec3 vWorldPos;
          varying vec2 vUv;
          varying vec3 vNormal;
          void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vWorldPos = worldPos.xyz;
            gl_Position = projectionMatrix * viewMatrix * worldPos;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform sampler2D dayTexture;
          uniform vec3 sunDirection;
          varying vec3 vWorldPos;
          varying vec2 vUv;
          void main() {
            vec3 normal = normalize(vWorldPos);
            float cosAngle = dot(normal, normalize(sunDirection));
            // Smooth terminator
            float dayMix = smoothstep(-0.1, 0.15, cosAngle);
            vec3 dayColor = texture2D(dayTexture, vUv).rgb;
            vec3 nightColor = dayColor * 0.18 + vec3(0.02, 0.04, 0.10);
            vec3 color = mix(nightColor, dayColor, dayMix);
            gl_FragColor = vec4(color, 1.0);
          }
        `,
      }),
    [texture, sunDir],
  );

  // Update sun direction when it changes
  useEffect(() => {
    material.uniforms.sunDirection.value.copy(sunDir);
  }, [sunDir, material]);

  return (
    <mesh>
      <sphereGeometry args={[RADIUS, 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

/* ---------------- Satellite potential heatmap (instanced quads) ---------------- */

interface HeatmapProps {
  simData: SimulationRow[];
  range: { min: number; max: number };
  filters: FilterState;
  now: Date;
}

function Heatmap({ simData, range, filters, now }: HeatmapProps) {
  // Aggregate to a 30°x30° grid (matches sample data resolution)
  const cells = useMemo(() => {
    const grid = new Map<string, { lat: number; lon: number; values: number[] }>();
    simData.forEach((row) => {
      const latBin = Math.floor(row.lat / 30) * 30;
      const lonBin = Math.floor((row.lon + 180) / 30) * 30 - 180;
      const key = `${latBin}_${lonBin}`;
      if (!grid.has(key)) grid.set(key, { lat: latBin, lon: lonBin, values: [] });
      grid.get(key)!.values.push(row.avPot);
    });
    return Array.from(grid.values()).map((g) => ({
      lat: g.lat + 15, // cell center
      lon: g.lon + 15,
      avg: g.values.reduce((a, b) => a + b, 0) / g.values.length,
    }));
  }, [simData]);

  return (
    <group>
      {cells.map((cell) => {
        const pos = latLonToVec3(cell.lat, cell.lon, RADIUS * 1.005);
        const color = getColorForValue(Math.abs(cell.avg), range.min, range.max);
        const day = filters.timeMode === 'AUTO'
          ? isDaytime(cell.lat, cell.lon, now)
          : filters.timeMode === 'DAY';
        return (
          <mesh
            key={`${cell.lat}_${cell.lon}`}
            position={pos}
            onUpdate={(m) => m.lookAt(0, 0, 0)}
          >
            <circleGeometry args={[0.06, 24]} />
            <meshBasicMaterial
              color={hslStringToColor(color)}
              transparent
              opacity={day ? 0.75 : 0.55}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/* ---------------- OVATION aurora overlay ---------------- */

function Aurora({ data }: { data: OvationData | null }) {
  const points = useMemo(() => {
    if (!data) return null;
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];
    data.points.forEach((p) => {
      const v = latLonToVec3(p.lat, p.lon, RADIUS * 1.012);
      positions.push(v.x, v.y, v.z);
      // green-to-magenta gradient by intensity
      const t = Math.min(1, p.value / 100);
      const c = new THREE.Color().setHSL(0.35 - t * 0.2, 1.0, 0.45 + t * 0.15);
      colors.push(c.r, c.g, c.b);
      sizes.push(0.5 + t * 2.5);
    });
    return {
      positions: new Float32Array(positions),
      colors: new Float32Array(colors),
      sizes: new Float32Array(sizes),
    };
  }, [data]);

  if (!points) return null;

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points.positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[points.colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={0.012}
        sizeAttenuation
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ---------------- Sub-solar marker ---------------- */

function SunMarker({ lat, lon }: { lat: number; lon: number }) {
  const pos = useMemo(() => latLonToVec3(lat, lon, RADIUS * 1.04), [lat, lon]);
  return (
    <mesh position={pos}>
      <sphereGeometry args={[0.025, 16, 16]} />
      <meshBasicMaterial color="#ffd24a" />
    </mesh>
  );
}

/* ---------------- Main ---------------- */

function AutoRotate({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.03;
  });
  return <group ref={ref}>{children}</group>;
}

export function Globe3D({ simData, filters, mapDataRange, now }: Globe3DProps) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [ovation, setOvation] = useState<OvationData | null>(null);
  const [ovationError, setOvationError] = useState<string | null>(null);

  // Load earth texture
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(worldTextureUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      setTexture(tex);
    });
  }, []);

  // Fetch OVATION on mount + every 5 min
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetchOvation()
        .then((d) => { if (!cancelled) { setOvation(d); setOvationError(null); } })
        .catch((e) => { if (!cancelled) setOvationError(e.message ?? 'fetch failed'); });
    };
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const sub = useMemo(() => subsolarPoint(now), [now]);

  return (
    <div className="flex-1 relative bg-background overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-background/80 to-transparent pointer-events-none">
        <div className="flex items-center gap-2">
          <Globe2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">3D 위성 전위 / 오로라</h2>
          <span className="text-xs text-muted-foreground ml-2">
            FORM: {filters.form} · {filters.timeMode === 'AUTO' ? `AUTO (UTC ${now.toISOString().slice(11, 16)})` : filters.timeMode}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Sun className="h-3 w-3 text-primary" />subsolar {sub.lat.toFixed(1)}°, {sub.lon.toFixed(1)}°</span>
          {filters.showAurora && (
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {ovation
                ? `OVATION ${ovation.observationTime.slice(11, 16)}`
                : ovationError
                  ? 'OVATION 실패'
                  : 'OVATION 로딩…'}
            </span>
          )}
        </div>
      </div>

      {!texture && (
        <div className="absolute inset-0 z-20 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading globe texture…
        </div>
      )}

      <Canvas camera={{ position: [0, 0, 3], fov: 45 }} dpr={[1, 2]}>
        <color attach="background" args={['#05070d']} />
        <ambientLight intensity={0.6} />
        <Stars radius={50} depth={20} count={3000} factor={2} fade speed={0.5} />

        {texture && (
          <>
            <Earth texture={texture} subsolarLat={sub.lat} subsolarLon={sub.lon} />
            {filters.showSatellite && (
              <Heatmap simData={simData} range={mapDataRange} filters={filters} now={now} />
            )}
            {filters.showAurora && <Aurora data={ovation} />}
            <SunMarker lat={sub.lat} lon={sub.lon} />
          </>
        )}

        <OrbitControls
          enablePan={false}
          minDistance={1.4}
          maxDistance={6}
          rotateSpeed={0.6}
          zoomSpeed={0.7}
        />
      </Canvas>

      {/* Footer hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 text-[11px] text-muted-foreground bg-card/70 backdrop-blur px-3 py-1 rounded-full border border-border">
        드래그로 회전 · 휠로 확대 · OVATION 5분마다 갱신
      </div>
    </div>
  );
}
