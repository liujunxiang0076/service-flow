"use client"

import { Card } from "@/components/ui/card"
import type React from "react"
import type { ServiceGroup } from "@/types/service"
import { useEffect, useRef, useState } from "react"

interface DependencyGraphProps {
  groups: ServiceGroup[]
}

interface Node {
  id: string
  name: string
  x: number
  y: number
  serviceCount: number
  status: "running" | "stopped" | "mixed"
}

interface Edge {
  from: string
  to: string
}

export function DependencyGraph({ groups }: DependencyGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  const getGroupStatus = (group: ServiceGroup): "running" | "stopped" | "mixed" => {
    const runningCount = group.services.filter((s) => s.status === "running").length
    if (runningCount === 0) return "stopped"
    if (runningCount === group.services.length) return "running"
    return "mixed"
  }

  useEffect(() => {
    const newNodes: Node[] = []
    const newEdges: Edge[] = []

    groups.forEach((group, index) => {
      // Position nodes in a circle
      const angle = (index / groups.length) * 2 * Math.PI
      const radius = 200
      const centerX = 400
      const centerY = 300

      newNodes.push({
        id: group.id,
        name: group.name,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        serviceCount: group.services.length,
        status: getGroupStatus(group),
      })

      // Create edges for dependencies
      group.dependencies.forEach((depId) => {
        newEdges.push({
          from: depId,
          to: group.id,
        })
      })
    })

    setNodes(newNodes)
    setEdges(newEdges)
  }, [groups])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw edges
    ctx.strokeStyle = "rgba(120, 120, 140, 0.3)"
    ctx.lineWidth = 2

    edges.forEach((edge) => {
      const fromNode = nodes.find((n) => n.id === edge.from)
      const toNode = nodes.find((n) => n.id === edge.to)

      if (fromNode && toNode) {
        ctx.beginPath()
        ctx.moveTo(fromNode.x, fromNode.y)
        ctx.lineTo(toNode.x, toNode.y)
        ctx.stroke()

        // Draw arrow
        const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x)
        const arrowLength = 15
        const arrowAngle = Math.PI / 6

        ctx.beginPath()
        ctx.moveTo(toNode.x, toNode.y)
        ctx.lineTo(
          toNode.x - arrowLength * Math.cos(angle - arrowAngle),
          toNode.y - arrowLength * Math.sin(angle - arrowAngle),
        )
        ctx.moveTo(toNode.x, toNode.y)
        ctx.lineTo(
          toNode.x - arrowLength * Math.cos(angle + arrowAngle),
          toNode.y - arrowLength * Math.sin(angle + arrowAngle),
        )
        ctx.stroke()
      }
    })

    // Draw nodes
    nodes.forEach((node) => {
      const isSelected = selectedNode === node.id
      const nodeRadius = isSelected ? 35 : 30

      // Node circle
      ctx.beginPath()
      ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI)

      if (node.status === "running") {
        ctx.fillStyle = "rgba(88, 208, 135, 0.2)"
        ctx.strokeStyle = "rgb(88, 208, 135)"
      } else if (node.status === "mixed") {
        ctx.fillStyle = "rgba(251, 191, 36, 0.2)"
        ctx.strokeStyle = "rgb(251, 191, 36)"
      } else {
        ctx.fillStyle = "rgba(120, 120, 140, 0.2)"
        ctx.strokeStyle = "rgb(120, 120, 140)"
      }

      ctx.lineWidth = isSelected ? 3 : 2
      ctx.fill()
      ctx.stroke()

      // Node label
      ctx.fillStyle = "rgb(250, 250, 250)"
      ctx.font = "12px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(node.name, node.x, node.y)
    })
  }, [nodes, edges, selectedNode])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if clicked on a node
    const clickedNode = nodes.find((node) => {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2)
      return distance <= 30
    })

    setSelectedNode(clickedNode?.id || null)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card/50 p-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="mx-auto cursor-pointer"
          onClick={handleCanvasClick}
        />
      </div>

      {selectedNode && (
        <Card className="p-4">
          <h3 className="mb-2 font-semibold text-foreground">{nodes.find((n) => n.id === selectedNode)?.name}</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">包含服务数：</span>
              <span className="font-medium">{nodes.find((n) => n.id === selectedNode)?.serviceCount}</span>
            </div>
            <div>
              <span className="text-muted-foreground">依赖于：</span>
              {edges
                .filter((e) => e.to === selectedNode)
                .map((e) => nodes.find((n) => n.id === e.from)?.name)
                .join(", ") || "无"}
            </div>
            <div>
              <span className="text-muted-foreground">被依赖于：</span>
              {edges
                .filter((e) => e.from === selectedNode)
                .map((e) => nodes.find((n) => n.id === e.to)?.name)
                .join(", ") || "无"}
            </div>
          </div>
        </Card>
      )}

      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-success" />
          <span className="text-muted-foreground">全部运行</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-warning" />
          <span className="text-muted-foreground">部分运行</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-muted-foreground" />
          <span className="text-muted-foreground">全部停止</span>
        </div>
      </div>
    </div>
  )
}
