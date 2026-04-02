export interface NoteData {
  id: string;
  datetime: string;
  category: string;
  content: string;
  color: string;
}

const API_ENDPOINT = "/api/notes";

export async function fetchNotesFromSheets(): Promise<NoteData[]> {
  try {
    const response = await fetch(API_ENDPOINT);
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    const data = await response.json();
    // 데이터 구조 필터링: 구글 시트에서 빈 데이터가 올 수 있음
    return data.filter((item: any) => item.id);
  } catch (error) {
    console.error("fetchNotesFromSheets Error:", error);
    return [];
  }
}

export async function createNoteInSheets(note: NoteData) {
  try {
    await fetch(API_ENDPOINT, {
      method: "POST",
      body: JSON.stringify({ action: "create", ...note }),
    });
  } catch (error) {
    console.error("createNoteInSheets Error:", error);
  }
}

export async function updateNoteInSheets(note: Partial<NoteData> & { id: string }) {
  try {
    await fetch(API_ENDPOINT, {
      method: "POST",
      body: JSON.stringify({ action: "update", ...note }),
    });
  } catch (error) {
    console.error("updateNoteInSheets Error:", error);
  }
}

export async function deleteNoteFromSheets(id: string) {
  try {
    await fetch(API_ENDPOINT, {
      method: "POST",
      body: JSON.stringify({ action: "delete", id }),
    });
  } catch (error) {
    console.error("deleteNoteFromSheets Error:", error);
  }
}

export async function clearAllNotesInSheets() {
  try {
    await fetch(API_ENDPOINT, {
      method: "POST",
      body: JSON.stringify({ action: "clearAll" }),
    });
  } catch (error) {
    console.error("clearAllNotesInSheets Error:", error);
  }
}
