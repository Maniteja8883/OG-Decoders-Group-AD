
"use client";

import React, { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Node,
  Edge,
} from 'reactflow';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Expand, Shrink } from "lucide-react";
import { toPng } from 'html-to-image';
import dagre from 'dagre';

import 'reactflow/dist/style.css';
import './MindMap.css';
import { useToast } from '@/hooks/use-toast';

type MindMapNodeData = {
  id: string;
  label: string;
  description?: string;
  type?: string;
  children?: MindMapNodeData[];
};

type CareerNodeData = {
  label: string;
  description?: string;
  color: string;
  isExpanded: boolean;
  onToggleExpand: (nodeId: string) => void;
  hasChildren: boolean;
};

const nodeColors: { [key: string]: string } = {
    mainCareer: '#4F46E5', // Indigo
    subDomain: '#10B981', // Green
    skills: '#F59E0B', // Amber
    resources: '#EC4899', // Pink
    default: '#6366F1', // Violet
};

const CustomNode = ({ id, data }: Node<CareerNodeData>) => {
  return (
    <div className="career-node">
      <div className="node-header" style={{ backgroundColor: data.color }}>
        <strong>{data.label}</strong>
      </div>
      {data.description && (
        <div className="node-body">
          <p>{data.description}</p>
        </div>
      )}
      {data.hasChildren && (
        <button className="expand-btn" onClick={() => data.onToggleExpand(id)}>
          {data.isExpanded ? '-' : '+'}
        </button>
      )}
    </div>
  );
};

const nodeTypes = {
  careerNode: CustomNode,
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 250, height: 120 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? 'left' : 'top';
    node.sourcePosition = isHorizontal ? 'right' : 'bottom';
    node.position = {
      x: nodeWithPosition.x - 125,
      y: nodeWithPosition.y - 60,
    };
  });

  return { nodes, edges };
};


export default function CareerMindMap({ mindMapData }: { mindMapData: MindMapNodeData }) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([mindMapData.id]));
  const { toast } = useToast();

  const onToggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
        const newSet = new Set(prev);
        if (newSet.has(nodeId)) {
            newSet.delete(nodeId);
        } else {
            newSet.add(nodeId);
        }
        return newSet;
    });
  }, []);

  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node<CareerNodeData>[] = [];
    const edges: Edge[] = [];

    function traverse(node: MindMapNodeData, parentId?: string) {
      if (!node) return;

      const isExpanded = expandedNodes.has(node.id);
      
      nodes.push({
        id: node.id,
        type: 'careerNode',
        position: { x: 0, y: 0 },
        data: {
          label: node.label,
          description: node.description,
          color: node.type ? nodeColors[node.type] || nodeColors.default : nodeColors.default,
          isExpanded: isExpanded,
          onToggleExpand: onToggleExpand,
          hasChildren: !!node.children && node.children.length > 0,
        },
      });

      if (parentId) {
        edges.push({
          id: `e-${parentId}-${node.id}`,
          source: parentId,
          target: node.id,
          type: 'smoothstep',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed },
        });
      }

      if (isExpanded && node.children) {
        node.children.forEach(child => traverse(child, node.id));
      }
    }

    traverse(mindMapData);

    return { initialNodes: nodes, initialEdges: edges };
  }, [mindMapData, expandedNodes, onToggleExpand]);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(initialNodes, initialEdges, 'TB'),
    [initialNodes, initialEdges]
  );

  const [nodes, , onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const handleExport = useCallback(() => {
    const flowElement = document.querySelector('.react-flow__viewport');
    if (flowElement) {
      toPng(flowElement as HTMLElement, { 
        backgroundColor: '#1a1423',
        width: flowElement.scrollWidth,
        height: flowElement.scrollHeight,
       })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = 'career-roadmap.png';
          link.href = dataUrl;
          link.click();
          toast({ title: "Success", description: "Mind map exported as PNG." });
        })
        .catch(err => {
          console.error(err);
          toast({ title: "Error", description: "Could not export mind map.", variant: "destructive" });
        });
    }
  }, [toast]);
  
  const toggleAll = (expand: boolean) => {
    const allNodeIds = new Set<string>();
    if (expand) {
      function collectIds(node: MindMapNodeData) {
        allNodeIds.add(node.id);
        if (node.children) {
          node.children.forEach(collectIds);
        }
      }
      collectIds(mindMapData);
    } else {
      allNodeIds.add(mindMapData.id);
    }
    setExpandedNodes(allNodeIds);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="font-headline text-xl">Your Interactive Career Roadmap</CardTitle>
            <CardDescription>Explore your personalized career paths. Click nodes to expand/collapse.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => toggleAll(true)}><Expand className="w-4 h-4 mr-2" />Expand All</Button>
            <Button variant="outline" size="sm" onClick={() => toggleAll(false)}><Shrink className="w-4 h-4 mr-2" />Collapse All</Button>
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="w-4 h-4 mr-2" />Export PNG</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: '600px' }} className="rounded-lg overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Controls />
            <MiniMap nodeColor="#4F46E5" />
            <Background variant="dots" gap={16} size={1} />
          </ReactFlow>
        </div>
      </CardContent>
    </Card>
  );
}
