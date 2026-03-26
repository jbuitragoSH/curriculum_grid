import React, { useState, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Line, Html } from '@react-three/drei'
import * as THREE from 'three'
import { OrthographicCamera } from '@react-three/drei'
//import { useEffect } from 'react';

import sistemas from './data/643.json'
import tecnologia from './data/243.json'
//import software from './data/software.json'

const PROGRAMAS = {
  sistemas: {
    nombre: "Ingeniería de Sistemas",
    data: sistemas
  },
  tecnologia: {
    nombre: "Tecnología en Sistemas",
    data: tecnologia
  }
  //software: {
  //  nombre: "Ingeniería de Software",
  //  data: software
  //}
};

const COLORES = {
  seleccion: "#ef4444",      // rojo claro moderno
  adelante: "#22c55e",       // verde limpio
  atras: "#3b82f6",          // azul claro (NO el mismo de áreas)
  neutro: "#cbd5e1",
  fondo: "#f8fafc"
};

const COLORES_AREA = {
  programacion: "#6366f1",   // índigo
  sistemas: "#10b981",       // esmeralda
  matematicas: "#8b5cf6",    // violeta
  humanidades: "#f59e0b",    // ámbar
  gestion: "#ec4899",        // rosado (cambiado para evitar rojo)
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

      const scale = isHovered || isSeleccionada ? 1.15 : 1;
      groupRef.current.scale.lerp(new THREE.Vector3(scale, scale, 1), 0.1);
    }
  });

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
        <planeGeometry args={[3.6, 1.9]} />
        <meshBasicMaterial color={color} transparent opacity={opacidad} />
      </mesh>
      {isHovered && (
        <mesh>
          <planeGeometry args={[3.8, 2.1]} />
          <meshBasicMaterial color="white" wireframe />
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

      {/*{isSeleccionada && (
        <Html position={[2, 1, 0]}>
          <div style={{
            background: 'white',
            padding: '10px',
            borderRadius: '8px',
            border: '2px solid red',
            width: '200px'
          }}>
            <b>{materia.nombre}</b>
            <p style={{ fontSize: '12px' }}>{materia.desc || "Sin descripción"}</p>
          </div>
        </Html>
      )}*/}
    </group>
  );
}

// ---------- CONEXIÓN ----------
function Conexion({ inicio, fin, nodosAdelante, nodosAtras, tipo, offsetIndex = 0, total = 1 }) {

  const offset = (offsetIndex - (total - 1) / 2) * 0.8;

  const points = useMemo(() => {
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(inicio.sem * 5 + 1.8, inicio.fila * -3 + offset, 0),
      new THREE.Vector3(inicio.sem * 5 + 3, inicio.fila * -3 + offset, 0),
      new THREE.Vector3(fin.sem * 5 - 3, fin.fila * -3 + offset, 0),
      new THREE.Vector3(fin.sem * 5 - 1.8, fin.fila * -3 + offset, 0)
    );
    return curve.getPoints(20);
  }, [inicio, fin, offset]);

  const esAdelante = nodosAdelante?.has?.(inicio.id) && nodosAdelante?.has?.(fin.id);
  const esAtras = nodosAtras?.has?.(inicio.id) && nodosAtras?.has?.(fin.id);

  const esTunel = tipo === "tunel";

  // 🎯 COLOR BASE
  const color =
    esAdelante ? COLORES.adelante :
    esAtras ? COLORES.atras :
    COLORES.neutro;

  // =========================
  // 🚇 TÚNEL (SIN LÍNEA)
  // =========================
  if (esTunel) {
    return (
      <>
        {/* SALIDA */}
        <mesh position={[inicio.sem * 5 + 2, inicio.fila * -3 + offset, 1]}>
          <circleGeometry args={[0.18, 20]} />
          <meshBasicMaterial color="#6366f1" />
        </mesh>

        {/* ENTRADA */}
        <mesh position={[fin.sem * 5 - 2, fin.fila * -3 + offset, 1]}>
          <circleGeometry args={[0.18, 20]} />
          <meshBasicMaterial color="#a855f7" />
        </mesh>

        {/* LABEL */}
        <Text
          position={[fin.sem * 5 - 2, fin.fila * -3 + offset + 0.6, 1]}
          fontSize={0.28}
          color="#111"
        >
          ↦ {inicio.codigos?.[0] || inicio.id}
        </Text>
      </>
    );
  }

  // =========================
  // 🔗 LÍNEA NORMAL
  // =========================
  return (
    <Line
      points={points}
      color={color}
      lineWidth={2}
      dashed={tipo === "correq"}
      dashSize={0.2}
      gapSize={0.1}
    />
  );
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

  const controlsRef = useRef();

  useMemo(() => {
      const programa = PROGRAMAS[programaActivo];
      if (programa) {
        setMaterias(programa.data);
        setSeleccionada(null);
        setNodosAdelante(new Set());
        setNodosAtras(new Set());
      }
    }, [programaActivo]);


  const zoomInicial = useMemo(() => {
      if (!materias.length) return 40;

      const ancho = Math.max(...materias.map(m => m.sem)) * 5;
      return 300 / ancho;
    }, [materias]);

  const centro = useMemo(() => {
    if (!materias.length) return [10, -5, 0];
    const xs = materias.map(m => m.sem * 5);
    const ys = materias.map(m => m.fila * -3);
    return [
      (Math.min(...xs) + Math.max(...xs)) / 2,
      (Math.min(...ys) + Math.max(...ys)) / 2,
      0
    ];
  }, [materias]);

  const construirGrafo = (idBase) => {
      const adelante = new Set();
      const atras = new Set();

      // 🔜 HACIA ADELANTE
      const recorrerAdelante = (id) => {
        if (adelante.has(id)) return;
        adelante.add(id);

        materias.forEach(m => {
          const deps = [...(m.prereq || []), ...(m.correq || [])];
          if (deps.includes(id)) recorrerAdelante(m.id);
        });
      };

      // 🔙 HACIA ATRÁS
      const recorrerAtras = (id) => {
        if (atras.has(id)) return;
        atras.add(id);

        const actual = mapaMaterias.get(id);
        if (actual) {
          [...(actual.prereq || []), ...(actual.correq || [])]
            .forEach(recorrerAtras);
        }
      };

      if (modo !== "atras") recorrerAdelante(idBase);
      if (modo !== "adelante") recorrerAtras(idBase);

      return { adelante, atras };
    };

  const materiasFiltradas = useMemo(() => {
    if (areasActivas.size === 0) return materias;
    return materias.filter(m => areasActivas.has(m.area));
  }, [materias, areasActivas]);

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

      // 🔥 PEGA AQUÍ ↓↓↓
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


      console.log("materias", materias);
  return (

    <div style={{
      width: seleccionada ? 'calc(100vw - 320px)' : '100vw',
      height: '100vh',
      background: COLORES.fondo,
      transition: 'width 0.3s ease'
    }}>

      {/* UI SUPERIOR */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '60px',
        background: '#111827',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 20,
        fontFamily: 'sans-serif'
      }}>

        {/* LOGO / NOMBRE */}
        <div style={{ fontWeight: 'bold' }}>
          🎓 Malla Interactiva SyH
        </div>

        {/* SELECTOR PROGRAMA */}
        <select
          value={programaActivo}
          onChange={(e) => setProgramaActivo(e.target.value)}
          style={{
            padding: '6px',
            borderRadius: '6px'
          }}
        >
          {Object.entries(PROGRAMAS).map(([key, p]) => (
            <option key={key} value={key}>{p.nombre}</option>
          ))}
        </select>

        {/* MODOS */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setModo("adelante")}>Futuro</button>
          <button onClick={() => setModo("atras")}>Prerreq</button>
          <button onClick={() => setModo("ambos")}>Ambos</button>
        </div>

      </div>

      {/**/}
      {seleccionada && (
        <div style={{
          position: 'fixed',
          right: 0,
          top: 0,
          width: '320px',
          height: '100vh',
          background: 'white',
          boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
          padding: '20px',
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'sans-serif',
          transform: seleccionada ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease'
        }}>

      {/* BOTÓN CERRAR */}
      <button
      onClick={() => {
              setSeleccionada(null);
              setNodosAdelante(new Set());
              setNodosAtras(new Set());
            }}
            style={{
              alignSelf: 'flex-end',
              border: 'none',
              background: 'transparent',
              fontSize: '18px',
              cursor: 'pointer'
            }}
          >
            ✖
          </button>

          {/* TÍTULO */}
          <h2 style={{ marginTop: 0 }}>
            {seleccionada.nombre}
          </h2>

          {/* INFO */}
          <p style={{ color: '#475569' }}>
            {seleccionada.desc || "Sin descripción disponible"}
          </p>

          <hr />

          {/* CRÉDITOS */}
          <p><b>Créditos:</b> {seleccionada.cred}</p>

          {/* SEMESTRE */}
          <p><b>Semestre:</b> {seleccionada.sem}</p>

          {/* ÁREA */}
          <p>
            <b>Área:</b>{" "}
            <span style={{
              color: COLORES_AREA[seleccionada.area] || COLORES_AREA.default
            }}>
              {seleccionada.area || "N/A"}
            </span>
          </p>

          <div style={{ marginTop: '10px' }}>
              <b>Prerrequisitos:</b>

              {(seleccionada.prereq || []).length === 0 && (
                <p style={{ fontSize: '12px', color: '#64748b' }}>
                  Ninguno
                </p>
              )}

              {(seleccionada.prereq || []).map(id => {
                const mat = mapaMaterias.get(id);
                return (
                  <div key={id} style={{
                    fontSize: '12px',
                    padding: '4px 6px',
                    background: '#f1f5f9',
                    borderRadius: '6px',
                    marginTop: '4px'
                  }}>
                    {mat?.nombre || id}
                  </div>
                );
              })}
            </div>

        </div>
      )}



      {/* LEYENDA */}
      {/*<div style={{
        position: 'fixed',
        right: '20px',
        top: '80px',
        background: 'white',
        padding: '12px',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        zIndex: 20, // 🔥 CLAVE
        fontFamily: 'sans-serif'
      }}>
        <b>Convenciones</b>

        <div style={{ color: COLORES.seleccion }}>■ Seleccionada</div>
        <div style={{ color: COLORES.adelante }}>■ Dependencias futuras</div>
        <div style={{ color: COLORES.atras }}>■ Prerrequisitos</div>

        <hr />

        <b>Áreas</b>
        {Object.entries(COLORES_AREA).map(([k, c]) =>
          k !== "default" && (
            <div key={k} style={{ color: c }}>■ {k}</div>
          )
        )}
      </div>*/}

     <Canvas>

      <OrthographicCamera
        makeDefault
        position={[centro[0], centro[1], 100]}
        zoom={zoomInicial}
      />

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
  );
}











