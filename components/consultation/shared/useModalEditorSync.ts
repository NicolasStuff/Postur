import { useCallback, useEffect, useRef } from "react"
import { ConsultationEditorRef } from "./Editor"

export function useModalEditorSync(
  isOpen: boolean,
  editorContent: unknown,
  onEditorContentSync: (content: unknown) => void
) {
  const modalEditorRef = useRef<ConsultationEditorRef>(null)
  const modalEditorContentRef = useRef<unknown>(editorContent)

  useEffect(() => {
    if (!isOpen) {
      modalEditorContentRef.current = editorContent
    }
  }, [editorContent, isOpen])

  const handleModalEditorChange = useCallback((content: unknown) => {
    modalEditorContentRef.current = content
  }, [])

  const syncAndClose = useCallback(() => {
    const latestModalContent = modalEditorRef.current?.getContent() ?? modalEditorContentRef.current
    modalEditorContentRef.current = latestModalContent
    onEditorContentSync(latestModalContent)
  }, [onEditorContentSync])

  return { modalEditorRef, handleModalEditorChange, syncAndClose }
}
