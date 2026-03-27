import React, { useState, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Line, Html } from '@react-three/drei'
import * as THREE from 'three'
import { OrthographicCamera } from '@react-three/drei'
import { useEffect } from 'react';

import sistemas from './data/643.json'
import tecnologia from './data/243.json'
//import software from './data/software.json'

const PROGRAMAS = {
  sistemas: {
    nombre: "Ing. de Sistemas-643",
    data: sistemas
  },
  tecnologia: {
    nombre: "Tecnol. en Sistemas-243",
    data: tecnologia
  }
  //software: {
  //  nombre: "Ingeniería de Software",
  //  data: software
  //}
};

const COLORES = {
  seleccion: "#ef4444",
  adelante: "#22c55e",   // verde puro, brillante (acción)
  atras: "#0ea5e9",
  neutro: "#cbd5e1",
  fondo: "#f8fafc"
};

const COLORES_AREA = {
  programacion: "#4f46e5",   // índigo más marcado (antes #6366f1)
  sistemas: "#059669",       // verde más oscuro y distinto (antes #10b981)
  matematicas: "#7c3aed",    // violeta más profundo
  humanidades: "#f59e0b",    // ámbar (OK)
  gestion: "#db2777",        // rosado más fuerte (evita parecer rojo)
  default: "#64748b"
};

// ---------- NODO ----------
function Nodo({ materia, nodosAdelante, nodosAtras, isHovered, isRuta, isSeleccionada, nodosActivos, onHover, onClick }) {
  const groupRef = useRef();
  const posX = (Number(materia.sem) || 1) * 5;
  const posY = (Number(materia.fila) || 1) * -3;

  const nombreTxt = materia.nombre.toUpperCase();
  const fontSize = nombreTxt.length > 20 ? 0.40 : 0.45;

  const colorBase = COLORES_AREA[materia.area] || COLORES_AREA.default;

  const esAdelante = nodosAdelante?.has?.(materia.id);
  const esAtras = nodosAtras?.has?.(materia.id);

  const color =
    isSeleccionada
      ? COLORES.seleccion
      : esAdelante
        ? COLORES.adelante
        : esAtras
          ? COLORES.atras
          : COLORES_AREA[materia.area] || COLORES_AREA.default;

  const opacidad = nodosActivos.size > 0
    ? (nodosActivos.has(materia.id) ? 1 : 0.75)
    : 1;

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();

      groupRef.current.position.y =
        posY + Math.sin(t + materia.sem) * 0.05;

      const scale = isHovered ? 1.2 : isSeleccionada ? 1.25 : 1;
      groupRef.current.scale.lerp(new THREE.Vector3(scale, scale, 1), 0.1);
    }
  });

  const geometry = useMemo(() => new THREE.PlaneGeometry(3.6, 1.9), []);
  return (
    <group ref={groupRef} position={[posX, posY, 0.01]}>
      <mesh
        onPointerOver={() => onHover(materia.id)}
        onPointerOut={() => onHover(null)}
        onClick={(e) => {
            e.stopPropagation(); // 🔥 evita que el fondo capture el click
            onClick(materia);
          }}
      >
        <primitive object={geometry} />

        <meshStandardMaterial color={color} transparent opacity={opacidad} roughness={0.9} metalness={0.1} />
        {/*
          <meshBasicMaterial color={color} transparent opacity={opacidad} />
          <meshBasicMaterial color={color} transparent opacity={opacidad} toneMapped={false} />
        <meshStandardMaterial color={color} transparent opacity={opacidad} roughness={0.9} metalness={0.1} />*/}




      </mesh>
      {isHovered && (
        <mesh>
          <planeGeometry args={[4, 2.3]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.15}
          />
        </mesh>
      )}
      <Text
        position={[0, 0, 0.1]}
        fontSize={fontSize}
        color="white"
        maxWidth={3}
        textAlign="center"
        anchorY="middle"
      >
        {nombreTxt}
      </Text>

    </group>
  );
}

// ---------- CONEXIÓN ----------
function Conexion({
  inicio,
  fin,
  nodosAdelante,
  nodosAtras,
  tipo,
  offsetIndex = 0,
  total = 1,
  onTeleport,
  tunelActivo,
  setTunelActivo
}) {
  const offset = (offsetIndex - (total - 1) / 2) * 0.8;

  const esTunel = tipo === "tunel";

  // 🔥 ID único
  const tunnelId = `${inicio.id}__${fin.id}`;
  const activoTunel = tunelActivo === tunnelId;

  // 🎨 COLOR POR PAREJA
  const getTunnelColor = (id) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return new THREE.Color(`hsl(${hue}, 70%, 55%)`);
  };

  const color = getTunnelColor(tunnelId);

  // ---------------------------
  // 🌀 PORTALES (TÚNELES)
  // ---------------------------
  const portalRef1 = useRef();
  const portalRef2 = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (portalRef1.current) {
      const s = (activoTunel ? 1.4 : 1) + Math.sin(t * 3) * 0.1;
      portalRef1.current.scale.set(s, s, s);
    }

    if (portalRef2.current) {
      const s = (activoTunel ? 1.4 : 1) + Math.sin(t * 3 + 1) * 0.1;
      portalRef2.current.scale.set(s, s, s);
    }
  });

  // ---------------------------
  // ⚡ FLUJO EN CONEXIONES
  // ---------------------------
  const flowRef = useRef();

  const curve = useMemo(() => {
    return new THREE.CubicBezierCurve3(
      new THREE.Vector3(inicio.sem * 5 + 1.8, inicio.fila * -3 + offset, 0),
      new THREE.Vector3(inicio.sem * 5 + 3, inicio.fila * -3 + offset, 0),
      new THREE.Vector3(fin.sem * 5 - 3, fin.fila * -3 + offset, 0),
      new THREE.Vector3(fin.sem * 5 - 1.8, fin.fila * -3 + offset, 0)
    );
  }, [inicio, fin, offset]);

  useFrame(({ clock }) => {
    if (!flowRef.current || esTunel) return;

    const t = (clock.getElapsedTime() * 0.25) % 1;
    const point = curve.getPoint(t);

    flowRef.current.position.set(point.x, point.y, 0.5);
  });

  const points = useMemo(() => curve.getPoints(20), [curve]);

  const esAdelante =
    nodosAdelante?.has?.(inicio.id) &&
    nodosAdelante?.has?.(fin.id);

  const esAtras =
    nodosAtras?.has?.(inicio.id) &&
    nodosAtras?.has?.(fin.id);

  // ===========================
  // 🌀 RENDER TÚNEL
  // ===========================
  if (esTunel) {
    return (
      <>
        {/* 🔵 PORTAL SALIDA */}
        <mesh
          ref={portalRef1}
          position={[inicio.sem * 5 + 2, inicio.fila * -3 + offset, 1]}
          onPointerOver={(e) => {
            e.stopPropagation();
            setTunelActivo(tunnelId);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setTunelActivo(null);
            document.body.style.cursor = "default";
          }}
          onClick={(e) => {
            e.stopPropagation();
            onTeleport?.(inicio);
          }}
        >
          <circleGeometry args={[0.25, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.95} />
        </mesh>

        {/* ✨ GLOW SALIDA */}
        <mesh position={[inicio.sem * 5 + 2, inicio.fila * -3 + offset, 0.9]}>
          <circleGeometry args={[0.50, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.2} />
        </mesh>

        {/* 🟣 PORTAL ENTRADA */}
        <mesh
          ref={portalRef2}
          position={[fin.sem * 5 - 2, fin.fila * -3 + offset, 1]}
          onPointerOver={(e) => {
            e.stopPropagation();
            setTunelActivo(tunnelId);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setTunelActivo(null);
            document.body.style.cursor = "default";
          }}
          onClick={(e) => {
            e.stopPropagation();
            onTeleport?.(inicio);
          }}
        >
          <circleGeometry args={[0.25, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.95} />
        </mesh>

        {/* ✨ GLOW ENTRADA */}
        <mesh position={[fin.sem * 5 - 2, fin.fila * -3 + offset, 0.9]}>
          <circleGeometry args={[0.4, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.2} />
        </mesh>

        {/* 🏷 LABEL */}
        {/*<Text
          position={[fin.sem * 5 - 2, fin.fila * -3 + offset + 0.6, 1]}
          fontSize={0.28}
          color="#111"
        >
          ↦ {inicio.codigos?.[0] || inicio.id}
        </Text>*/}
      </>
    );
  }

  // ===========================
  // 🔗 RENDER CONEXIÓN NORMAL
  // ===========================
  return (
    <>
      <Line
        points={points}
        color={
          esAdelante
            ? "#22c55e"
            : esAtras
            ? "#3b82f6"
            : "#cbd5e1"
        }
        lineWidth={1.5}
        transparent
        opacity={0.7}
        dashed={tipo === "correq"}
        dashSize={0.2}
        gapSize={0.1}
      />

      {/* ⚡ PARTÍCULA DE FLUJO */}
     {/* {(esAdelante || esAtras) && (
        <mesh ref={flowRef}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
        </mesh>
      )}*/}
    </>
  );
}

function CameraAnimator({ controlsRef, cameraTarget }) {
  useFrame(() => {
    if (!cameraTarget.current || !controlsRef.current) return;

    const { target, position } = cameraTarget.current;

    controlsRef.current.target.lerp(target, 0.1);
    controlsRef.current.object.position.lerp(position, 0.1);
  });

  return null;
}

import { useThree } from '@react-three/fiber';

function CameraFit({ bounds, centro }) {
  const { camera, size } = useThree();

  useEffect(() => {
    if (!bounds.width || !bounds.height) return;

    const padding = 0.90;

    const zoomX = size.width / bounds.width;
    const zoomY = size.height / bounds.height;

    const zoom = Math.min(zoomX, zoomY) * padding;

    camera.zoom = zoom;
    camera.updateProjectionMatrix();

    camera.position.set(centro[0], centro[1], 100);
  }, [bounds, size, centro, camera]);

  return null;
}
// ---------- APP ----------
export default function App() {
  const [materias, setMaterias] = useState([]);
  const [hoveredId, setHoveredId] = useState(null);
  const [seleccionada, setSeleccionada] = useState(null);
  const [nodosActivos, setNodosActivos] = useState(new Set());
  const [areasActivas, setAreasActivas] = useState(new Set());
  const [modo, setModo] = useState("adelante");
  const [nodosAdelante, setNodosAdelante] = useState(new Set());
  const [nodosAtras, setNodosAtras] = useState(new Set());
  const [programaActivo, setProgramaActivo] = useState("sistemas");
  const [tunelActivo, setTunelActivo] = useState(null);
  const controlsRef = useRef();
  const cameraTarget = useRef(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const programa = PROGRAMAS[programaActivo];
    if (programa) {
      setMaterias(programa.data);
      setSeleccionada(null);
      setNodosAdelante(new Set());
      setNodosAtras(new Set());
    }
  }, [programaActivo]);

  useEffect(() => {
    document.body.style.cursor = hoveredId ? "pointer" : "default";
  }, [hoveredId]);


  // 📐 DIMENSIONES REALES DE LA MALLA
  const bounds = useMemo(() => {
    if (!materias.length) return { width: 50, height: 50 };

    const xs = materias.map(m => m.sem * 5);
    const ys = materias.map(m => m.fila * -3);

    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);

    return { width, height };
  }, [materias]);

  // 🔍 ZOOM INTELIGENTE
  const zoomInicial = useMemo(() => {
    const padding = 0.85;

    const zoomX = window.innerWidth / bounds.width;
    const zoomY = window.innerHeight / bounds.height;

    return Math.min(zoomX, zoomY) * padding;
  }, [bounds]);

  const centro = useMemo(() => {
    if (!materias.length) return [0, 0, 0];

    const xs = materias.map(m => m.sem * 5);
    const ys = materias.map(m => m.fila * -3);

    return [
      (Math.min(...xs) + Math.max(...xs)) / 2,
      (Math.min(...ys) + Math.max(...ys)) / 2,
      0
    ];
  }, [materias]);

  const obtenerDependencias = (materia) => {
        const resultado = [];

        (materia.prereq || []).forEach((dep, offsetIndex) => {

          if (typeof dep === "string") {
            resultado.push({
              id: dep,
              tipo: "normal",
              offsetIndex: offsetIndex,
              total: materia.prereq.length
            });
          }

          else if (typeof dep === "object" && typeof dep.id === "string") {
            resultado.push({
              id: dep.id,
              tipo: dep.tipo || "normal",
              offsetIndex: offsetIndex,
              total: materia.prereq.length
            });
          }

          else if (typeof dep === "object" && Array.isArray(dep.id)) {
            dep.id.forEach((idInterno, i) => {
              resultado.push({
                id: idInterno,
                tipo: dep.tipo || "normal",
                offsetIndex: i,
                total: dep.id.length
              });
            });
          }

        });

        return resultado;
      };

  const grafo = useMemo(() => {
    const forward = new Map();
    const backward = new Map();

    materias.forEach(m => {
      const deps = obtenerDependencias(m);

      deps.forEach(d => {
        if (!forward.has(d.id)) forward.set(d.id, []);
        forward.get(d.id).push(m.id);

        if (!backward.has(m.id)) backward.set(m.id, []);
        backward.get(m.id).push(d.id);
      });
    });

    return { forward, backward };
  }, [materias]);

  const construirGrafo = (idBase) => {
      const adelante = new Set();
      const atras = new Set();

      const recorrerAdelante = (id) => {
        if (adelante.has(id)) return;
        adelante.add(id);

        (grafo.forward.get(id) || []).forEach(recorrerAdelante);
      };

      const recorrerAtras = (id) => {
        if (atras.has(id)) return;
        atras.add(id);

        (grafo.backward.get(id) || []).forEach(recorrerAtras);
      };

      if (modo !== "atras") recorrerAdelante(idBase);
      if (modo !== "adelante") recorrerAtras(idBase);

      return { adelante, atras };
    };

    const materiasFiltradas = useMemo(() => {
      return materias.filter(m => {
        const matchArea = areasActivas.size === 0 || areasActivas.has(m.area);
        const matchSearch = m.nombre.toLowerCase().includes(search.toLowerCase());
        return matchArea && matchSearch;
      });
    }, [materias, areasActivas, search]);

  const handleFile = (e) => {
    const reader = new FileReader();
    reader.onload = (f) => {
      const data = JSON.parse(f.target.result);
      setMaterias(data);
    };
    reader.readAsText(e.target.files[0]);
  };

  const mapaMaterias = useMemo(() => {
        const map = new Map();
        materias.forEach(m => map.set(m.id, m));
        return map;
      }, [materias]);

  const MODOS = [
              { value: "atras", label: "⬅️ prereq" },
              { value: "adelante", label: "➡️ Depend" },
              { value: "ambos", label: "🔀 Prereq+Depend" }
  ];

  return (


    <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
      }}>
      {/* TOPBAR */}
       <div style={{
          height: '64px',
          flexShrink: 0, // 🔥 evita que se reduzca
          width: '100%',
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px'
        }}>
        <input type="text" placeholder="Buscar materia..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '180px' }} /> <div style={{ fontWeight: 600, fontSize: '20px' }}> 🎓 Malla Interactiva SyH </div> <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}> <select value={programaActivo} onChange={(e) => setProgramaActivo(e.target.value)} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} > {Object.entries(PROGRAMAS).map(([key, p]) => ( <option key={key} value={key}>{p.nombre}</option> ))} </select> {MODOS.map(m => ( <button key={m.value} onClick={() => setModo(m.value)} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: modo === m.value ? '#111827' : 'white', color: modo === m.value ? 'white' : '#111', cursor: 'pointer' }} > {m.label} </button> ))} </div> </div>

       {/*SIDEBAR IZQUIERDA*/}
       {/*<div style={{
          display: 'flex',
          gap: '6px',
          marginLeft: '20px'
        }}>
          {Object.keys(COLORES_AREA).map(area => (
            area !== "default" && (
              <button
                key={area}
                onClick={() => {
                  const newSet = new Set(areasActivas);
                  newSet.has(area) ? newSet.delete(area) : newSet.add(area);
                  setAreasActivas(newSet);
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '999px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                  background: areasActivas.has(area)
                    ? COLORES_AREA[area]
                    : 'white',
                  color: areasActivas.has(area) ? 'white' : '#334155'
                }}
              >
                {area}
              </button>
            )
          ))}
        </div>*/}

       <div className="fixed top-16 left-0 w-64 h-[calc(100vh-64px)] bg-white/80 backdrop-blur-md border-r border-slate-200 p-4 z-20 overflow-y-auto">  {Object.keys(COLORES_AREA).map(area => ( area !== "default" && ( <label key={area} className="flex items-center gap-2 text-sm"> <input type="checkbox" onChange={() => { const newSet = new Set(areasActivas); newSet.has(area) ? newSet.delete(area) : newSet.add(area); setAreasActivas(newSet); }} /> <span style={{ color: COLORES_AREA[area] }}> {area} </span> </label> ) ))} </div>

      {/*SIDEBAR DERECHA*/}
      {seleccionada && (
        <div style={{
          position: 'fixed',
          right: 20,
          top: 80,
          width: '200px',
          maxHeight: '80vh',
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          padding: '20px',
          zIndex: 30,
          overflowY: 'auto',
          animation: 'fadeIn 0.3s ease'
        }}>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0 }}>{seleccionada.nombre}</h2>
            <button
              onClick={() => setSeleccionada(null)}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer'
              }}
            >
              ✖
            </button>
          </div>

          <p style={{ fontSize: '14px', color: '#475569' }}>
            {seleccionada.desc || "Sin descripción"}
          </p>

          <hr />

          <p><b>Créditos:</b> {seleccionada.cred}</p>
          <p><b>Semestre:</b> {seleccionada.sem}</p>

          <p>
            <b>Área:</b>{" "}
            <span style={{
              color: COLORES_AREA[seleccionada.area] || COLORES_AREA.default
            }}>
              {seleccionada.area}
            </span>
          </p>

        </div>
      )}

      {/* CANVAS */}
      <div style={{
        flex: 1,
        minHeight: 0,
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Canvas style={{ width: '100%', height: '100%' }}>

       {/*<CameraAnimator
        controlsRef={controlsRef}
        cameraTarget={cameraTarget}
      />*/}
      <CameraFit bounds={bounds} centro={centro} />
      <color attach="background" args={["#f1f5f9"]} />
      <fog attach="fog" args={['#f8fafc', 80, 200]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      <directionalLight position={[-5, -10, -5]} intensity={0.4} />
      <OrthographicCamera makeDefault />

       <OrbitControls
        ref={controlsRef}
        enableRotate={false}
        enablePan={true}
        enableZoom={true}
        zoomSpeed={0.8}
        panSpeed={0.8}
        minPolarAngle={Math.PI / 2}
        maxPolarAngle={Math.PI / 2}
        target={[centro[0], centro[1], 0]}
        makeDefault
      />

      {/* 🔥 FONDO CLICKEABLE */}
        <mesh
          position={[centro[0], centro[1], -1]}
          onClick={() => {
            setSeleccionada(null);
            setNodosAdelante(new Set());
            setNodosAtras(new Set());
          }}
        >
          <planeGeometry args={[1000, 1000]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>


        {/* CONEXIONES */}
        {materiasFiltradas.map(m =>
            obtenerDependencias(m).map((dep, i) => {
              const ori = mapaMaterias.get(dep.id);
              if (!ori) return null;

              return (
                <Conexion
                  key={`p-${dep.id}-${m.id}-${i}`}
                  inicio={ori}
                  fin={m}
                  nodosAdelante={nodosAdelante}
                  nodosAtras={nodosAtras}
                  tipo={dep.tipo}
                  offsetIndex={dep.offsetIndex}
                  total={dep.total}

                  tunelActivo={tunelActivo}
                  setTunelActivo={setTunelActivo}

                  onTeleport={(materiaDestino) => {
                    // 🔥 SELECCIONAR
                    setSeleccionada(materiaDestino);

                    const { adelante, atras } = construirGrafo(materiaDestino.id);
                    setNodosAdelante(adelante);
                    setNodosAtras(atras);

                    // 🔥 MOVER CÁMARA
                    if (controlsRef.current) {
                      const x = materiaDestino.sem * 5;
                      const y = materiaDestino.fila * -3;

                      const target = new THREE.Vector3(x, y, 0);
                      const position = new THREE.Vector3(x, y, 100);

                      cameraTarget.current = {
                        target: new THREE.Vector3(x, y, 0),
                        position: new THREE.Vector3(x, y, 100)
                      };
                    }
                  }}
                />
              );
            })
          )}

        {/* NODOS */}
        {materiasFiltradas.map(m => (
          <Nodo
            key={m.id}
            materia={m}
            isHovered={hoveredId === m.id}
            isRuta={nodosActivos.has(m.id)}
            isSeleccionada={seleccionada?.id === m.id}
            nodosActivos={nodosActivos}
            nodosAdelante={nodosAdelante}
            nodosAtras={nodosAtras}

            onHover={(id) => {
              setHoveredId(id);

              if (id) {
                const { adelante, atras } = construirGrafo(id);
                setNodosAdelante(adelante);
                setNodosAtras(atras);
              } else {
                setNodosAdelante(new Set());
                setNodosAtras(new Set());
              }
            }}

            onClick={(mat) => {
              if (!mat) return;

              // 🔁 toggle (abrir / cerrar)
              if (seleccionada?.id === mat.id) {
                setSeleccionada(null);
                setNodosAdelante(new Set());
                setNodosAtras(new Set());
                return;
              }

              // abrir
              setSeleccionada(mat);

              const { adelante, atras } = construirGrafo(mat.id);
              setNodosAdelante(adelante);
              setNodosAtras(atras);
            }}
          />
        ))}

      </Canvas>
    </div>
    </div>
  );
}











