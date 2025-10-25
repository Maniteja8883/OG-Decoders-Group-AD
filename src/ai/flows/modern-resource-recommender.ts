'use server';
/**
 * @fileOverview An AI agent that recommends both traditional and AI-first learning resources tailored to the user's profile and career goals.
 *
 * - recommendResources - A function that handles the resource recommendation process.
 * - RecommendResourcesInput - The input type for the recommendResources function.
 * - RecommendResourcesOutput - The return type for the recommendResources function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendResourcesInputSchema = z.object({
  profile: z.object({
    age: z.number().describe('The age of the user.'),
    location: z.string().describe('The location of the user.'),
    interests: z.array(z.string()).describe('The interests of the user.'),
    goals: z.string().describe('The career goals of the user.'),
    current_grade: z.string().describe('The current academic standing of the user.'),
    learning_style: z.string().describe('The learning style of the user (e.g., structured, self-paced).'),
    time_availability: z.string().describe('The time the user has available for learning (e.g., hours per week).'),
  }).describe('The user profile.'),
  careerGoals: z.string().describe('The specific career goals of the user.'),
});
export type RecommendResourcesInput = z.infer<typeof RecommendResourcesInputSchema>;

const ResourceSchema = z.object({
  name: z.string().describe('The name of the resource.'),
  type: z.string().describe('The type of resource (e.g., course, tool, book, video_tutorial, github_repo, platform).'),
  url: z.string().url().describe('The URL of the resource.'),
  description: z.string().describe('A brief description of the resource.'),
  isAiFirst: z.boolean().describe('Whether the resource is an AI-first tool or a traditional resource.'),
  difficulty: z.string().describe('The difficulty level of the resource (e.g., beginner, intermediate, advanced).'),
  timeEstimate: z.string().describe('An estimate of the time required to complete the resource (e.g., hours, weeks).'),
});

const RecommendResourcesOutputSchema = z.array(ResourceSchema).describe('A list of recommended learning resources.');
export type RecommendResourcesOutput = z.infer<typeof RecommendResourcesOutputSchema>;

// Curated list of modern tools as a fallback
const aiToolsDb = {
    coding: [
      { name: "Cursor", description: "AI-first code editor (VSCode fork with GPT-4 integration)", url: "https://cursor.sh", type: "ai_tool", isAiFirst: true, difficulty: "beginner", timeEstimate: "1-2 weeks" },
      { name: "GitHub Copilot", description: "AI pair programmer powered by OpenAI Codex", url: "https://github.com/features/copilot", type: "ai_tool", isAiFirst: true, difficulty: "beginner", timeEstimate: "ongoing" },
      { name: "v0.dev", description: "Generate React components from text prompts (by Vercel)", url: "https://v0.dev", type: "ai_tool", isAiFirst: true, difficulty: "intermediate", timeEstimate: "ongoing" },
      { name: "Bolt.new", description: "Full-stack app builder with AI (StackBlitz)", url: "https://bolt.new", type: "ai_tool", isAiFirst: true, difficulty: "beginner", timeEstimate: "1-2 weeks" },
      { name: "Lovable (formerly GPT Engineer)", description: "Build full web apps from prompts", url: "https://lovable.dev", type: "ai_tool", isAiFirst: true, difficulty: "intermediate", timeEstimate: "2-4 weeks" },
    ],
    learning: [
      { name: "ChatGPT (GPT-4o)", description: "AI assistant for learning, coding help, explanations", url: "https://chat.openai.com", type: "ai_tool", isAiFirst: true, difficulty: "beginner", timeEstimate: "ongoing" },
      { name: "Claude 3.5 Sonnet", description: "Advanced AI by Anthropic, excellent for coding and analysis", url: "https://claude.ai", type: "ai_tool", isAiFirst: true, difficulty: "beginner", timeEstimate: "ongoing" },
      { name: "Perplexity AI", description: "AI-powered search engine for research", url: "https://perplexity.ai", type: "ai_tool", isAiFirst: true, difficulty: "beginner", timeEstimate: "ongoing" },
      { name: "Google Gemini 1.5 Pro", description: "Multimodal AI with long context (1M tokens)", url: "https://gemini.google.com", type: "ai_tool", isAiFirst: true, difficulty: "beginner", timeEstimate: "ongoing" },
    ],
    deployment: [
        { name: "Vercel", description: "Deploy Next.js/React apps instantly", url: "https://vercel.com", type: "platform", isAiFirst: false, difficulty: "beginner", timeEstimate: "1 week" },
        { name: "Firebase", description: "Google's backend-as-a-service (auth, database, hosting)", url: "https://firebase.google.com", type: "platform", isAiFirst: false, difficulty: "beginner", timeEstimate: "2-3 weeks" },
        { name: "Supabase", description: "Open-source Firebase alternative (Postgres-based)", url: "https://supabase.com", type: "platform", isAiFirst: false, difficulty: "intermediate", timeEstimate: "2-3 weeks" },
    ],
    traditional: [
        { name: "CS50's Introduction to Computer Science", type: "course", url: "https://cs50.harvard.edu/", description: "A foundational computer science course from Harvard University.", isAiFirst: false, difficulty: "beginner", timeEstimate: "12 weeks" },
        { name: "FreeCodeCamp", type: "course", url: "https://www.freecodecamp.org/", description: "Offers thousands of hours of free coding courses and certifications.", isAiFirst: false, difficulty: "beginner", timeEstimate: "self-paced" },
        { name: "The Odin Project", type: "course", url: "https://www.theodinproject.com/", description: "A free, open-source curriculum for learning web development.", isAiFirst: false, difficulty: "beginner", timeEstimate: "6-12 months" },
    ]
};


const findResources = ai.defineTool(
  {
    name: 'findResources',
    description: 'Finds learning resources based on a career path and user profile.',
    inputSchema: z.object({
      careerPath: z.string(),
      skillLevel: z.string().describe("The user's skill level (e.g. beginner, intermediate)"),
    }),
    outputSchema: z.object({
      traditional: z.array(ResourceSchema),
      aiFirst: z.array(ResourceSchema),
      deployment: z.array(ResourceSchema),
    })
  },
  async (input) => {
    // In a real implementation, this would call APIs (YouTube, GitHub, etc.)
    // For now, we return from our curated database.
    console.log(`Finding resources for ${input.careerPath} at skill level ${input.skillLevel}`);
    return {
      traditional: aiToolsDb.traditional,
      aiFirst: [...aiToolsDb.coding, ...aiToolsDb.learning],
      deployment: aiToolsDb.deployment,
    };
  }
);


export async function recommendResources(input: RecommendResourcesInput): Promise<RecommendResourcesOutput> {
  return recommendResourcesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendResourcesPrompt',
  input: {schema: RecommendResourcesInputSchema},
  output: {schema: RecommendResourcesOutputSchema},
  tools: [findResources],
  prompt: `You are an expert career counselor. Your goal is to recommend a personalized list of learning resources to help a user achieve their career goals.

First, you MUST use the 'findResources' tool to get a list of available resources based on the user's career goals and skill level.

After retrieving the resources, filter and rank them based on the user's complete profile, including their interests, learning style, and time availability.

Present a final, curated list of the most relevant resources. Make sure to provide a balanced mix of AI-first and traditional resources.

User Profile:
- Age: {{profile.age}}
- Location: {{profile.location}}
- Interests: {{#each profile.interests}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- Current Grade: {{profile.current_grade}}
- Learning Style: {{profile.learning_style}}
- Time Availability: {{profile.time_availability}}

Career Goals: {{careerGoals}}

Select the most appropriate resources and return them as a JSON array.
`,config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  },
});

const recommendResourcesFlow = ai.defineFlow(
  {
    name: 'recommendResourcesFlow',
    inputSchema: RecommendResourcesInputSchema,
    outputSchema: RecommendResourcesOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
