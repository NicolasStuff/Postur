"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Heart, Brain, Smile } from "lucide-react"

interface EmotionalStateData {
    stress: number
    anxiety: number
    wellbeing: number
    notes?: string
}

interface EmotionalStateTrackerProps {
    emotionalState: EmotionalStateData
    onChange: (state: EmotionalStateData) => void
}

export function EmotionalStateTracker({ emotionalState, onChange }: EmotionalStateTrackerProps) {
    const handleChange = (field: keyof EmotionalStateData, value: number | string) => {
        onChange({
            ...emotionalState,
            [field]: value
        })
    }

    const getColor = (value: number, inverse: boolean = false) => {
        if (inverse) {
            // For wellbeing: higher is better
            if (value >= 7) return "text-green-600"
            if (value >= 4) return "text-yellow-600"
            return "text-red-600"
        } else {
            // For stress/anxiety: lower is better
            if (value >= 7) return "text-red-600"
            if (value >= 4) return "text-yellow-600"
            return "text-green-600"
        }
    }

    const getProgressColor = (value: number, inverse: boolean = false) => {
        if (inverse) {
            if (value >= 7) return "bg-green-500"
            if (value >= 4) return "bg-yellow-500"
            return "bg-red-500"
        } else {
            if (value >= 7) return "bg-red-500"
            if (value >= 4) return "bg-yellow-500"
            return "bg-green-500"
        }
    }

    return (
        <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-4 border-b">
                <CardTitle className="text-base font-bold text-slate-900">
                    État Émotionnel
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                {/* Stress Level */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Brain className="h-5 w-5 text-slate-500" />
                            <Label className="text-sm font-medium">Niveau de Stress</Label>
                        </div>
                        <span className={`text-2xl font-bold ${getColor(emotionalState.stress)}`}>
                            {emotionalState.stress}/10
                        </span>
                    </div>
                    <div className="relative pt-2">
                        <Slider
                            value={[emotionalState.stress]}
                            onValueChange={(value) => handleChange('stress', value[0])}
                            min={0}
                            max={10}
                            step={1}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>Détendu</span>
                            <span>Très stressé</span>
                        </div>
                    </div>
                </div>

                {/* Anxiety Level */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Heart className="h-5 w-5 text-slate-500" />
                            <Label className="text-sm font-medium">Niveau d'Anxiété</Label>
                        </div>
                        <span className={`text-2xl font-bold ${getColor(emotionalState.anxiety)}`}>
                            {emotionalState.anxiety}/10
                        </span>
                    </div>
                    <div className="relative pt-2">
                        <Slider
                            value={[emotionalState.anxiety]}
                            onValueChange={(value) => handleChange('anxiety', value[0])}
                            min={0}
                            max={10}
                            step={1}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>Calme</span>
                            <span>Très anxieux</span>
                        </div>
                    </div>
                </div>

                {/* Wellbeing Level */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Smile className="h-5 w-5 text-slate-500" />
                            <Label className="text-sm font-medium">Niveau de Bien-être</Label>
                        </div>
                        <span className={`text-2xl font-bold ${getColor(emotionalState.wellbeing, true)}`}>
                            {emotionalState.wellbeing}/10
                        </span>
                    </div>
                    <div className="relative pt-2">
                        <Slider
                            value={[emotionalState.wellbeing]}
                            onValueChange={(value) => handleChange('wellbeing', value[0])}
                            min={0}
                            max={10}
                            step={1}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>Très mal</span>
                            <span>Excellent</span>
                        </div>
                    </div>
                </div>

                {/* Visual Summary */}
                <div className="pt-4 border-t">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg">
                            <Brain className={`h-8 w-8 mb-2 ${getColor(emotionalState.stress)}`} />
                            <span className="text-xs text-slate-500 mb-1">Stress</span>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all ${getProgressColor(emotionalState.stress)}`}
                                    style={{ width: `${(emotionalState.stress / 10) * 100}%` }}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg">
                            <Heart className={`h-8 w-8 mb-2 ${getColor(emotionalState.anxiety)}`} />
                            <span className="text-xs text-slate-500 mb-1">Anxiété</span>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all ${getProgressColor(emotionalState.anxiety)}`}
                                    style={{ width: `${(emotionalState.anxiety / 10) * 100}%` }}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg">
                            <Smile className={`h-8 w-8 mb-2 ${getColor(emotionalState.wellbeing, true)}`} />
                            <span className="text-xs text-slate-500 mb-1">Bien-être</span>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all ${getProgressColor(emotionalState.wellbeing, true)}`}
                                    style={{ width: `${(emotionalState.wellbeing / 10) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div className="space-y-2 pt-2 border-t">
                    <Label className="text-sm font-medium">Notes sur l'état émotionnel</Label>
                    <Textarea
                        value={emotionalState.notes || ""}
                        onChange={(e) => handleChange('notes', e.target.value)}
                        placeholder="Observations sur l'état émotionnel du patient..."
                        className="min-h-[80px]"
                    />
                </div>
            </CardContent>
        </Card>
    )
}
