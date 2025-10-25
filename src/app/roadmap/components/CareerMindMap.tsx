
"use client";

import React, { useCallback, useMemo, useState, useEffect } from 'react';
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

// AI-generated data structure
type MindMapData = {
  id: string;
  label: string;
  description?: string;
  type?: string;
  children?: MindMapData[];
};

type CustomNodeData = {
  label: string;
  description?: string;
  color: string;
  hasChildren: boolean;
};

const nodeColors: { [key: string]: string } = {
    mainCareer: '#4F46E5', // Indigo
    subDomain: '#10B981', // Green
    skills: '#F59E0B', // Amber
    resources: '#EC4899', // Pink
    default: '#6366F1', // Violet
};

const CustomNode = ({ data }: Node<CustomNodeData>) => {
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
    </div>
  );
};

const nodeTypes = {
  careerNode: CustomNode,
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));
const nodeWidth = 250;
const nodeHeight = 120;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction, nodesep: 60, ranksep: 80 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    if (nodeWithPosition) {
        node.targetPosition = isHorizontal ? 'left' : 'top';
        node.sourcePosition = isHorizontal ? 'right' : 'bottom';
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };
    }
  });

  return { nodes, edges };
};

const transformData = (data: MindMapData): { initialNodes: Node<CustomNodeData>[], initialEdges: Edge[] } => {
    const initialNodes: Node<CustomNodeData>[] = [];
    const initialEdges: Edge[] = [];
    const allNodeIds = new Set<string>();

    function traverse(node: MindMapData, parentId?: string) {
        if (!node || allNodeIds.has(node.id)) return;
        allNodeIds.add(node.id);

        initialNodes.push({
            id: node.id,
            type: 'careerNode',
            position: { x: 0, y: 0 },
            data: {
              label: node.label,
              description: node.description,
              color: node.type ? nodeColors[node.type] || nodeColors.default : nodeColors.default,
              hasChildren: !!node.children && node.children.length > 0,
            },
        });

        if (parentId) {
            initialEdges.push({
                id: `e-${parentId}-${node.id}`,
                source: parentId,
                target: node.id,
                type: 'smoothstep',
                animated: true,
                markerEnd: { type: MarkerType.ArrowClosed },
            });
        }

        if (node.children) {
            node.children.forEach(child => traverse(child, node.id));
        }
    }

    traverse(data);
    return { initialNodes, initialEdges };
};


export default function CareerMindMap({ mindMapData }: { mindMapData: MindMapData }) {
    const { toast } = useToast();

    const { initialNodes, initialEdges } = useMemo(() => transformData(mindMapData), [mindMapData]);
    
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(() => new Set(initialNodes.map(n => n.id)));

    useEffect(() => {
        const visibleNodes = initialNodes.filter(node => {
            const edge = initialEdges.find(e => e.target === node.id);
            if (!edge) return true; // Root node
            return expandedNodeIds.has(edge.source);
        });

        const visibleNodeIds = new Set(visibleNodes.map(n => n.id));

        const visibleEdges = initialEdges.filter(edge =>
            visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
        );

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(visibleNodes, visibleEdges);
        
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);

    }, [expandedNodeIds, initialNodes, initialEdges, setNodes, setEdges]);
    
    
    const onNodeClick = useCallback((_: any, node: Node) => {
        setExpandedNodeIds(currentIds => {
            const newIds = new Set(currentIds);
            const children = initialEdges.filter(e => e.source === node.id).map(e => e.target);

            const isExpanded = children.every(childId => newIds.has(childId));

            if (isExpanded) {
                const nodesToCollapse = (nodeId: string): string[] => {
                    const directChildren = initialEdges.filter(e => e.source === nodeId).map(e => e.target);
                    let allChildren: string[] = [...directChildren];
                    directChildren.forEach(childId => {
                        allChildren = [...allChildren, ...nodesToCollapse(childId)];
                    });
                    return allChildren;
                }
                nodesToCollapse(node.id).forEach(id => newIds.delete(id));
            } else {
                children.forEach(childId => newIds.add(childId));
            }
            return newIds;
        });
    }, [initialEdges]);


    const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    const handleExport = useCallback(() => {
        const flowElement = document.querySelector('.react-flow__viewport');
        if (flowElement) {
          toPng(flowElement as HTMLElement, { 
            backgroundColor: 'hsl(var(--background))',
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
        if (expand) {
            setExpandedNodeIds(new Set(initialNodes.map(n => n.id)));
        } else {
            setExpandedNodeIds(new Set([mindMapData.id]));
        }
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
            <div style={{ width: '100%', height: '600px' }} className="rounded-lg overflow-hidden bg-background">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-left"
                minZoom={0.1}
                maxZoom={4}
            >
                <Controls />
                <MiniMap nodeColor={(n) => n.data.color} zoomable pannable />
                <Background variant="dots" gap={16} size={1} />
            </ReactFlow>
            </div>
        </CardContent>
        </Card>
    );
}
