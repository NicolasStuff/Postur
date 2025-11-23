"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Edit2, Library, Check, X } from "lucide-react"
import { useState } from "react"

interface Advice {
    id: string
    category: string
    title: string
    description: string
    icon?: string
}

interface PHVBuilderProps {
    program: Advice[]
    onChange: (program: Advice[]) => void
}

const adviceLibrary: Advice[] = [
    {
        id: 'anti-inflam',
        category: 'Alimentation',
        title: 'Alimentation Anti-inflammatoire',
        description: 'Privilégier les aliments riches en oméga-3, éviter les aliments transformés',
        icon: '🥗'
    },
    {
        id: 'hydration',
        category: 'Alimentation',
        title: 'Hydratation Optimale',
        description: 'Boire 1.5L à 2L d\'eau par jour, en dehors des repas',
        icon: '💧'
    },
    {
        id: 'stress-mgmt',
        category: 'Gestion du Stress',
        title: 'Techniques de Gestion du Stress',
        description: 'Cohérence cardiaque 3x/jour, méditation quotidienne',
        icon: '🧘'
    },
    {
        id: 'sleep',
        category: 'Sommeil',
        title: 'Sommeil Réparateur',
        description: 'Coucher avant 23h, éviter les écrans 1h avant le coucher',
        icon: '😴'
    },
    {
        id: 'detox-foie',
        category: 'Détoxification',
        title: 'Détox Foie',
        description: 'Cure de radis noir et artichaut pendant 3 semaines',
        icon: '🌿'
    },
    {
        id: 'exercise',
        category: 'Activité Physique',
        title: 'Exercice Régulier',
        description: '30 minutes d\'activité modérée par jour, 5 jours par semaine',
        icon: '🏃'
    },
    {
        id: 'probiotic',
        category: 'Microbiote',
        title: 'Renforcement du Microbiote',
        description: 'Probiotiques et aliments fermentés quotidiens',
        icon: '🦠'
    },
    {
        id: 'vitamin-d',
        category: 'Compléments',
        title: 'Vitamine D',
        description: 'Supplémentation en vitamine D3 en période hivernale',
        icon: '☀️'
    }
]

export function PHVBuilder({ program, onChange }: PHVBuilderProps) {
    const [showLibrary, setShowLibrary] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<Advice | null>(null)

    const addAdvice = (advice: Advice) => {
        const newAdvice = {
            ...advice,
            id: `${advice.id}-${Date.now()}` // Ensure unique ID
        }
        onChange([...program, newAdvice])
        setShowLibrary(false)
    }

    const removeAdvice = (id: string) => {
        onChange(program.filter(a => a.id !== id))
    }

    const startEdit = (advice: Advice) => {
        setEditingId(advice.id)
        setEditForm({ ...advice })
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditForm(null)
    }

    const saveEdit = () => {
        if (editForm) {
            onChange(program.map(a => a.id === editingId ? editForm : a))
            setEditingId(null)
            setEditForm(null)
        }
    }

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="px-4 py-3 border-b bg-slate-50/50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-700">Programme d'Hygiène Vitale</h3>
                    <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                        {program.length} conseil{program.length > 1 ? 's' : ''}
                    </span>
                </div>
                <Sheet open={showLibrary} onOpenChange={setShowLibrary}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                            <Library className="h-3.5 w-3.5 mr-1.5" />
                            Bibliothèque
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[500px] sm:max-w-[500px]">
                        <SheetHeader>
                            <SheetTitle>Bibliothèque de Conseils</SheetTitle>
                        </SheetHeader>
                        <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                            <div className="pr-4 pb-4">
                                {Object.entries(
                                    adviceLibrary.reduce((acc, advice) => {
                                        if (!acc[advice.category]) acc[advice.category] = []
                                        acc[advice.category].push(advice)
                                        return acc
                                    }, {} as Record<string, Advice[]>)
                                ).map(([category, advices]) => (
                                    <div key={category} className="mb-6">
                                        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 px-1">
                                            {category}
                                        </h3>
                                        <div className="space-y-2">
                                            {advices.map((advice) => (
                                                <button
                                                    key={advice.id}
                                                    onClick={() => addAdvice(advice)}
                                                    className="w-full text-left group"
                                                >
                                                    <div className="p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all">
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 shrink-0">
                                                                <span className="text-xl">{advice.icon}</span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-sm font-semibold text-slate-900 mb-1 group-hover:text-slate-700">
                                                                    {advice.title}
                                                                </h4>
                                                                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                                                                    {advice.description}
                                                                </p>
                                                            </div>
                                                            <Plus className="h-4 w-4 text-slate-400 group-hover:text-slate-600 shrink-0 mt-1 transition-colors" />
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Program Content */}
            <ScrollArea className="flex-1 p-4">
                {program.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                            <Library className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">
                            Programme vide
                        </h3>
                        <p className="text-sm text-slate-500 mb-6 max-w-md">
                            Commencez à construire le Programme d'Hygiène Vitale en ajoutant des conseils depuis la bibliothèque
                        </p>
                        <Button onClick={() => setShowLibrary(true)} size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter un conseil
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2 max-w-4xl mx-auto">
                        {program.map((advice, index) => (
                            <Card
                                key={advice.id}
                                className="hover:shadow-sm transition-shadow"
                            >
                                {editingId === advice.id ? (
                                    // Edit Mode
                                    <div className="p-4 space-y-3">
                                        <div className="space-y-2">
                                            <Label className="text-xs">Titre</Label>
                                            <Input
                                                value={editForm?.title || ''}
                                                onChange={(e) => setEditForm(editForm ? { ...editForm, title: e.target.value } : null)}
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">Description</Label>
                                            <Textarea
                                                value={editForm?.description || ''}
                                                onChange={(e) => setEditForm(editForm ? { ...editForm, description: e.target.value } : null)}
                                                className="text-sm"
                                                rows={3}
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={cancelEdit} className="h-7 text-xs">
                                                <X className="h-3 w-3 mr-1" />
                                                Annuler
                                            </Button>
                                            <Button size="sm" onClick={saveEdit} className="h-7 text-xs">
                                                <Check className="h-3 w-3 mr-1" />
                                                Enregistrer
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    // View Mode
                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3 flex-1">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 shrink-0">
                                                    <span className="text-sm font-semibold text-slate-600">{index + 1}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-semibold text-slate-900 mb-1">
                                                        {advice.title}
                                                    </h4>
                                                    <p className="text-sm text-slate-600 leading-relaxed">{advice.description}</p>
                                                    <div className="mt-2">
                                                        <span className="inline-flex items-center text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                                                            {advice.category}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => startEdit(advice)}
                                                >
                                                    <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                                    onClick={() => removeAdvice(advice.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    )
}
