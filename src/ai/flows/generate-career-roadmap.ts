'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a career roadmap mind map based on a user's profile.
 *
 * The flow takes a user profile as input and outputs a structured JSON object for a mind map.
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

const ResourceSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    category: z.enum(['traditional', 'ai_first']),
    url: z.string().url().optional(),
});

const MetadataSchema = z.object({
    duration: z.string().optional(),
    difficulty: z.string().optional(),
});

const MindMapItemSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    metadata: MetadataSchema.optional(),
    resources: z.array(ResourceSchema).optional(),
});

const MindMapStageSchema = z.object({
    name: z.string(),
    type: z.enum(['foundation', 'skills', 'specialization', 'traditional', 'ai_first', 'timeline']),
    description: z.string().optional(),
    metadata: MetadataSchema.optional(),
    items: z.array(MindMapItemSchema).optional(),
});

const MindMapSchema = z.object({
    title: z.string().describe('The main title of the career path.'),
    description: z.string().describe('A brief overview of the career path.'),
    stages: z.array(MindMapStageSchema).describe('The main stages of the career roadmap.'),
});

const GenerateCareerRoadmapOutputSchema = z.object({
  mindMap: MindMapSchema.describe('A structured JSON object representing the career mind map.'),
});
export type GenerateCareerRoadmapOutput = z.infer<typeof GenerateCareerRoadmapOutputSchema>;


export async function generateCareerRoadmap(input: GenerateCareerRoadmapInput): Promise<GenerateCareerRoadmapOutput> {
  return generateCareerRoadmapFlow(input);
}

const generateCareerRoadmapPrompt = ai.definePrompt({
  name: 'generateCareerRoadmapPrompt',
  input: {schema: GenerateCareerRoadmapInputSchema},
  output: {schema: GenerateCareerRoadmapOutputSchema},
  prompt: `You are an expert career counselor. Based on the user's profile, generate a structured JSON object representing a mind map of potential career paths.

User Profile:
Age: {{{age}}}
Location: {{{location}}}
Interests: {{#each interests}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Goals: {{{goals}}}
Current Grade: {{{current_grade}}}
Learning Style: {{{learning_style}}}
Time Availability: {{{time_availability}}}

Create a hierarchical JSON object for a mind map. The object should have a 'title', 'description', and a list of 'stages'.
Each stage must have a 'name', 'description', a 'type' from the allowed enum, and can have 'metadata' and a list of 'items'.
Each item can have a 'name', 'description', 'metadata' and a list of 'resources'.
Each resource must have a 'name', 'description', a 'category' ('traditional' or 'ai_first'), and an optional 'url'.

Example JSON Output:
{
  "mindMap": {
    "title": "AI Software Developer",
    "description": "Comprehensive roadmap to becoming an AI software developer",
    "stages": [
      {
        "name": "Foundation (10th-12th Grade)",
        "type": "foundation",
        "description": "Build strong fundamentals",
        "metadata": { "duration": "2-3 years", "difficulty": "Beginner" },
        "items": [
          {
            "name": "Math & Logic",
            "description": "Algebra, Statistics, Problem Solving",
            "metadata": { "duration": "Ongoing" },
            "resources": [
              {
                "name": "Khan Academy Math",
                "category": "traditional",
                "url": "https://khanacademy.org",
                "description": "Free math courses"
              },
              {
                "name": "ChatGPT for Math Help",
                "category": "ai_first",
                "url": "https://chat.openai.com",
                "description": "AI tutor for explanations"
              }
            ]
          }
        ]
      },
      {
        "name": "Core Skills (Engineering)",
        "type": "skills",
        "description": "Technical skills for AI development",
        "items": []
      }
    ]
  }
}

Based on their profile, generate the career roadmap as a JSON object. Ensure it is detailed and hierarchical with stages, items, and resources.
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
