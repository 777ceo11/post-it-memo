"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { X, Pencil, Check, CheckCircle2, Lightbulb, MoreHorizontal } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface PostitNoteProps {
  content: string;
  createdAt: string;
  onDelete: () => void;
  onUpdate: (newContent: string) => void;
  onUpdateCategory: (newCategory: "할 일" | "아이디어" | "기타") => void;
  className?: string;
  rotation?: number;
  color?: "yellow" | "blue" | "green" | "pink";
  category?: string;
}

const colorMap = {
  yellow: "from-yellow-200 to-yellow-400 text-yellow-900 border-yellow-300",
  blue: "from-blue-200 to-blue-400 text-blue-900 border-blue-300",
  green: "from-green-200 to-green-400 text-green-900 border-green-300",
  pink: "from-pink-200 to-pink-400 text-pink-900 border-pink-300",
};

const CATEGORIES = ["할 일", "아이디어", "기타"] as const;

export function PostitNote({ 
  content, 
  createdAt, 
  onDelete, 
  onUpdate,
  onUpdateCategory,
  className, 
  rotation = 0,
  color = "yellow",
  category
}: PostitNoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);
  const [isDeleting, setIsDeleting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    onUpdate(editValue);
    setIsEditing(false);
  };

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      onDelete();
    }, 300); // Wait for fade-out animation
  };

  return (
    <div 
      style={{ transform: `rotate(${rotation}deg)` }}
      className={cn(
        "transition-all duration-300",
        !isEditing && "hover:rotate-0",
        isDeleting && "opacity-0 scale-90 blur-sm pointer-events-none"
      )}
    >
      <Card 
        className={cn(
          "relative w-64 h-64 p-6 flex flex-col justify-between shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-default group overflow-hidden border-t-4",
          "bg-gradient-to-br animate-snap-on",
          colorMap[color],
          className
        )}
      >
        {/* Tape-like effect at the top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-white/30 backdrop-blur-sm -translate-y-1 shadow-sm" />
        
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {!isEditing ? (
            <>
              <button 
                onClick={() => setIsEditing(true)}
                className="p-1 rounded-full bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/10"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button 
                onClick={handleDelete}
                className="p-1 rounded-full bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/10 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button 
              onClick={handleSave}
              className="p-1 rounded-full bg-black/5 hover:bg-black/10"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 mt-4 overflow-auto scrollbar-hide">
          {isEditing ? (
            <Textarea
              ref={textareaRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full h-full bg-transparent border-none focus-visible:ring-0 text-xl font-handwriting p-0 resize-none min-h-[140px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
          ) : (
            <p className="text-xl font-medium leading-relaxed whitespace-pre-wrap font-handwriting">
              {content}
            </p>
          )}
        </div>

        <div className="flex items-end justify-between mt-2">
          {category && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/5 uppercase tracking-wider cursor-pointer hover:bg-black/10 transition-colors">
                  {category}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="rounded-2xl dark:bg-zinc-900 border-none shadow-2xl">
                {CATEGORIES.map(cat => (
                  <DropdownMenuItem 
                    key={cat} 
                    onClick={() => onUpdateCategory(cat)}
                    className="gap-2 rounded-xl text-xs dark:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800"
                  >
                    {cat === "할 일" && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                    {cat === "아이디어" && <Lightbulb className="w-3 h-3 text-yellow-500" />}
                    {cat === "기타" && <MoreHorizontal className="w-3 h-3 text-slate-500" />}
                    {cat}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <div className="text-[10px] font-medium opacity-50 font-sans tracking-tight">
            {createdAt}
          </div>
        </div>

        {/* Aesthetic sticky note bottom fold */}
        <div className="absolute bottom-0 right-0 w-8 h-8 bg-black/5 clip-path-fold" />
      </Card>
    </div>
  );
}
