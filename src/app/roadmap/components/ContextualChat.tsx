"use client";

import { careerChatAssistant } from "@/ai/flows/career-chat-assistant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Bot, Loader2, Send, User } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

type Message = {
  sender: "user" | "bot";
  text: string;
};

type ContextualChatProps = {
  profile: object;
};

export default function ContextualChat({ profile }: ContextualChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: 'Have more questions about your career path? Ask me anything!' }
  ]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const newMessages: Message[] = [
      ...messages,
      { sender: "user", text: userInput },
    ];
    setMessages(newMessages);
    setUserInput("");
    setIsLoading(true);

    try {
      const response = await careerChatAssistant({
        profile: JSON.stringify(profile),
        query: userInput,
      });

      if (response.answer) {
        setMessages((prev) => [...prev, { sender: "bot", text: response.answer }]);
      } else {
        throw new Error("AI did not provide an answer.");
      }
    } catch (error) {
      console.error("Error with career chat:", error);
      toast({
        title: "An Error Occurred",
        description: "There was an issue with the AI assistant. Please try again.",
        variant: "destructive",
      });
      setMessages((prev) => [...prev, {sender: "bot", text: "I'm sorry, I encountered an error. Could you please rephrase your question?"}])
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg h-full max-h-[calc(100vh-12rem)] flex flex-col">
        <CardHeader>
            <CardTitle className="font-headline text-xl">Career Assistant</CardTitle>
            <CardDescription>Ask follow-up questions.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 pr-4 -mr-4">
                <div className="space-y-4">
                {messages.map((message, index) => (
                    <div
                    key={index}
                    className={`flex items-start gap-3 ${
                        message.sender === "user" ? "justify-end" : ""
                    }`}
                    >
                    {message.sender === "bot" && (
                        <div className="p-2 bg-primary rounded-full text-primary-foreground shrink-0">
                        <Bot className="w-5 h-5" />
                        </div>
                    )}
                    <div
                        className={`rounded-lg px-4 py-2 max-w-[85%] break-words ${
                        message.sender === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                    >
                        <p>{message.text}</p>
                    </div>
                    {message.sender === "user" && (
                        <div className="p-2 bg-muted rounded-full text-muted-foreground shrink-0">
                        <User className="w-5 h-5" />
                        </div>
                    )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary rounded-full text-primary-foreground shrink-0">
                        <Bot className="w-5 h-5" />
                        </div>
                        <div className="rounded-lg px-4 py-2 max-w-[85%] bg-muted text-muted-foreground flex items-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            <span>Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
                </div>
            </ScrollArea>
            <div className="pt-4 border-t mt-4">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <Input
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={isLoading ? "Waiting for response..." : "Ask a question..."}
                    disabled={isLoading}
                    autoComplete="off"
                />
                <Button type="submit" size="icon" disabled={isLoading || !userInput.trim()}>
                    {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                    <Send className="h-4 w-4" />
                    )}
                    <span className="sr-only">Send</span>
                </Button>
                </form>
            </div>
        </CardContent>
    </Card>
  );
}
