"use client";

import { useState, useEffect } from "react";
import { Plus, StickyNote, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PostitNote } from "@/components/post-it-note";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from "@hello-pangea/dnd";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { 
  Filter, 
  CheckCircle2, 
  Lightbulb, 
  MoreHorizontal,
  ChevronDown 
} from "lucide-react";

import { 
  fetchNotesFromSheets, 
  createNoteInSheets, 
  updateNoteInSheets, 
  deleteNoteFromSheets, 
  clearAllNotesInSheets 
} from "@/lib/sheets";

type NoteCategory = "할 일" | "아이디어" | "기타";

interface Note {
  id: string;
  content: string;
  createdAt: string;
  rotation: number;
  color: "yellow" | "blue" | "green" | "pink";
  category: NoteCategory;
}

const CATEGORIES: NoteCategory[] = ["할 일", "아이디어", "기타"];

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [filter, setFilter] = useState<"전체" | NoteCategory>("전체");
  const [activeCategory, setActiveCategory] = useState<NoteCategory>("할 일");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Sync with Google Sheets on Load
  useEffect(() => {
    setIsClient(true);
    
    async function loadData() {
      setIsLoading(true);
      try {
        const sheetsData = await fetchNotesFromSheets();
        
        if (sheetsData && sheetsData.length > 0) {
          // Map Sheets data to Note interface
          const mappedNotes: Note[] = sheetsData.map(item => ({
            id: item.id,
            content: item.content,
            createdAt: item.datetime,
            category: item.category as NoteCategory,
            color: item.color as any,
            rotation: Math.floor(Math.random() * 8) - 4
          }));
          setNotes(mappedNotes);
        } else {
          // Fallback to localStorage and SYNC to Sheets!
          const savedNotes = localStorage.getItem("postit-notes");
          if (savedNotes) {
            const localNotes: Note[] = JSON.parse(savedNotes);
            setNotes(localNotes);
            
            // Proactively sync local notes to Sheets if sheet is empty
            if (localNotes.length > 0) {
              console.log("Empty sheet detected. Syncing local notes to Google Sheets...");
              for (const note of localNotes) {
                await createNoteInSheets({
                  id: note.id,
                  datetime: note.createdAt,
                  category: note.category,
                  content: note.content,
                  color: note.color
                });
              }
            }
          } else {
            // Initial welcome notes
            const initialNotes: Note[] = [
              {
                id: "1",
                content: "환영합니다! 👋\n여기에 당신의 할 일을 기록해보세요.",
                createdAt: new Date().toLocaleString(),
                rotation: -2,
                color: "yellow",
                category: "할 일",
              },
              {
                id: "2",
                content: "포스트잇 스타일의 깔끔한 할 일 관리 앱입니다.",
                createdAt: new Date().toLocaleString(),
                rotation: 3,
                color: "blue",
                category: "아이디어",
              }
            ];
            setNotes(initialNotes);
            
            // Sync initial notes to Sheets too
            for (const note of initialNotes) {
              await createNoteInSheets({
                id: note.id,
                datetime: note.createdAt,
                category: note.category,
                content: note.content,
                color: note.color
              });
            }
          }
        }
      } catch (error) {
        console.error("Failed to load notes from sheets:", error);
      } finally {
        setIsLoading(false);
        setHasLoaded(true);
      }
    }

    loadData();
  }, []);

  const colors: Note["color"][] = ["yellow", "blue", "green", "pink"];

  // Save notes to local storage (optional sync fallback)
  useEffect(() => {
    if (hasLoaded) {
      localStorage.setItem("postit-notes", JSON.stringify(notes));
    }
  }, [notes, hasLoaded]);

  const addNote = async () => {
    if (!inputValue.trim()) return;

    const newNote: Note = {
      id: crypto.randomUUID(),
      content: inputValue,
      createdAt: new Date().toLocaleString(),
      rotation: Math.floor(Math.random() * 8) - 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      category: activeCategory,
    };

    setNotes([newNote, ...notes]);
    setInputValue("");

    // Sync with Sheets
    await createNoteInSheets({
      id: newNote.id,
      datetime: newNote.createdAt,
      category: newNote.category,
      content: newNote.content,
      color: newNote.color
    });
  };

  const updateNote = async (id: string, content: string) => {
    setNotes(notes.map((note) => (note.id === id ? { ...note, content } : note)));
    await updateNoteInSheets({ id, content });
  };

  const updateCategory = async (id: string, category: NoteCategory) => {
    setNotes(notes.map((note) => (note.id === id ? { ...note, category } : note)));
    await updateNoteInSheets({ id, category });
  };

  const deleteNote = async (id: string) => {
    setNotes(notes.filter((note) => note.id !== id));
    await deleteNoteFromSheets(id);
  };

  const clearAllNotes = async () => {
    if (confirm("모든 메모를 삭제하시겠습니까?")) {
      setNotes([]);
      localStorage.removeItem("postit-notes");
      await clearAllNotesInSheets();
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(notes);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setNotes(items);
    // Note: Reordering is local-only for now unless row order is synced.
    // Given the request, we focus on CRUD of note data.
  };

  const filteredNotes = filter === "전체" 
    ? notes 
    : notes.filter(n => n.category === filter);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 p-8 flex flex-col items-center transition-colors duration-500">
      {/* Header & Input Area */}
      <div className="w-full max-w-4xl space-y-8 z-10">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-400 rounded-2xl shadow-lg ring-4 ring-yellow-400/20 shrink-0">
              <StickyNote className="w-6 h-6 text-yellow-900" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                Post-it <span className="text-yellow-500">Board</span>
              </h1>
              <p className="text-slate-500 dark:text-zinc-400 text-xs sm:text-sm font-medium leading-tight">
                카테고리로 메모를 분류해보세요
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-11 sm:h-12 px-3 sm:px-5 gap-2 rounded-2xl border-white dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/10 backdrop-blur-sm dark:text-white text-xs sm:text-base">
                  <Filter className="w-4 h-4 shrink-0" />
                  <span>{filter}</span>
                  <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800">
                <DropdownMenuLabel className="dark:text-zinc-400">필터링</DropdownMenuLabel>
                <DropdownMenuSeparator className="dark:bg-zinc-800" />
                <DropdownMenuItem onClick={() => setFilter("전체")} className="gap-2 rounded-xl dark:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800">
                  모두 보기
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("할 일")} className="gap-2 rounded-xl dark:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  할 일
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("아이디어")} className="gap-2 rounded-xl dark:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  아이디어
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter("기타")} className="gap-2 rounded-xl dark:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800">
                  <MoreHorizontal className="w-4 h-4 text-slate-500" />
                  기타
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ThemeToggle />
            
            {notes.length > 0 && (
              <Button 
                variant="ghost" 
                onClick={clearAllNotes}
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all rounded-full h-12 px-4 shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </header>

        {/* Create Input Area */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 bg-white/70 dark:bg-zinc-900/40 backdrop-blur-xl border border-white dark:border-zinc-800 p-2 rounded-3xl shadow-xl flex items-center gap-2 group focus-within:ring-2 focus-within:ring-yellow-400/30 transition-all duration-300">
            <Input 
              className="flex-1 bg-transparent border-none text-lg h-14 focus-visible:ring-0 placeholder:text-slate-400 dark:placeholder:text-zinc-600 px-6 rounded-2xl dark:text-white"
              placeholder="할 일을 입력하고 Enter..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addNote()}
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-12 px-4 rounded-2xl gap-2 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
                  {activeCategory === "할 일" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  {activeCategory === "아이디어" && <Lightbulb className="w-4 h-4 text-yellow-500" />}
                  {activeCategory === "기타" && <MoreHorizontal className="w-4 h-4 text-slate-500" />}
                  <span className="hidden md:inline">{activeCategory}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="rounded-2xl dark:bg-zinc-900 dark:border-zinc-800 shadow-2xl">
                {CATEGORIES.map(cat => (
                  <DropdownMenuItem 
                    key={cat} 
                    onClick={() => setActiveCategory(cat)}
                    className="gap-2 rounded-xl dark:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800"
                  >
                    {cat === "할 일" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    {cat === "아이디어" && <Lightbulb className="w-4 h-4 text-yellow-500" />}
                    {cat === "기타" && <MoreHorizontal className="w-4 h-4 text-slate-500" />}
                    {cat}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              onClick={addNote}
              size="lg"
              className="w-14 h-14 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-yellow-900 shadow-md transition-all active:scale-95 group-hover:shadow-yellow-400/20 group-hover:shadow-lg"
            >
              <Plus className="w-6 h-6 stroke-[3px]" />
            </Button>
          </div>
        </div>
      </div>

      {/* Grid Container with DnD */}
      <div className="w-full max-w-7xl mt-16 mb-20 min-h-[400px]">
        {isClient && (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="notes" direction="horizontal">
              {(provided) => (
                <div 
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center"
                >
                  {filteredNotes.length > 0 ? (
                    filteredNotes.map((note, index) => (
                      <Draggable key={note.id} draggableId={note.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "transition-transform",
                              snapshot.isDragging && "scale-110 z-50 pointer-events-none"
                            )}
                          >
                            <PostitNote
                              content={note.content}
                              createdAt={note.createdAt}
                              rotation={note.rotation}
                              color={note.color}
                              category={note.category}
                              onUpdate={(newContent) => updateNote(note.id, newContent)}
                              onUpdateCategory={(newCat) => updateCategory(note.id, newCat)}
                              onDelete={() => deleteNote(note.id)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))
                  ) : (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-600 space-y-4">
                      <div className="w-20 h-20 bg-slate-100 dark:bg-zinc-900 rounded-full flex items-center justify-center opacity-50">
                        <StickyNote className="w-10 h-10" />
                      </div>
                      <p className="text-lg font-medium">{filter === "전체" ? "작성된 메모가 없습니다." : `${filter} 카테고리에 메모가 없습니다.`}</p>
                    </div>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Decorative background elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-1 overflow-hidden opacity-30 dark:opacity-20">
        <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-yellow-200/40 dark:bg-yellow-900/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-blue-100/40 dark:bg-blue-900/20 rounded-full blur-3xl animate-pulse delay-700" />
      </div>
    </div>
  );
}
