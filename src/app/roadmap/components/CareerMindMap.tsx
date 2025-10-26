"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type CareerMindMapProps = {
  mindMap: string;
};

export default function CareerMindMap({ mindMap }: CareerMindMapProps) {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(mindMap);
    toast({
      title: "Copied!",
      description: "Mermaid syntax copied to clipboard.",
    });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="font-headline text-xl">Your Career Roadmap</CardTitle>
            <CardDescription>Your personalized career paths in Mermaid.js syntax.</CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={handleCopy}>
            <Copy className="h-4 w-4" />
            <span className="sr-only">Copy Mermaid Syntax</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <pre className="bg-muted/30 rounded-lg p-4 text-sm overflow-auto max-h-[400px]">
          <code>{mindMap}</code>
        </pre>
        <p className="text-xs text-muted-foreground mt-2">
          You can paste this syntax into a Mermaid.js compatible editor to see the visualization.
        </p>
      </CardContent>
    </Card>
  );
}
