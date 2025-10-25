import { Header } from "@/app/components/Header";
import { Suspense } from "react";
import { generateCareerRoadmap } from "@/ai/flows/generate-career-roadmap";
import { recommendResources } from "@/ai/flows/modern-resource-recommender";
import CareerMindMap from "./components/CareerMindMap";
import ResourceRecommender from "./components/ResourceRecommender";
import ContextualChat from "./components/ContextualChat";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

type RoadmapPageProps = {
  searchParams: { [key: string]: string | string[] | undefined };
};

type Profile = {
    age: number;
    location: string;
    interests: string[];
    goals: string;
    current_grade: string;
    learning_style: string;
    time_availability: string;
};

// This component fetches and displays the AI-generated data
async function RoadmapContent({ profile }: { profile: Profile }) {
    // Call both AI flows in parallel
    const [mindMapDataResult, resourcesDataResult] = await Promise.allSettled([
        generateCareerRoadmap(profile),
        recommendResources({
            profile: profile,
            careerGoals: profile.goals
        })
    ]);

    if (mindMapDataResult.status === 'rejected') {
        console.error("Failed to generate mind map:", mindMapDataResult.reason);
        return (
             <div className="container mx-auto">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error Generating Mind Map</AlertTitle>
                    <AlertDescription>
                       There was a critical error generating your career roadmap. Please try again.
                       <pre className="mt-2 whitespace-pre-wrap text-xs">{mindMapDataResult.reason?.message}</pre>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    if (resourcesDataResult.status === 'rejected') {
        console.error("Failed to recommend resources:", resourcesDataResult.reason);
        // We can still render the mind map even if resources fail
    }

    const mindMapData = mindMapDataResult.value;
    const resourcesData = resourcesDataResult.status === 'fulfilled' ? resourcesDataResult.value : [];


    return (
      <div className="container mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        <div className="xl:col-span-2 space-y-6">
            <CareerMindMap mindMapData={mindMapData.mindMap} />
             {resourcesData.length > 0 && <ResourceRecommender resources={resourcesData} />}
        </div>
        <div className="xl:col-span-1">
            <ContextualChat profile={profile} />
        </div>
      </div>
    )
}

function RoadmapSkeleton() {
    return (
        <div className="container mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            <div className="xl:col-span-2 space-y-6">
                <Skeleton className="h-[600px] w-full rounded-lg" />
                <Skeleton className="h-[400px] w-full rounded-lg" />
            </div>
            <div className="xl:col-span-1">
                <Skeleton className="h-[600px] w-full rounded-lg" />
            </div>
        </div>
    )
}

export default function RoadmapPage({ searchParams }: RoadmapPageProps) {
  let profile: Profile | null = null;
  let profileError: string | null = null;

  try {
    const profileString = searchParams?.profile;
    if (typeof profileString !== "string") {
      throw new Error("Profile data is missing or invalid.");
    }
    const decodedProfile = decodeURIComponent(profileString);
    const parsedProfile = JSON.parse(decodedProfile);
    
    // Basic validation
    if (
        !parsedProfile.goals ||
        !parsedProfile.interests ||
        !parsedProfile.location
    ) {
        throw new Error("Incomplete profile data.");
    }
    
    // Normalize profile object from inconsistent AI flow outputs
    profile = {
        age: parsedProfile.age || 18,
        location: parsedProfile.location,
        interests: Array.isArray(parsedProfile.interests) ? parsedProfile.interests : [String(parsedProfile.interests)],
        goals: parsedProfile.goals,
        current_grade: parsedProfile.current_grade || parsedProfile.academicStanding || 'Not specified',
        learning_style: parsedProfile.learning_style || parsedProfile.learningStyle || 'Not specified',
        time_availability: parsedProfile.time_availability || parsedProfile.timeAvailability || 'Not specified'
    }

  } catch (error) {
    console.error("Failed to parse profile:", error);
    profileError = (error instanceof Error) ? error.message : "An unknown error occurred while parsing profile data.";
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 py-8 px-4 md:px-6">
        {profile && !profileError ? (
          <Suspense fallback={<RoadmapSkeleton />}>
            <RoadmapContent profile={profile} />
          </Suspense>
        ) : (
          <div className="container mx-auto">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Could Not Generate Roadmap</AlertTitle>
              <AlertDescription>
                {profileError || "There was an issue loading your profile data. Please go back and try again."}
              </AlertDescription>
            </Alert>
          </div>
        )}
      </main>
    </div>
  );
}
