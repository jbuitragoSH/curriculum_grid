import React, { useState, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Line, Html, Grid } from '@react-three/drei'
import * as THREE from 'three'

const COLORES = {
  primario: "#2563eb",
  semPares: "#1d4ed8",
  secundario: "#d97706",
  resaltado: "#dc2626",
  hover: "#16a34a",
  fondo: "#f8fafc",
  lineas: "#cbd5e1",
  texto: "#ffffff",
  grid: "#cbd5e1"
};
const COLORES_AREA = {
  programacion: "#2563eb",   // azul
  sistemas: "#059669",       // verde
  matematicas: "#7c3aed",    // morado
  humanidades: "#d97706",    // naranja
  gestion: "#dc2626",        // rojo
  default: "#64748b"         // gris fallback
};
// --- NODO ---
function Nodo({ materia, isHovered, isRuta, isSeleccionada, onHover, onClick }) {
  const groupRef = useRef();
  const posX = (Number(materia.sem) || 1) * 5;
  const posY = (Number(materia.fila) || 1) * -3;

  const nombreTxt = (materia.nombre || "MATERIA").toUpperCase();
  const fontSize = nombreTxt.length > 20 ? 0.40 : 0.45;

  const colorBase = COLORES_AREA[materia.area] || COLORES_AREA.default;

  const color = isSeleccionada || isRuta
    ? COLORES.resaltado
    : isHovered
      ? COLORES.hover
      : colorBase;

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      groupRef.current.position.y =
        posY + Math.sin(t + (Number(materia.sem) || 0)) * 0.05;
    }
  });

  const opacidad = isHovered || isSeleccionada ? 1 : 0.9;
  //const opacidad = nodosActivos.size > 0
  //  ? (nodosActivos.has(materia.id) ? 1 : 0.15)
  //  : 1;
  return (
    <group ref={groupRef} position={[posX, posY, 0.01]}>
      <mesh
        onPointerOver={() => onHover(materia.id)}
        onPointerOut={() => onHover(null)}
        onClick={() => onClick(materia)}
      >
        <planeGeometry args={[3.6, 1.9]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacidad}
        />
      </mesh>

      <Text
        position={[0, 0, 0.1]}
        fontSize={fontSize}
        color="white"
        maxWidth={3.0}
        lineHeight={1.1}
        textAlign="center"
        anchorY="middle"
      >
        {nombreTxt}
      </Text>

      {isSeleccionada && (
        <Html distanceFactor={15} position={[1.8, 0.9, 0]}>
          <div style={{ position: 'relative', pointerEvents: 'none' }}>
            <div style={{
              position: 'absolute',
              width: '40px',
              height: '3px',
              background: COLORES.resaltado,
              transform: 'rotate(-45deg)',
              transformOrigin: 'left center'
            }} />
            <div style={{
              position: 'absolute',
              left: '30px',
              top: '-50px',
              width: '220px',
              background: 'white',
              padding: '12px',
              borderRadius: '10px',
              border: `3px solid ${COLORES.resaltado}`,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              pointerEvents: 'auto',
              fontFamily: 'sans-serif'
            }}>
              <b style={{
                color: COLORES.resaltado,
                fontSize: '13px',
                display: 'block',
                marginBottom: '4px'
              }}>
                {materia.nombre}
              </b>
              <p style={{
                margin: 0,
                fontSize: '12px',
                color: '#334155'
              }}>
                {materia.desc || "Sin descripción disponible."}
              </p>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
  Área: {materia.area}
</p>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// --- CONEXIÓN ---
function Conexion({ inicio, fin, resaltar, tipo }) {
  const points = useMemo(() => {
    const sX = (Number(inicio.sem) || 0) * 5 + 1.8;
    const sY = (Number(inicio.fila) || 0) * -3;
    const eX = (Number(fin.sem) || 0) * 5 - 1.8;
    const eY = (Number(fin.fila) || 0) * -3;

    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(sX, sY, 0),
      new THREE.Vector3(sX + 1.5, sY, 0),
      new THREE.Vector3(eX - 1.5, eY, 0),
      new THREE.Vector3(eX, eY, 0)
    );

    return curve.getPoints(20);
  }, [inicio.sem, inicio.fila, fin.sem, fin.fila]);

  return (
    <Line
      points={points}
      color={
        resaltar
          ? COLORES.resaltado
          : tipo === 'correq'
          ? COLORES.secundario
          : COLORES.lineas
      }
      lineWidth={resaltar ? 3 : 1.2}
      dashed={tipo === 'correq'}
      dashSize={0.2}
      gapSize={0.1}
    />
  );
}

export default function App() {
  const [materias, setMaterias] = useState([]);
  const [hoveredId, setHoveredId] = useState(null);
  const [seleccionada, setSeleccionada] = useState(null);
  const [rutaCritica, setRutaCritica] = useState(new Set());
  const [key, setKey] = useState(0);
  const [nodosActivos, setNodosActivos] = useState(new Set());
  const construirDependencias = (idBase) => {
    const relacionados = new Set();

    const recorrer = (id) => {
          if (relacionados.has(id)) return;
          relacionados.add(id);

          // buscar materias que dependen de esta
          materias.forEach(m => {
            const deps = [...(m.prereq || []), ...(m.correq || [])];
            if (deps.includes(id)) {
              recorrer(m.id);
            }
          });

          // buscar prerequisitos hacia atrás
          const actual = mapaMaterias.get(id);
          if (actual) {
            [...(actual.prereq || []), ...(actual.correq || [])].forEach(recorrer);
          }
        };

        recorrer(idBase);
        return relacionados;
    };

  const mapaMaterias = useMemo(() => {
    const map = new Map();
    materias.forEach(m => map.set(m.id, m));
    return map;
  }, [materias]);
  // 🔴 MAPA O(1)
  const materiasMap = useMemo(() => {
    const map = new Map();
    materias.forEach(m => map.set(m.id, m));
    return map;
  }, [materias]);

  // 🔴 DEPENDENCIAS OPTIMIZADAS
  const dependencias = useMemo(() => {
    const dep = new Map();
    materias.forEach(m => {
      (m.prereq || []).forEach(p => {
        if (!dep.has(p)) dep.set(p, []);
        dep.get(p).push(m.id);
      });
      (m.correq || []).forEach(c => {
        if (!dep.has(c)) dep.set(c, []);
        dep.get(c).push(m.id);
      });
    });
    return dep;
  }, [materias]);

  // 🧠 CENTRO DINÁMICO
  const centro = useMemo(() => {
    if (!materias.length) return [10, -5, 0];
    const sX = materias.map(m => (m.sem || 0) * 5);
    const sY = materias.map(m => (m.fila || 0) * -3);
    return [
      (Math.min(...sX) + Math.max(...sX)) / 2,
      (Math.min(...sY) + Math.max(...sY)) / 2,
      0
    ];
  }, [materias]);

  // ⚡ CONEXIONES MEMO
  const conexiones = useMemo(() => {
    const lines = [];

    materias.forEach(m => {
      (m.prereq || []).forEach(pId => {
        const ori = materiasMap.get(pId);
        if (ori) {
          lines.push(
            <Conexion
              key={`p-${pId}-${m.id}`}
              inicio={ori}
              fin={m}
              resaltar={
                hoveredId === m.id ||
                hoveredId === ori.id ||
                (rutaCritica.has(m.id) && rutaCritica.has(ori.id))
              }
              tipo="pre"
            />
          );
        }
      });

      (m.correq || []).forEach(cId => {
        const ori = materiasMap.get(cId);
        if (ori && m.id < cId) {
          lines.push(
            <Conexion
              key={`c-${cId}-${m.id}`}
              inicio={ori}
              fin={m}
              resaltar={
                hoveredId === m.id ||
                hoveredId === ori.id ||
                (rutaCritica.has(m.id) && rutaCritica.has(ori.id))
              }
              tipo="correq"
            />
          );
        }
      });
    });

    return lines;
  }, [materias, materiasMap, hoveredId, rutaCritica]);

  // 📂 CARGA DE JSON CON VALIDACIÓN
  const handleFile = (e) => {
    const reader = new FileReader();

    reader.onload = (f) => {
      try {
        const data = JSON.parse(f.target.result);

        if (!Array.isArray(data)) throw new Error();

        setMaterias(data);
        setKey(k => k + 1);
        setSeleccionada(null);
        setRutaCritica(new Set());

      } catch (err) {
        console.error(err);
        alert("JSON inválido. Verifica estructura: id, sem, fila...");
      }
    };

    if (e.target.files?.[0]) {
      reader.readAsText(e.target.files[0]);
    }
  };

  const Leyenda = () => (
    <div style={{
      position: 'absolute',
      top: 70,
      right: 20,
      background: 'white',
      padding: '12px',
      borderRadius: '10px'
    }}>
      <b>Áreas</b>
      {Object.entries(COLORES_AREA).map(([key, color]) => (
        key !== "default" && (
          <div key={key} style={{ display: 'flex', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', background: color }} />
            {key}
          </div>
        )
      ))}
    </div>
  );

  return (
    <div style={{ width: '100vw', height: '100vh', background: COLORES.fondo }}>

      {/* HEADER */}
      <div style={{
        position: 'absolute',
        top: 0,
        zIndex: 10,
        background: 'white',
        width: '100%',
        padding: '15px 25px',
        display: 'flex',
        gap: '20px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <b style={{ color: COLORES.primario }}>
          MALLA ING. DE SISTEMAS
        </b>
        <input type="file" accept=".json" onChange={handleFile} />
      </div>

      <Leyenda />
      {/* CANVAS */}
      <Canvas key={key} camera={{ position: [centro[0], centro[1], 35], fov: 45 }}>
        <OrbitControls enableRotate={false} target={[centro[0], centro[1], 0]} makeDefault />

        {/* GRID VISUAL */}
        <Grid
          position={[centro[0], centro[1], -1]}
          args={[100, 100]}
          cellSize={1}
          cellThickness={0.5}
          cellColor={COLORES.grid}
          sectionSize={5}
          sectionThickness={1}
          sectionColor={COLORES.lineas}
        />

        {/* CONEXIONES */}
        {conexiones}

        {/* NODOS */}
        {materias.map(m => (
          <Nodo
            key={m.id}
            materia={m}
            isHovered={hoveredId === m.id}
            isRuta={rutaCritica.has(m.id)}
            isSeleccionada={seleccionada?.id === m.id}
            onHover={(id) => {
              setHoveredId(id);
              if (id) setNodosActivos(construirDependencias(id));
              else setNodosActivos(new Set());
            }}
            onClick={(mat) => {
              if (!mat || seleccionada?.id === mat.id) {
                setSeleccionada(null);
                setRutaCritica(new Set());
                setNodosActivos(new Set());
                return;
              }

              setSeleccionada(mat);

              const deps = construirDependencias(mat.id);
              setRutaCritica(deps);
              setNodosActivos(deps);
            }}
          />
        ))}

      </Canvas>
    </div>
  );
}















