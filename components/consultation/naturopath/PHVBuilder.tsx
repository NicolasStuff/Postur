"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Edit2, FileDown, Library, GripVertical, Check, X } from "lucide-react"
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

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            'Alimentation': 'border-l-orange-500',
            'Gestion du Stress': 'border-l-purple-500',
            'Sommeil': 'border-l-indigo-500',
            'Détoxification': 'border-l-green-500',
            'Activité Physique': 'border-l-emerald-500',
            'Microbiote': 'border-l-pink-500',
            'Compléments': 'border-l-yellow-500'
        }
        return colors[category] || 'border-l-slate-500'
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
                <div className="flex items-center gap-2">
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
                                <div className="space-y-3 pr-4">
                                    {adviceLibrary.map((advice) => (
                                        <Card
                                            key={advice.id}
                                            className={`p-3 border-l-4 ${getCategoryColor(advice.category)} cursor-pointer hover:shadow-md transition-shadow`}
                                            onClick={() => addAdvice(advice)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="text-2xl">{advice.icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <h4 className="text-sm font-semibold text-slate-800">{advice.title}</h4>
                                                        <Plus className="h-4 w-4 text-slate-400 shrink-0" />
                                                    </div>
                                                    <p className="text-xs text-slate-600 mb-1">{advice.description}</p>
                                                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                                        {advice.category}
                                                    </span>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </ScrollArea>
                        </SheetContent>
                    </Sheet>

                    <Button variant="outline" size="sm" className="h-8 text-xs">
                        <FileDown className="h-3.5 w-3.5 mr-1.5" />
                        Générer PDF
                    </Button>
                </div>
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
                    <div className="space-y-3 max-w-3xl mx-auto">
                        {program.map((advice, index) => (
                            <Card
                                key={advice.id}
                                className={`border-l-4 ${getCategoryColor(advice.category)} overflow-hidden`}
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
                                        <div className="flex items-start gap-3">
                                            <div className="flex items-center gap-2 shrink-0">
                                                <GripVertical className="h-4 w-4 text-slate-400 cursor-move" />
                                                <span className="text-2xl">{advice.icon}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-semibold text-slate-800 mb-1">
                                                            {index + 1}. {advice.title}
                                                        </h4>
                                                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                                            {advice.category}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-1 shrink-0">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0"
                                                            onClick={() => startEdit(advice)}
                                                        >
                                                            <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                                                            onClick={() => removeAdvice(advice.id)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-slate-600 mt-2">{advice.description}</p>
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
