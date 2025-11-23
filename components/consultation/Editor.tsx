"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Button } from '@/components/ui/button'
import { Bold, Italic, List } from 'lucide-react'
import { useEffect } from 'react'

interface ConsultationEditorProps {
    initialContent?: any
    onChange?: (content: any) => void
}

export function ConsultationEditor({ initialContent, onChange }: ConsultationEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent || '<p></p>',
    immediatelyRender: false,
    editorProps: {
        attributes: {
            class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[200px] p-4'
        }
    },
    onUpdate: ({ editor }) => {
        onChange?.(editor.getJSON())
    }
  })

  // Update content if initialContent changes significantly (optional, tricky with Tiptap to avoid loops)
  // For now, we assume initialContent is loaded once.

  if (!editor) {
    return null
  }

  return (
    <div className="border rounded-lg flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center gap-1 border-b p-2 bg-muted/30">
            <Button 
                variant="ghost" size="icon" 
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? 'bg-muted' : ''}
            >
                <Bold className="h-4 w-4" />
            </Button>
            <Button 
                variant="ghost" size="icon" 
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? 'bg-muted' : ''}
            >
                <Italic className="h-4 w-4" />
            </Button>
             <Button 
                variant="ghost" size="icon" 
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? 'bg-muted' : ''}
            >
                <List className="h-4 w-4" />
            </Button>
        </div>
        
        {/* Content */}
        <EditorContent editor={editor} className="flex-1 overflow-auto" />
    </div>
  )
}