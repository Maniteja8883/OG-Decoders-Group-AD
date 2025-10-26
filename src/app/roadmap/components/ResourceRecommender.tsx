"use client";

import type { RecommendResourcesOutput } from "@/ai/flows/modern-resource-recommender";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Book, Bot, BrainCircuit, ExternalLink, Timer } from "lucide-react";
import Link from "next/link";

type ResourceRecommenderProps = {
  resources: RecommendResourcesOutput;
};

export default function ResourceRecommender({ resources }: ResourceRecommenderProps) {
  const traditionalResources = resources.filter((r) => !r.isAiFirst);
  const aiFirstResources = resources.filter((r) => r.isAiFirst);

  const ResourceCard = ({ resource }: { resource: RecommendResourcesOutput[0] }) => (
    <Card className="hover:border-primary transition-colors">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
                <CardTitle className="text-lg">{resource.name}</CardTitle>
                <CardDescription>{resource.description}</CardDescription>
            </div>
            <Link href={resource.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline shrink-0">
                <ExternalLink className="h-5 w-5" />
            </Link>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2 text-sm">
        <Badge variant="secondary"><Book className="w-3 h-3 mr-1" />{resource.type}</Badge>
        <Badge variant="secondary"><BrainCircuit className="w-3 h-3 mr-1" />{resource.difficulty}</Badge>
        <Badge variant="secondary"><Timer className="w-3 h-3 mr-1" />{resource.timeEstimate}</Badge>
      </CardContent>
    </Card>
  );

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Learning Resources</CardTitle>
        <CardDescription>
          AI-curated resources to help you achieve your goals.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ai-first">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai-first">
                <Bot className="w-4 h-4 mr-2" /> AI-First Path
            </TabsTrigger>
            <TabsTrigger value="traditional">
                <Book className="w-4 h-4 mr-2" /> Traditional Path
            </TabsTrigger>
          </TabsList>
          <TabsContent value="ai-first" className="mt-4">
            <div className="space-y-4">
              {aiFirstResources.length > 0 ? (
                aiFirstResources.map((res, i) => <ResourceCard key={i} resource={res} />)
              ) : (
                <p className="text-muted-foreground text-center p-4">No AI-first resources recommended at this time.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="traditional" className="mt-4">
            <div className="space-y-4">
               {traditionalResources.length > 0 ? (
                traditionalResources.map((res, i) => <ResourceCard key={i} resource={res} />)
              ) : (
                <p className="text-muted-foreground text-center p-4">No traditional resources recommended at this time.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
