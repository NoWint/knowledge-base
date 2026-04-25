"use client"

import { useRef, useMemo, useState, useEffect, Suspense } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Points, PointMaterial, OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import { useRouter } from "next/navigation"
import { db } from "@/lib/db/database"
import { getAllSubjects, getSubjectChapters } from "@/lib/data-access/subject-data"

interface KpNode {
  id: string
  name: string
  x: number
  y: number
  z: number
  subject: string
  difficulty: number
  position: THREE.Vector3
}

const difficultyColors = ["#f59e0b", "#f97316", "#ef4444"]

function generateSpherePointCloud(count: number, radius: number, irregularity: number = 0.3) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = radius * (1 + (Math.random() - 0.5) * irregularity)

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)

    const colorChoice = Math.floor(Math.random() * 3)
    const baseColor = new THREE.Color(difficultyColors[colorChoice])
    colors[i * 3] = baseColor.r * (0.6 + Math.random() * 0.4)
    colors[i * 3 + 1] = baseColor.g * (0.6 + Math.random() * 0.4)
    colors[i * 3 + 2] = baseColor.b * (0.6 + Math.random() * 0.4)
  }

  return { positions, colors }
}

function ClusterCloud({ count = 20000, nodes: kpNodes }: { count?: number; nodes: KpNode[] }) {
  const ref = useRef<THREE.Points>(null)

  const { positions, colors } = useMemo(() => {
    const result = generateSpherePointCloud(count, 3, 0.6)

    if (kpNodes.length > 0) {
      const kpCount = Math.min(kpNodes.length, 200)
      for (let i = 0; i < kpCount; i++) {
        const kp = kpNodes[i]
        const idx = count + i * 10
        if (idx < count * 3) {
          result.positions[idx * 3] = kp.x * 0.5
          result.positions[idx * 3 + 1] = kp.y * 0.5
          result.positions[idx * 3 + 2] = kp.z * 0.5

          const color = new THREE.Color(difficultyColors[Math.min(kp.difficulty - 1, 2)])
          result.colors[idx * 3] = color.r
          result.colors[idx * 3 + 1] = color.g
          result.colors[idx * 3 + 2] = color.b
        }
      }
    }

    return result
  }, [count, kpNodes])

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.05
      ref.current.rotation.x += delta * 0.02
    }
  })

  return (
    <Points ref={ref} positions={positions} colors={colors} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#ffffff"
        size={0.02}
        sizeAttenuation
        depthWrite={false}
        vertexColors
        opacity={0.95}
      />
    </Points>
  )
}

function KnowledgeConstellation({ nodes: kpNodes }: { nodes: KpNode[] }) {
  const ref = useRef<THREE.Group>(null)

  const visibleNodes = useMemo(() => {
    return kpNodes.slice(0, 80)
  }, [kpNodes])

  const lines = useMemo(() => {
    const result: { start: THREE.Vector3; end: THREE.Vector3; color: string }[] = []

    for (let i = 0; i < visibleNodes.length; i++) {
      for (let j = i + 1; j < visibleNodes.length; j++) {
        const dist = visibleNodes[i].position.distanceTo(visibleNodes[j].position)
        if (dist < 2.0) {
          result.push({
            start: visibleNodes[i].position.clone().multiplyScalar(0.5),
            end: visibleNodes[j].position.clone().multiplyScalar(0.5),
            color: "#60a5fa",
          })
        }
      }
    }

    return result.slice(0, 200)
  }, [visibleNodes])

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.08
    }
  })

  return (
    <group ref={ref}>
      {visibleNodes.map((node, i) => (
        <mesh key={node.id} position={[node.position.x * 0.5, node.position.y * 0.5, node.position.z * 0.5]}>
          <sphereGeometry args={[0.04 + node.difficulty * 0.01, 8, 8]} />
          <meshBasicMaterial color={difficultyColors[Math.min(node.difficulty - 1, 2)]} />
        </mesh>
      ))}

      {lines.map((line, i) => {
        const geometry = new THREE.BufferGeometry().setFromPoints([line.start, line.end])
        return (
          <primitive key={i} object={geometry}>
            <line>
              <bufferGeometry />
              <lineBasicMaterial color={line.color} transparent opacity={0.3} />
            </line>
          </primitive>
        )
      })}
    </group>
  )
}

function FloatingParticles({ count = 2000 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null)

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20
      arr[i * 3 + 1] = (Math.random() - 0.5) * 20
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20
    }
    return arr
  }, [count])

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y -= delta * 0.01
    }
  })

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#818cf8"
        size={0.02}
        sizeAttenuation
        depthWrite={false}
        opacity={0.5}
      />
    </Points>
  )
}

function CameraController({ hovered }: { hovered: boolean }) {
  const { camera } = useThree()
  const angleRef = useRef(0)

  useFrame(() => {
    if (!hovered) {
      angleRef.current += 0.002
      camera.position.x = Math.sin(angleRef.current) * 8
      camera.position.z = Math.cos(angleRef.current) * 8
      camera.position.y = Math.sin(angleRef.current * 0.5) * 3
      camera.lookAt(0, 0, 0)
    }
  })

  return <OrbitControls enableZoom={true} enablePan={false} minDistance={3} maxDistance={20} />
}

export function NebulaKnowledgeGraph() {
  const router = useRouter()
  const [nodes, setNodes] = useState<KpNode[]>([])
  const [hovered, setHovered] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const subjects = await getAllSubjects()
        const kpNodes: KpNode[] = []
        
        for (const subject of subjects) {
          const chapters = await getSubjectChapters(subject.id)
          chapters.forEach((ch, idx) => {
            const phi = Math.acos(-1 + (2 * kpNodes.length + 1) / 100)
            const theta = Math.sqrt(100 * Math.PI) * phi
            const radius = 3 + Math.random() * 2

            kpNodes.push({
              id: ch.id,
              name: ch.name,
              x: radius * Math.cos(theta) * Math.sin(phi),
              y: radius * Math.sin(theta) * Math.sin(phi),
              z: radius * Math.cos(phi),
              subject: subject.id,
              difficulty: 1 + (idx % 3),
              position: new THREE.Vector3(
                radius * Math.cos(theta) * Math.sin(phi),
                radius * Math.sin(theta) * Math.sin(phi),
                radius * Math.cos(phi)
              ),
            })
          })
        }

        setNodes(kpNodes)
      } catch (err) {
        console.error("Failed to load knowledge graph data:", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleClick = (id: string) => {
    router.push(`/knowledge/resources?kp=${id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ping" />
            <div className="absolute inset-0 rounded-full border-2 border-blue-500/50 animate-pulse" />
          </div>
          <p className="mt-4 text-sm text-gray-500">正在构建知识星座...</p>
        </div>
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">暂无知识数据</p>
          <p className="text-sm">请先导入知识点数据</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="w-full h-full relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        style={{ background: "linear-gradient(180deg, #030712 0%, #0f172a 50%, #030712 100%)" }}
        onPointerMissed={() => {}}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={0.8} color="#ffffff" />
          <pointLight position={[-10, -10, -10]} intensity={0.3} color="#6366f1" />

          <ClusterCloud count={4000} nodes={nodes} />
          <KnowledgeConstellation nodes={nodes} />
          <FloatingParticles count={300} />

          <CameraController hovered={hovered} />
        </Suspense>
      </Canvas>

      <div className="absolute bottom-4 left-4 text-xs text-white/40 space-y-1">
        <p>🖱️ 拖拽旋转 · 滚轮缩放</p>
        <p>💫 粒子星云 + 星座连线</p>
      </div>

      <div className="absolute top-4 right-4 space-y-2">
        <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">难度</div>
        {[
          { color: "bg-amber-400", label: "基础" },
          { color: "bg-orange-500", label: "进阶" },
          { color: "bg-red-500", label: "高阶" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs text-white/50">
            <div className={`w-2 h-2 rounded-full ${item.color}`} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="absolute bottom-4 right-4 text-xs text-white/30">
        {nodes.length} 个知识点
      </div>
    </div>
  )
}
