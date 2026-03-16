import React, { createContext, useContext, useState, useCallback } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const NotebooksContext = createContext()
export const useNotebooks = () => useContext(NotebooksContext)

export function NotebooksProvider({ children }) {
  const [notebooks, setNotebooks] = useState([])
  const [loading,   setLoading]   = useState(false)

  const fetchNotebooks = useCallback(async (search = '') => {
    try {
      const params = search ? { search } : {}
      const res = await axios.get('/notebooks', { params })
      setNotebooks(res.data.data)
    } catch (_) {}
  }, [])

  const createNotebook = async (data) => {
    try {
      const res = await axios.post('/notebooks', data)
      setNotebooks(prev => [res.data.data, ...prev])
      toast.success('Notebook created!')
      return res.data.data
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create notebook')
      throw err
    }
  }

  const updateNotebook = async (id, data) => {
    try {
      const res = await axios.put(`/notebooks/${id}`, data)
      setNotebooks(prev => prev.map(nb => nb._id === id ? { ...nb, ...res.data.data } : nb))
      toast.success('Notebook updated!')
      return res.data.data
    } catch (err) {
      toast.error('Failed to update notebook')
      throw err
    }
  }

  const deleteNotebook = async (id) => {
    try {
      await axios.delete(`/notebooks/${id}`)
      setNotebooks(prev => prev.filter(nb => nb._id !== id))
      toast.success('Notebook deleted. Notes were not affected.')
    } catch (_) {
      toast.error('Failed to delete notebook')
    }
  }

  const addNotesToNotebook = async (notebookId, noteIds) => {
    try {
      await axios.post(`/notebooks/${notebookId}/notes`, { noteIds })
      setNotebooks(prev => prev.map(nb =>
        nb._id === notebookId
          ? { ...nb, noteCount: (nb.noteCount || 0) + noteIds.length }
          : nb
      ))
      toast.success(`${noteIds.length} note${noteIds.length > 1 ? 's' : ''} added!`)
    } catch (_) {
      toast.error('Failed to add notes')
      throw _  // re-throw so caller can rollback optimistic update
    }
  }

  const removeNotesFromNotebook = async (notebookId, noteIds, onNotesRefresh) => {
    try {
      await axios.delete(`/notebooks/${notebookId}/notes`, { data: { noteIds } })
      // Update notebook count
      setNotebooks(prev => prev.map(nb =>
        nb._id === notebookId
          ? { ...nb, noteCount: Math.max(0, (nb.noteCount || 0) - noteIds.length) }
          : nb
      ))
      toast.success('Removed from notebook')
      // Refresh notes list so note.notebooks[] is up to date everywhere
      // (note cards 3-dots menu reads this to show ✓ Added)
      onNotesRefresh?.()
    } catch (_) {
      toast.error('Failed to remove notes')
    }
  }

  const getNotebookNotes = async (notebookId) => {
    setLoading(true)
    try {
      const res = await axios.get(`/notebooks/${notebookId}/notes`)
      return res.data
    } catch (_) {
      toast.error('Failed to load notebook notes')
      return { data: [], notebook: null }
    } finally {
      setLoading(false)
    }
  }

  return (
    <NotebooksContext.Provider value={{
      notebooks, loading,
      fetchNotebooks, createNotebook, updateNotebook, deleteNotebook,
      addNotesToNotebook, removeNotesFromNotebook, getNotebookNotes,
    }}>
      {children}
    </NotebooksContext.Provider>
  )
}