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
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex-1 relative">
        <Input 
          onChange={handleInputChange}
          value={input}
          placeholder="Ask me anything about cars..."
          className="pr-12 py-3 text-base rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 shadow-sm transition-all duration-200 resize-none focus:shadow-lg focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
        />
      </div>
      <Button 
        type="submit"
        disabled={!input.trim()}
        className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ArrowUp className="h-5 w-5" />
        <span className="sr-only">Submit</span>
      </Button>
    </form>
  )
}