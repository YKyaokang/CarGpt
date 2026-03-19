"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";

interface ChatInputProps {
  input: string;
  handleInputChange: (e: any) => void;
  handleSubmit: (e: any) => void;
}

export default function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
}: ChatInputProps) {
  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex-1 relative">
        <Input
          onChange={handleInputChange}
          value={input}
          placeholder="Ask me anything about cars..."
          className="pr-12 py-3 text-base rounded-xl border-2
            bg-white dark:bg-gray-700 shadow-sm
            transition-all duration-200 resize-none
            focus:shadow-lg"
          style={{
            borderColor: 'hsl(var(--theme-primary) / 0.25)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'hsl(var(--theme-primary) / 0.7)';
            e.currentTarget.style.boxShadow = '0 0 0 3px hsl(var(--theme-primary) / 0.15)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'hsl(var(--theme-primary) / 0.25)';
            e.currentTarget.style.boxShadow = '';
          }}
        />
      </div>
      <Button
        type="submit"
        disabled={!input.trim()}
        className="h-12 w-12 rounded-xl shadow-lg transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed theme-btn"
        style={{
          background: input.trim()
            ? 'linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))'
            : undefined,
        }}
      >
        <ArrowUp className="h-5 w-5" />
        <span className="sr-only">Submit</span>
      </Button>
    </form>
  );
}
