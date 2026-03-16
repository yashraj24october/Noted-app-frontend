import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const NotesContext = createContext()
export const useNotes = () => useContext(NotesContext)

export function NotesProvider({ children }) {
  const [notes, setNotes]     = useState([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats]     = useState(null)
  const [tags, setTags]       = useState([])
  const [activeNote, setActiveNote] = useState(null)
  const [filters, setFilters] = useState({ search: '', tag: '', subject: '', priority: '', sort: '-createdAt' })

  // Keep a ref to the latest filters so callbacks always see the current value
  const filtersRef = useRef(filters)
  filtersRef.current = filters

  const fetchNotes = useCallback(async (params = {}) => {
    setLoading(true)
    try {
      const merged = { ...filtersRef.current, ...params }
      const res = await axios.get('/notes', { params: merged })
      setNotes(res.data.data)
      return res.data
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch notes')
    } finally {
      setLoading(false)
    }
  }, [])   // no deps — uses ref so always fresh

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get('/notes/stats')
      setStats(res.data.data)
    } catch (_) {}
  }, [])

  const fetchTags = useCallback(async () => {
    try {
      const res = await axios.get('/tags')
      setTags(res.data.data)
    } catch (_) {}
  }, [])

  // Refresh everything — notes list + sidebar counts + tags
  const refreshAll = useCallback(async (noteParams = {}) => {
    await Promise.all([
      fetchNotes(noteParams),
      fetchStats(),
      fetchTags(),
    ])
  }, [fetchNotes, fetchStats, fetchTags])

  const createNote = async (data) => {
    try {
      const res = await axios.post('/notes', data)
      toast.success('Note created!')
      await refreshAll()
      return res.data.data
    } catch (err) { toast.error('Failed to create note'); throw err }
  }

  const updateNote = async (id, data) => {
    try {
      const res = await axios.put(`/notes/${id}`, data)
      // Optimistically update local state immediately
      setNotes(prev => prev.map(n => n._id === id ? res.data.data : n))
      // Then refresh stats/sidebar counts
      fetchStats()
      return res.data.data
    } catch (err) { toast.error('Failed to update note'); throw err }
  }

  const deleteNote = async (id, permanent = false) => {
    try {
      await axios.delete(`/notes/${id}`, { params: { permanent } })
      setNotes(prev => prev.filter(n => n._id !== id))
      toast.success(permanent ? 'Deleted permanently' : 'Moved to trash')
      await refreshAll()
    } catch (_) { toast.error('Failed to delete') }
  }

  const restoreNote = async (id) => {
    try {
      await axios.put(`/notes/${id}/restore`)
      setNotes(prev => prev.filter(n => n._id !== id))
      toast.success('Note restored!')
      await refreshAll()
    } catch (_) { toast.error('Failed to restore') }
  }

  const duplicateNote = async (id) => {
    try {
      const res = await axios.post(`/notes/${id}/duplicate`)
      toast.success('Note duplicated!')
      await refreshAll()
      return res.data.data
    } catch (_) { toast.error('Failed to duplicate') }
  }

  const togglePin = async (id) => {
    const note = notes.find(n => n._id === id)
    if (!note) return
    const updated = await updateNote(id, { isPinned: !note.isPinned })
    toast.success(note.isPinned ? 'Unpinned' : 'Pinned!')
    fetchStats()  // update sidebar pinned count
    return updated
  }

  const toggleFavorite = async (id) => {
    const note = notes.find(n => n._id === id)
    if (!note) return
    const updated = await updateNote(id, { isFavorite: !note.isFavorite })
    toast.success(note.isFavorite ? 'Removed from favourites' : 'Added to favourites!')
    fetchStats()  // update sidebar favorites count
    return updated
  }

  return (
    <NotesContext.Provider value={{
      notes, loading, stats, tags, activeNote, filters,
      setActiveNote, setFilters,
      fetchNotes, fetchStats, fetchTags, refreshAll,
      createNote, updateNote, deleteNote, restoreNote, duplicateNote,
      togglePin, toggleFavorite,
    }}>
      {children}
    </NotesContext.Provider>
  )
}
