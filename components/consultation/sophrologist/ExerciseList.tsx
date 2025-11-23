"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, Check } from "lucide-react"
import { useState } from "react"

interface ExerciseData {
    name: string
    duration: number
    completed: boolean
}

interface ExerciseListProps {
    exercises: ExerciseData[]
    onAdd: (exercise: ExerciseData) => void
    onUpdate: (index: number, exercise: ExerciseData) => void
    onRemove: (index: number) => void
}

const COMMON_EXERCISES = [
    "Respiration abdominale",
    "Relaxation dynamique RD1",
    "Relaxation dynamique RD2",
    "Relaxation dynamique RD3",
    "Sophronisation de base",
    "Sophro-acceptation progressive",
    "Sophro-déplacement du négatif",
    "Sophro-substitution sensorielle",
    "Sophro-présence du positif",
    "Exercice de futurisation",
    "Scan corporel",
    "Visualisation positive"
]

export function ExerciseList({ exercises, onAdd, onUpdate, onRemove }: ExerciseListProps) {
    const [showAddForm, setShowAddForm] = useState(false)
    const [newExerciseName, setNewExerciseName] = useState("")
    const [newExerciseDuration, setNewExerciseDuration] = useState(10)
    const [useCustomName, setUseCustomName] = useState(false)
    const [customName, setCustomName] = useState("")

    const handleAddExercise = () => {
        const exerciseName = useCustomName ? customName : newExerciseName

        if (!exerciseName) return

        onAdd({
            name: exerciseName,
            duration: newExerciseDuration,
            completed: false
        })

        // Reset form
        setNewExerciseName("")
        setCustomName("")
        setNewExerciseDuration(10)
        setShowAddForm(false)
        setUseCustomName(false)
    }

    const handleToggleCompleted = (index: number) => {
        const exercise = exercises[index]
        onUpdate(index, {
            ...exercise,
            completed: !exercise.completed
        })
    }

    const totalDuration = exercises.reduce((sum, ex) => sum + ex.duration, 0)
    const completedCount = exercises.filter(ex => ex.completed).length

    return (
        <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-4 border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base font-bold text-slate-900">
                            Exercices de la Séance
                        </CardTitle>
                        <p className="text-sm text-slate-500 mt-1">
                            {exercises.length} exercice{exercises.length !== 1 ? 's' : ''} • {totalDuration} min total
                            {exercises.length > 0 && ` • ${completedCount}/${exercises.length} complété${completedCount !== 1 ? 's' : ''}`}
                        </p>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => setShowAddForm(!showAddForm)}
                        variant={showAddForm ? "outline" : "default"}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                {/* Add Exercise Form */}
                {showAddForm && (
                    <div className="p-4 border rounded-lg bg-blue-50 border-blue-200 space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="custom-exercise"
                                    checked={useCustomName}
                                    onCheckedChange={(checked) => setUseCustomName(checked as boolean)}
                                />
                                <Label htmlFor="custom-exercise" className="text-sm cursor-pointer">
                                    Exercice personnalisé
                                </Label>
                            </div>

                            {useCustomName ? (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Nom de l'exercice</Label>
                                    <Input
                                        value={customName}
                                        onChange={(e) => setCustomName(e.target.value)}
                                        placeholder="Nom de l'exercice personnalisé..."
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Exercice</Label>
                                    <Select value={newExerciseName} onValueChange={setNewExerciseName}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner un exercice..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {COMMON_EXERCISES.map((exercise) => (
                                                <SelectItem key={exercise} value={exercise}>
                                                    {exercise}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Durée (minutes)</Label>
                                <Input
                                    type="number"
                                    value={newExerciseDuration}
                                    onChange={(e) => setNewExerciseDuration(parseInt(e.target.value) || 0)}
                                    min={1}
                                    max={60}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button size="sm" onClick={handleAddExercise}>
                                <Plus className="h-4 w-4 mr-2" />
                                Ajouter l'exercice
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    setShowAddForm(false)
                                    setNewExerciseName("")
                                    setCustomName("")
                                    setUseCustomName(false)
                                }}
                            >
                                Annuler
                            </Button>
                        </div>
                    </div>
                )}

                {/* Exercise List */}
                {exercises.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        <p className="text-sm">Aucun exercice ajouté pour cette séance</p>
                        <p className="text-xs mt-1">Cliquez sur "Ajouter" pour commencer</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {exercises.map((exercise, index) => (
                            <div
                                key={index}
                                className={`group flex items-center gap-3 p-3 border rounded-lg transition-all ${
                                    exercise.completed
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <div
                                    className="flex items-center justify-center w-6 h-6 rounded border-2 cursor-pointer transition-all"
                                    onClick={() => handleToggleCompleted(index)}
                                >
                                    {exercise.completed && (
                                        <Check className="h-4 w-4 text-green-600" />
                                    )}
                                </div>

                                <div className="flex-1">
                                    <p className={`font-medium ${
                                        exercise.completed ? 'text-green-900 line-through' : 'text-slate-900'
                                    }`}>
                                        {exercise.name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {exercise.duration} minute{exercise.duration !== 1 ? 's' : ''}
                                    </p>
                                </div>

                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => onRemove(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Summary */}
                {exercises.length > 0 && (
                    <div className="pt-4 border-t">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-medium text-slate-700">Durée totale de la séance</span>
                            <span className="text-lg font-bold text-slate-900">{totalDuration} min</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
