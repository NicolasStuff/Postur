import { useCallback, useRef } from "react"
import { ConsultationEditorRef } from "./Editor"

export function useModalEditorSync(
  editorContent: unknown,
  onEditorContentSync: (content: unknown) => void
) {
  const modalEditorRef = useRef<ConsultationEditorRef>(null)
  const modalEditorContentRef = useRef<unknown>(editorContent)

  const handleModalEditorChange = useCallback((content: unknown) => {
    modalEditorContentRef.current = content
  }, [])

  const syncAndClose = useCallback(() => {
    onEditorContentSync(modalEditorContentRef.current)
  }, [onEditorContentSync])

  return { modalEditorRef, handleModalEditorChange, syncAndClose }
}
