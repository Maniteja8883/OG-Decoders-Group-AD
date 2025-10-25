'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a career roadmap mind map based on a user's profile.
 *
 * The flow takes a user profile as input and outputs a structured JSON object for a mind map, formatted as a knowledge graph with nodes and edges.
 *
 * @exports {function} generateCareerRoadmap - The main function to trigger the flow.
 * @exports {type} GenerateCareerRoadmapInput - The input type for the generateCareerRoadmap function.
 * @exports {type} GenerateCareerRoadmapOutput - The return type for the generateCareerRoadmap function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCareerRoadmapInputSchema = z.object({
  age: z.number().describe('The age of the user.'),
  location: z.string().describe('The location of the user.'),
  interests: z.array(z.string()).describe('The interests of the user.'),
  goals: z.string().describe('The career goals of the user.'),
  current_grade: z.string().describe('The current academic standing of the user.'),
  learning_style: z.string().describe('The learning style of the user.'),
  time_availability: z.string().describe('The time availability of the user.'),
});
export type GenerateCareerRoadmapInput = z.infer<typeof GenerateCareerRoadmapInputSchema>;

const NodeSchema = z.object({
  id: z.string().describe('A unique identifier for the node (e.g., "root", "foundation", "math-skills").'),
  label: z.string().describe('The short, display title of the node.'),
  description: z.string().optional().describe('A longer description of what this node represents.'),
  category: z.string().describe('A category for styling/coloring the node (e.g., "root", "foundation", "skills", "specialization", "traditional_resource", "ai_first_resource").'),
  url: z.string().url().optional().describe('An external link for a resource node.'),
});

const EdgeSchema = z.object({
    id: z.string().describe('A unique identifier for the edge (e.g., "e-root-foundation").'),
    source: z.string().describe('The ID of the parent node.'),
    target: z.string().describe('The ID of the child node.'),
    label: z.string().optional().describe('An optional label for the relationship (e.g., "leads to", "requires").'),
});

const MindMapSchema = z.object({
    nodes: z.array(NodeSchema).describe("An array of all the nodes in the mind map graph."),
    edges: z.array(EdgeSchema).describe("An array of all the edges connecting the nodes."),
});

const GenerateCareerRoadmapOutputSchema = z.object({
  mindMap: MindMapSchema.describe('A structured JSON object representing the career mind map as a graph.'),
});
export type GenerateCareerRoadmapOutput = z.infer<typeof GenerateCareerRoadmapOutputSchema>;


export async function generateCareerRoadmap(input: GenerateCareerRoadmapInput): Promise<GenerateCareerRoadmapOutput> {
  return generateCareerRoadmapFlow(input);
}

const generateCareerRoadmapPrompt = ai.definePrompt({
  name: 'generateCareerRoadmapPrompt',
  input: {schema: GenerateCareerRoadmapInputSchema},
  output: {schema: GenerateCareerRoadmapOutputSchema},
  prompt: `You are an expert career counselor creating a hierarchical knowledge graph for a career roadmap. Based on the user's profile, generate a structured JSON object representing a mind map with nodes and edges.

User Profile:
Age: {{{age}}}
Location: {{{location}}}
Interests: {{#each interests}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Goals: {{{goals}}}
Current Grade: {{{current_grade}}}
Learning Style: {{{learning_style}}}
Time Availability: {{{time_availability}}}

INSTRUCTIONS:
1.  Create a single root node for the main career goal. Its ID must be "root".
2.  Create main branch nodes (e.g., "Foundation", "Core Skills", "Specializations", "Tools"). These are direct children of the root.
3.  Create sub-topic nodes under each main branch.
4.  Create resource nodes under sub-topics. These should have a 'url' and a specific category ('traditional_resource' or 'ai_first_resource').
5.  Generate a unique, descriptive ID for every node and edge.
6.  For every node except the root, create a corresponding edge connecting it to its parent.

Example JSON Output:
{
  "mindMap": {
    "nodes": [
      { "id": "root", "label": "AI Engineer", "description": "Roadmap for becoming an AI Engineer.", "category": "root" },
      { "id": "foundation", "label": "Foundation", "description": "Core knowledge needed.", "category": "foundation" },
      { "id": "math_skills", "label": "Math Skills", "description": "Essential mathematics.", "category": "skills" },
      { "id": "khan_academy", "label": "Khan Academy", "description": "Learn math fundamentals.", "category": "traditional_resource", "url": "https://www.khanacademy.org" }
    ],
    "edges": [
      { "id": "e-root-foundation", "source": "root", "target": "foundation", "label": "starts with" },
      { "id": "e-foundation-math", "source": "foundation", "target": "math_skills" },
      { "id": "e-math-khan", "source": "math_skills", "target": "khan_academy" }
    ]
  }
}

Based on the user profile, generate the career roadmap as a JSON object with 'nodes' and 'edges'.
`,
});

const generateCareerRoadmapFlow = ai.defineFlow(
  {
    name: 'generateCareerRoadmapFlow',
    inputSchema: GenerateCareerRoadmapInputSchema,
    outputSchema: GenerateCareerRoadmapOutputSchema,
  },
  async input => {
    const {output} = await generateCareerRoadmapPrompt(input);
    return output!;
  }
);
