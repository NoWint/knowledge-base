"use client"

import { useRef, useMemo, useState, useEffect, Suspense, useCallback } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Points, PointMaterial, OrbitControls, Text } from "@react-three/drei"
import * as THREE from "three"
import { useRouter } from "next/navigation"
import { getAllSubjects, getSubjectChapters } from "@/lib/data-access/subject-data"

interface KpNode {
  id: string
  name: string
  x: number
  y: number
  z: number
  subject: string
  subjectName: string
  difficulty: number
  position: THREE.Vector3
  radius: number
}

const subjectColors: Record<string, string> = {
  yuwen: "#ef4444",
  math: "#3b82f6",
  english: "#22c55e",
  physics: "#f59e0b",
  chemistry: "#a855f7",
  biology: "#14b8a6",
  history: "#f97316",
  geography: "#06b6d4",
  daofa: "#6366f1",
  tiyu: "#84cc16",
}

const difficultyColors = ["#f59e0b", "#f97316", "#ef4444"]

function BackgroundParticles({ count = 3000 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null)

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 8 + Math.random() * 12

      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      arr[i * 3 + 2] = r * Math.cos(phi)
    }
    return arr
  }, [count])

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.01
    }
  })

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#6366f1"
        size={0.03}
        sizeAttenuation
        depthWrite={false}
        opacity={0.4}
      />
    </Points>
  )
}

function KnowledgeNode({
  node,
  isHovered,
  onHover,
  onUnhover,
  onClick,
}: {
  node: KpNode
  isHovered: boolean
  onHover: () => void
  onUnhover: () => void
  onClick: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const baseSize = 0.06 + node.difficulty * 0.02
  const color = subjectColors[node.subject] || "#ffffff"

  useFrame(() => {
    if (meshRef.current) {
      const targetScale = isHovered ? 1.5 : 1
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
    }
  })

  return (
    <group position={[node.x, node.y, node.z]}>
      <mesh
        ref={meshRef}
        onPointerEnter={(e) => { e.stopPropagation(); onHover() }}
        onPointerLeave={() => onUnhover()}
        onClick={(e) => { e.stopPropagation(); onClick() }}
      >
        <sphereGeometry args={[baseSize, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHovered ? 0.8 : 0.3}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {isHovered && (
        <group position={[0, baseSize + 0.3, 0]}>
          <Text
            fontSize={0.15}
            color="#ffffff"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {node.name}
          </Text>
          <Text
            fontSize={0.1}
            color="#94a3b8"
            anchorX="center"
            anchorY="top"
          >
            {node.subjectName}
          </Text>
        </group>
      )}
    </group>
  )
}

function KnowledgeConstellation({
  nodes,
  hoveredId,
  onHoverNode,
  onUnhoverNode,
  onClickNode,
}: {
  nodes: KpNode[]
  hoveredId: string | null
  onHoverNode: (id: string) => void
  onUnhoverNode: () => void
  onClickNode: (id: string) => void
}) {
  const groupRef = useRef<THREE.Group>(null)

  const visibleNodes = useMemo(() => {
    if (nodes.length > 200) {
      return nodes.filter((_, i) => i % Math.ceil(nodes.length / 200) === 0)
    }
    return nodes
  }, [nodes])

  const lines = useMemo(() => {
    const result: { start: THREE.Vector3; end: THREE.Vector3; color: string }[] = []
    const maxLines = 150

    for (let i = 0; i < Math.min(visibleNodes.length, 50); i++) {
      for (let j = i + 1; j < Math.min(visibleNodes.length, 50); j++) {
        if (result.length >= maxLines) break
        const dist = visibleNodes[i].position.distanceTo(visibleNodes[j].position)
        if (dist < 2.5) {
          result.push({
            start: visibleNodes[i].position.clone(),
            end: visibleNodes[j].position.clone(),
            color: subjectColors[visibleNodes[i].subject] || "#60a5fa",
          })
        }
      }
      if (result.length >= maxLines) break
    }

    return result
  }, [visibleNodes])

  const lineObjects = useMemo(() => {
    return lines.map((line) => {
      const geometry = new THREE.BufferGeometry().setFromPoints([line.start, line.end])
      const material = new THREE.LineBasicMaterial({ color: line.color, transparent: true, opacity: 0.15 })
      const lineObj = new THREE.Line(geometry, material)
      return lineObj
    })
  }, [lines])

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.03
    }
  })

  return (
    <group ref={groupRef}>
      {lineObjects.map((lineObj, i) => (
        <primitive key={i} object={lineObj} />
      ))}

      {visibleNodes.map((node) => (
        <KnowledgeNode
          key={node.id}
          node={node}
          isHovered={hoveredId === node.id}
          onHover={() => onHoverNode(node.id)}
          onUnhover={onUnhoverNode}
          onClick={() => onClickNode(node.id)}
        />
      ))}
    </group>
  )
}

function CameraController({ hovered }: { hovered: boolean }) {
  const { camera } = useThree()
  const angleRef = useRef(0)

  useFrame(() => {
    if (!hovered) {
      angleRef.current += 0.001
      camera.position.x = Math.sin(angleRef.current) * 10
      camera.position.z = Math.cos(angleRef.current) * 10
      camera.position.y = Math.sin(angleRef.current * 0.3) * 2 + 2
      camera.lookAt(0, 0, 0)
    }
  })

  return <OrbitControls enableZoom={true} enablePan={true} minDistance={3} maxDistance={25} />
}

function distributeNodesBySubject(nodes: KpNode[]): KpNode[] {
  const subjectGroups: Record<string, KpNode[]> = {}

  nodes.forEach((node) => {
    if (!subjectGroups[node.subject]) {
      subjectGroups[node.subject] = []
    }
    subjectGroups[node.subject].push(node)
  })

  const subjectAngles: Record<string, number> = {}
  const subjects = Object.keys(subjectGroups)
  subjects.forEach((subject, i) => {
    subjectAngles[subject] = (i / subjects.length) * Math.PI * 2
  })

  const result: KpNode[] = []

  subjects.forEach((subject) => {
    const groupNodes = subjectGroups[subject]
    const baseAngle = subjectAngles[subject]
    const radius = 2 + groupNodes.length * 0.08

    groupNodes.forEach((node, i) => {
      const phi = Math.acos(2 * (i + 1) / (groupNodes.length + 1) - 1)
      const theta = baseAngle + (i / groupNodes.length) * 0.8

      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta) * 0.5
      const z = radius * Math.cos(phi)

      result.push({
        ...node,
        x,
        y,
        z,
        position: new THREE.Vector3(x, y, z),
        radius,
      })
    })
  })

  return result
}

export function NebulaKnowledgeGraph() {
  const router = useRouter()
  const [nodes, setNodes] = useState<KpNode[]>([])
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [hovered, setHovered] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const subjects = await getAllSubjects()
        const kpNodes: KpNode[] = []

        for (const subject of subjects) {
          const chapters = await getSubjectChapters(subject.id)
          chapters.forEach((ch) => {
            kpNodes.push({
              id: ch.id,
              name: ch.name,
              x: 0,
              y: 0,
              z: 0,
              subject: subject.id,
              subjectName: subject.name,
              difficulty: 1 + Math.floor(Math.random() * 3),
              position: new THREE.Vector3(0, 0, 0),
              radius: 0,
            })
          })
        }

        const distributedNodes = distributeNodesBySubject(kpNodes)
        setNodes(distributedNodes)
      } catch (err) {
        console.error("Failed to load knowledge graph data:", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleClickNode = useCallback(
    (id: string) => {
      router.push(`/knowledge/resources?kp=${id}`)
    },
    [router]
  )

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

  const subjects = [...new Set(nodes.map((n) => n.subject))]

  return (
    <div
      className="w-full h-full relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Canvas
        camera={{ position: [0, 3, 10], fov: 60 }}
        style={{ background: "linear-gradient(180deg, #030712 0%, #0f172a 50%, #030712 100%)" }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#6366f1" />
          <pointLight position={[0, 10, 0]} intensity={0.3} color="#f59e0b" />

          <BackgroundParticles count={2000} />
          <KnowledgeConstellation
            nodes={nodes}
            hoveredId={hoveredId}
            onHoverNode={setHoveredId}
            onUnhoverNode={() => setHoveredId(null)}
            onClickNode={handleClickNode}
          />

          <CameraController hovered={hovered} />
        </Suspense>
      </Canvas>

      <div className="absolute bottom-4 left-4 text-xs text-white/40 space-y-1">
        <p>🖱️ 拖拽旋转 · 滚轮缩放 · 点击节点查看详情</p>
        <p>📊 按学科分组的知识节点</p>
      </div>

      <div className="absolute top-4 right-4 space-y-3">
        <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">学科</div>
        {subjects.slice(0, 6).map((subject) => (
          <div key={subject} className="flex items-center gap-1.5 text-xs text-white/50">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: subjectColors[subject] || "#ffffff" }}
            />
            <span>{nodes.find((n) => n.subject === subject)?.subjectName || subject}</span>
          </div>
        ))}
        {subjects.length > 6 && (
          <div className="text-xs text-white/30">+{subjects.length - 6} 更多</div>
        )}
      </div>

      <div className="absolute bottom-4 right-4 text-xs text-white/30">
        {nodes.length} 个知识点 · {subjects.length} 个学科
      </div>
    </div>
  )
}
