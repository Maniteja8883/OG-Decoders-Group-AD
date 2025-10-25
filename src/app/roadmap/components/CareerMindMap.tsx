
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
import { GenerateCareerRoadmapOutput } from '@/ai/flows/generate-career-roadmap';
import Link from 'next/link';


type MindMapData = GenerateCareerRoadmapOutput['mindMap'];

type CustomNodeData = {
    label: string;
    description?: string;
    color: string;
    hasChildren: boolean;
    onToggle: (id: string) => void;
    isExpanded: boolean;
    category: string;
    url?: string;
};

const nodeColors: { [key: string]: string } = {
    root: '#673AB7', // primary
    foundation: '#10B981', // Green
    skills: '#F59E0B', // Orange
    specialization: '#EC4899', // Pink
    traditional: '#3B82F6', // Blue
    ai_first: '#8B5CF6', // Purple
    timeline: '#6366F1', // Violet
    default: '#6B7280', // Gray
};

const CustomNode = ({ data, id }: Node<CustomNodeData>) => {
    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        data.onToggle(id);
    };

    const content = (
        <div className={`career-node ${data.category}`}>
            <div className="node-header" style={{ backgroundColor: data.color }}>
                <strong>{data.label}</strong>
            </div>
            {data.description && (
                <div className="node-body">
                    <p>{data.description}</p>
                </div>
            )}
            {data.hasChildren && (
                <button className="expand-btn" onClick={handleToggle}>
                    {data.isExpanded ? '−' : '+'}
                </button>
            )}
        </div>
    );
    
    if (data.url) {
      return (
        <Link href={data.url} target="_blank" rel="noopener noreferrer" className="node-link">
          {content}
        </Link>
      );
    }

    return content;
};

const nodeTypes = {
  careerNode: CustomNode,
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));
const nodeWidth = 280;
const nodeHeight = 150;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction, nodesep: 150, ranksep: 200, marginx: 100, marginy: 100, edgesep: 100 });

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

const transformData = (data: MindMapData): { initialNodes: Node[], initialEdges: Edge[] } => {
    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];
    let nodeIdCounter = 0;

    const rootId = `node-${nodeIdCounter++}`;
    initialNodes.push({
        id: rootId,
        type: 'careerNode',
        position: { x: 0, y: 0 },
        data: {
            label: data.title,
            description: data.description,
            color: nodeColors.root,
            hasChildren: !!data.stages && data.stages.length > 0,
            isExpanded: true,
            category: 'root',
        },
    });

    data.stages?.forEach(stage => {
        const stageId = `node-${nodeIdCounter++}`;
        const stageColor = nodeColors[stage.type] || nodeColors.default;
        
        initialNodes.push({
            id: stageId,
            type: 'careerNode',
            position: { x: 0, y: 0 },
            data: {
                label: stage.name,
                description: stage.description,
                color: stageColor,
                hasChildren: !!stage.items && stage.items.length > 0,
                isExpanded: false,
                category: stage.type,
            },
        });

        initialEdges.push({
            id: `e-${rootId}-${stageId}`,
            source: rootId,
            target: stageId,
            type: 'smoothstep',
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed, color: stageColor, width: 20, height: 20 },
            style: { stroke: stageColor, strokeWidth: 3, opacity: 0.8 },
        });

        stage.items?.forEach(item => {
            const itemId = `node-${nodeIdCounter++}`;
            initialNodes.push({
                id: itemId,
                type: 'careerNode',
                position: { x: 0, y: 0 },
                data: {
                    label: item.name,
                    description: item.description,
                    color: stageColor,
                    hasChildren: !!item.resources && item.resources.length > 0,
                    isExpanded: false,
                    category: `${stage.type}-item`,
                },
            });
            initialEdges.push({
                id: `e-${stageId}-${itemId}`,
                source: stageId,
                target: itemId,
                type: 'smoothstep',
                markerEnd: { type: MarkerType.ArrowClosed, color: stageColor, width: 20, height: 20 },
                style: { stroke: stageColor, strokeWidth: 2, opacity: 0.7 },
            });
            
            item.resources?.forEach(resource => {
                const resourceId = `node-${nodeIdCounter++}`;
                const resourceColor = nodeColors[resource.category] || nodeColors.default;
                initialNodes.push({
                    id: resourceId,
                    type: 'careerNode',
                    position: { x: 0, y: 0 },
                    data: {
                        label: resource.name,
                        description: resource.description,
                        color: resourceColor,
                        hasChildren: false,
                        isExpanded: false,
                        category: resource.category,
                        url: resource.url
                    },
                });
                initialEdges.push({
                    id: `e-${itemId}-${resourceId}`,
                    source: itemId,
                    target: resourceId,
                    type: 'smoothstep',
                    markerEnd: { type: MarkerType.ArrowClosed, color: resourceColor, width: 20, height: 20 },
                    style: { stroke: resourceColor, strokeWidth: 1.5, strokeDasharray: '5 5', opacity: 0.8 },
                });
            });
        });
    });

    return { initialNodes, initialEdges };
};


export default function CareerMindMap({ mindMapData }: { mindMapData: MindMapData }) {
    const { toast } = useToast();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());

    const { initialNodes, initialEdges } = useMemo(() => transformData(mindMapData), [mindMapData]);

    const handleToggleNode = useCallback((nodeId: string) => {
        setExpandedNodeIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(nodeId)) {
                newSet.delete(nodeId);
            } else {
                newSet.add(nodeId);
            }
            return newSet;
        });
    }, []);

    useEffect(() => {
        const rootNode = initialNodes.find(n => n.data.category === 'root');
        if (rootNode) {
            setExpandedNodeIds(new Set([rootNode.id]));
        }
    }, [initialNodes]);

    useEffect(() => {
        const getVisibleNodesAndEdges = () => {
            const visibleNodes = new Set<string>();
            const queue: string[] = [];

            const root = initialNodes.find(n => n.data.category === 'root');
            if (root) {
                queue.push(root.id);
                visibleNodes.add(root.id);
            }
            
            while (queue.length > 0) {
                const currentId = queue.shift()!;
                if (expandedNodeIds.has(currentId)) {
                    const children = initialEdges.filter(e => e.source === currentId).map(e => e.target);
                    children.forEach(childId => {
                        if (!visibleNodes.has(childId)) {
                            visibleNodes.add(childId);
                            queue.push(childId);
                        }
                    });
                }
            }

            const finalNodes = initialNodes
                .filter(n => visibleNodes.has(n.id))
                .map(n => ({
                    ...n,
                    data: {
                        ...n.data,
                        isExpanded: expandedNodeIds.has(n.id),
                        onToggle: handleToggleNode,
                    }
                }));

            const finalEdges = initialEdges.filter(e => visibleNodes.has(e.source) && visibleNodes.has(e.target));
            
            return { finalNodes, finalEdges };
        };

        const { finalNodes, finalEdges } = getVisibleNodesAndEdges();
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(finalNodes, finalEdges);

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);

    }, [expandedNodeIds, initialNodes, initialEdges, setNodes, setEdges, handleToggleNode]);
    
    
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
              toast({ title: "Error", description: "Could not export mind map. " + err.message, variant: "destructive" });
            });
        }
    }, [toast]);
  
    const toggleAll = (expand: boolean) => {
        if (expand) {
            setExpandedNodeIds(new Set(initialNodes.map(n => n.id)));
        } else {
            const rootNode = initialNodes.find(n => n.data.category === 'root');
            setExpandedNodeIds(new Set(rootNode ? [rootNode.id] : []));
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
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2, minZoom: 0.3, maxZoom: 1.5 }}
                attributionPosition="bottom-left"
                minZoom={0.1}
                maxZoom={4}
                defaultEdgeOptions={{
                    type: 'smoothstep',
                    animated: true,
                    style: { strokeWidth: 3 }
                }}
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

    
