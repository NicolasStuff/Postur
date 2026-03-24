"use client"

import { useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { Loader2 } from "lucide-react"

import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`

export function PdfViewer({ url }: { url: string }) {
  const [numPages, setNumPages] = useState<number>(0)

  return (
    <div className="flex flex-1 flex-col items-center gap-4 overflow-y-auto bg-muted/30 p-4">
      <Document
        file={url}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        }
        error={
          <div className="py-20 text-center text-sm text-muted-foreground">
            Impossible de charger le PDF.
          </div>
        }
      >
        {Array.from({ length: numPages }, (_, index) => (
          <Page
            key={index}
            pageNumber={index + 1}
            className="mb-4 overflow-hidden rounded-lg shadow-sm last:mb-0"
            width={560}
            renderAnnotationLayer={false}
            renderTextLayer={false}
          />
        ))}
      </Document>
    </div>
  )
}
