"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Button } from '@/components/ui/button'
import { Bold, Italic, List, ListOrdered, Strikethrough, Undo, Redo } from 'lucide-react'
import { cn } from '@/lib/utils'
import { forwardRef, useImperativeHandle } from 'react'
import { useTranslations } from 'next-intl'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ConsultationEditorProps {
    initialContent?: unknown
    onChange?: (content: unknown) => void
}

export interface ConsultationEditorRef {
    insertText: (text: string) => void
    setContent: (content: Parameters<ReturnType<typeof useEditor>['commands']['setContent']>[0]) => void
}

export const ConsultationEditor = forwardRef<ConsultationEditorRef, ConsultationEditorProps>(
  function ConsultationEditor({ initialContent, onChange }, ref) {
  const t = useTranslations('consultation.shared.editor')

  const formatTextForInsertion = (text: string) => {
    const escapeHtml = (value: string) =>
      value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")

    return text
      .trim()
      .split(/\n{2,}/)
      .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br/>")}</p>`)
      .join("")
  }

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent || '<p></p>',
    immediatelyRender: false,
    editorProps: {
        attributes: {
            class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[300px] p-4'
        }
    },
    onUpdate: ({ editor }) => {
        onChange?.(editor.getJSON())
    }
  })

  useImperativeHandle(ref, () => ({
    insertText: (text: string) => {
      if (editor) {
        editor.chain().focus().insertContent(formatTextForInsertion(text)).run()
      }
    },
    setContent: (content: unknown) => {
      if (editor) {
        editor.commands.setContent(content as Parameters<typeof editor.commands.setContent>[0] || '<p></p>')
      }
    },
  }), [editor])

  if (!editor) {
    return null
  }

  return (
    <div className="flex flex-col h-full">
        {/* Toolbar */}
        <TooltipProvider>
          <div className="flex items-center gap-1 border-b p-3 bg-white shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                    variant="ghost" size="icon"
                    className={cn("h-8 w-8", editor.isActive('bold') && "bg-slate-100 text-slate-900")}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={!editor.can().chain().focus().toggleBold().run()}
                >
                    <Bold className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('bold')}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                    variant="ghost" size="icon"
                    className={cn("h-8 w-8", editor.isActive('italic') && "bg-slate-100 text-slate-900")}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={!editor.can().chain().focus().toggleItalic().run()}
                >
                    <Italic className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('italic')}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                    variant="ghost" size="icon"
                    className={cn("h-8 w-8", editor.isActive('strike') && "bg-slate-100 text-slate-900")}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    disabled={!editor.can().chain().focus().toggleStrike().run()}
                >
                    <Strikethrough className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('strikethrough')}</TooltipContent>
            </Tooltip>

            <div className="w-px h-6 bg-slate-200 mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                    variant="ghost" size="icon"
                    className={cn("h-8 w-8", editor.isActive('bulletList') && "bg-slate-100 text-slate-900")}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                    <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('bulletList')}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                    variant="ghost" size="icon"
                    className={cn("h-8 w-8", editor.isActive('orderedList') && "bg-slate-100 text-slate-900")}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                    <ListOrdered className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('orderedList')}</TooltipContent>
            </Tooltip>

            <div className="w-px h-6 bg-slate-200 mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                    variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().chain().focus().undo().run()}
                >
                    <Undo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('undo')}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                    variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().chain().focus().redo().run()}
                >
                    <Redo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('redo')}</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Content */}
        <EditorContent editor={editor} className="flex-1 min-h-0 overflow-auto px-4" />
    </div>
  )
})
