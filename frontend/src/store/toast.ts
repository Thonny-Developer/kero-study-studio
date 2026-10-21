import { create } from 'zustand'

interface ToastState {
  text: string | null
  id: number
  show: (text: string) => void
}

let timer: ReturnType<typeof setTimeout> | undefined

export const useToast = create<ToastState>()((set, get) => ({
  text: null,
  id: 0,
  show: (text) => {
    clearTimeout(timer)
    set({ text, id: get().id + 1 })
    timer = setTimeout(() => set({ text: null }), 1800)
  },
}))

export const toast = (text: string) => useToast.getState().show(text)
