let notes = []
let editingNoteId = null

async function fetchNotesFromBackend() {
  try {
    const response = await fetch("http://localhost:1358/notes")
    if (!response.ok) throw new Error("Network response was not ok")
    const data = await response.json()
    notes = data["Notes present currently in DB"] || []

    renderNotes()
  } catch (error) {
    console.error("Failed to fetch notes:", error)
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetchNotesFromBackend()
})

function saveNotes() {

}

function renderNotes(filteredNotes = null) {
  const notesToRender = filteredNotes || notes
  const container = document.getElementById("notesContainer")
  const emptyState = document.getElementById("emptyState")

  if (notesToRender.length === 0) {
    container.innerHTML = ""
    emptyState.style.display = "block"

    
    const searchTerm = document.getElementById("searchInput").value
    if (searchTerm) {
      document.getElementById("emptyTitle").textContent = "No notes found"
      document.getElementById("emptyMessage").textContent = "Try adjusting your search terms"
    } else {
      document.getElementById("emptyTitle").textContent = "No notes yet"
      document.getElementById("emptyMessage").textContent = "Create your first note to get started"
    }
    return
  }

  emptyState.style.display = "none"

  container.innerHTML = notesToRender
    .map(
      (note) => `
        <div class="note-card">
            <div class="note-header">
                <h3 class="note-title">${escapeHtml(note.title)}</h3>
                <div class="note-actions">
                    <button class="action-btn edit-btn" onclick="editNote('${note.id}')" title="Edit note">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteNote('${note.id}')" title="Delete note">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3,6 5,6 21,6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>
            </div>
            <p class="note-content">${escapeHtml(note.content)}</p>
            <div class="note-date">${formatDate(note.updatedAt)}</div>
        </div>
    `,
    )
    .join("")
}


function searchNotes() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase()

  if (!searchTerm) {
    renderNotes()
    return
  }

  const filteredNotes = notes.filter(
    (note) => note.title.toLowerCase().includes(searchTerm) || note.content.toLowerCase().includes(searchTerm),
  )

  renderNotes(filteredNotes)
}


function openCreateModal() {
  editingNoteId = null
  document.getElementById("modalTitle").textContent = "Create New Note"
  document.getElementById("saveButtonText").textContent = "Create Note"
  document.getElementById("noteTitle").value = ""
  document.getElementById("noteContent").value = ""
  showModal()
}


function editNote(id) {
  const note = notes.find((n) => n.id === id)
  if (!note) return

  editingNoteId = id
  document.getElementById("modalTitle").textContent = "Edit Note"
  document.getElementById("saveButtonText").textContent = "Save Changes"
  document.getElementById("noteTitle").value = note.title
  document.getElementById("noteContent").value = note.content
  showModal()
}


async function saveNote() {
  const title = document.getElementById("noteTitle").value.trim()
  const content = document.getElementById("noteContent").value.trim()

  if (!title && !content) {
    alert("Please enter a title or content for your note.")
    return
  }

  const now = new Date().toISOString()

  if (editingNoteId) {
   
    const noteIndex = notes.findIndex((n) => n._id === editingNoteId || n.id === editingNoteId)
    if (noteIndex !== -1) {
      notes[noteIndex] = {
        ...notes[noteIndex],
        title: title || "Untitled",
        content: content,
        updatedAt: now,
      }
    }
    saveNotes()
    renderNotes()
    closeModal()
  } else {
 
    try {
      const res = await fetch("http://localhost:1358/notes", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          notesTitle: title || "Untitled",
          notesContent: content,
        }),
      })
      if (!res.ok) throw new Error("Failed to create note")
      await fetchNotesFromBackend()
      closeModal()
    } catch (err) {
      alert("Failed to create note: " + err.message)
    }
  }
}

function deleteNote(id) {
  if (confirm("Are you sure you want to delete this note?")) {
    notes = notes.filter((note) => note.id !== id)
    saveNotes()
    renderNotes()
  }
}


function showModal() {
  document.getElementById("noteModal").style.display = "block"
  document.getElementById("modalBackdrop").style.display = "block"
  document.body.style.overflow = "hidden"

  
  setTimeout(() => {
    document.getElementById("noteTitle").focus()
  }, 100)
}


function closeModal() {
  document.getElementById("noteModal").style.display = "none"
  document.getElementById("modalBackdrop").style.display = "none"
  document.body.style.overflow = "auto"
  editingNoteId = null
}


function formatDate(dateString) {
  const date = new Date(dateString)
  const options = {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }
  return date.toLocaleDateString("en-US", options)
}


function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}


document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal()
  }

  
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    const modal = document.getElementById("noteModal")
    if (modal.style.display === "block") {
      saveNote()
    }
  }
})


document.getElementById("modalBackdrop").addEventListener("click", closeModal)
