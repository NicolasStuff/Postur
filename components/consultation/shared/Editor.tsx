"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Button } from '@/components/ui/button'
import { Bold, Italic, List, ListOrdered, Strikethrough, Undo, Redo } from 'lucide-react'
import { cn } from '@/lib/utils'
import { forwardRef, useImperativeHandle } from 'react'

interface ConsultationEditorProps {
    initialContent?: any
    onChange?: (content: any) => void
}

export interface ConsultationEditorRef {
    insertText: (text: string) => void
}

export const ConsultationEditor = forwardRef<ConsultationEditorRef, ConsultationEditorProps>(
  function ConsultationEditor({ initialContent, onChange }, ref) {
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
        editor.chain().focus().insertContent(` ${text} `).run()
      }
    }
  }), [editor])

  if (!editor) {
    return null
  }

  return (
    <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center gap-1 border-b p-3 bg-white shrink-0">
            <Button
                variant="ghost" size="icon"
                className={cn("h-8 w-8", editor.isActive('bold') && "bg-slate-100 text-slate-900")}
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
            >
                <Bold className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost" size="icon"
                className={cn("h-8 w-8", editor.isActive('italic') && "bg-slate-100 text-slate-900")}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
            >
                <Italic className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost" size="icon"
                className={cn("h-8 w-8", editor.isActive('strike') && "bg-slate-100 text-slate-900")}
                onClick={() => editor.chain().focus().toggleStrike().run()}
                disabled={!editor.can().chain().focus().toggleStrike().run()}
            >
                <Strikethrough className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-slate-200 mx-1" />
            <Button
                variant="ghost" size="icon"
                className={cn("h-8 w-8", editor.isActive('bulletList') && "bg-slate-100 text-slate-900")}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
                <List className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost" size="icon"
                className={cn("h-8 w-8", editor.isActive('orderedList') && "bg-slate-100 text-slate-900")}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
                <ListOrdered className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-slate-200 mx-1" />
            <Button
                variant="ghost" size="icon" className="h-8 w-8"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().chain().focus().undo().run()}
            >
                <Undo className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost" size="icon" className="h-8 w-8"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().chain().focus().redo().run()}
            >
                <Redo className="h-4 w-4" />
            </Button>
        </div>

        {/* Content */}
        <EditorContent editor={editor} className="flex-1 min-h-0 overflow-auto px-4" />
    </div>
  )
})