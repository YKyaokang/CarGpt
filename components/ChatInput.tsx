"use client";
import {
    Input
} from "@/components/ui/input"
import {
    Button
} from "@/components/ui/button"
import {
    ArrowUp
} from "lucide-react";

interface ChatInputProps {
  input: string;
  handleInputChange: (e:any)=>void;
  handleSubmit: (e: any)=>void;
}

export default function ChatInput({
  input,
  handleInputChange,
  handleSubmit
}:ChatInputProps) {
  return (
    <form onSubmit={handleSubmit} >

      <Input 
        onChange={handleInputChange}
        value={input}
        placeholder="Ask me anything about Cars..."
      />
      <Button>
        <ArrowUp />
        <span className="sr-only">Submit</span>
      </Button>
      
    </form>
  )
}