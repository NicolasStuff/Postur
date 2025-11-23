"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Utensils, Moon, Activity, Heart, Brain, Apple } from "lucide-react"

interface AnamnesisFormProps {
    data: any
    onChange: (data: any) => void
}

export function AnamnesisForm({ data, onChange }: AnamnesisFormProps) {
    const updateField = (section: string, field: string, value: string) => {
        onChange({
            ...data,
            [section]: {
                ...(data[section] || {}),
                [field]: value
            }
        })
    }

    return (
        <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
                {/* Alimentation */}
                <div className="border-l-4 border-l-orange-500 pl-3">
                    <div className="flex items-center gap-2 mb-3">
                        <Utensils className="h-4 w-4 text-orange-600" />
                        <h3 className="text-sm font-semibold text-slate-800">Alimentation</h3>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <Label className="text-xs text-slate-600">Repas par jour</Label>
                            <Input
                                className="h-8 text-sm mt-1"
                                placeholder="Ex: 3 repas + 1 collation"
                                value={data.alimentation?.mealsPerDay || ''}
                                onChange={(e) => updateField('alimentation', 'mealsPerDay', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-slate-600">Intolérances</Label>
                            <Textarea
                                className="text-sm mt-1 resize-none"
                                placeholder="Gluten, lactose..."
                                value={data.alimentation?.intolerances || ''}
                                onChange={(e) => updateField('alimentation', 'intolerances', e.target.value)}
                                rows={2}
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-slate-600">Hydratation</Label>
                            <Input
                                className="h-8 text-sm mt-1"
                                placeholder="Ex: 1.5L/jour"
                                value={data.alimentation?.hydration || ''}
                                onChange={(e) => updateField('alimentation', 'hydration', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-slate-600">Habitudes</Label>
                            <Textarea
                                className="text-sm mt-1 resize-none"
                                placeholder="Bio, fait maison..."
                                value={data.alimentation?.habits || ''}
                                onChange={(e) => updateField('alimentation', 'habits', e.target.value)}
                                rows={2}
                            />
                        </div>
                    </div>
                </div>

                {/* Sommeil */}
                <div className="border-l-4 border-l-indigo-500 pl-3">
                    <div className="flex items-center gap-2 mb-3">
                        <Moon className="h-4 w-4 text-indigo-600" />
                        <h3 className="text-sm font-semibold text-slate-800">Sommeil</h3>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <Label className="text-xs text-slate-600">Heures de sommeil</Label>
                            <Input
                                className="h-8 text-sm mt-1"
                                placeholder="Ex: 7h"
                                value={data.sommeil?.hours || ''}
                                onChange={(e) => updateField('sommeil', 'hours', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-slate-600">Qualité du réveil</Label>
                            <Input
                                className="h-8 text-sm mt-1"
                                placeholder="Fatigué, en forme..."
                                value={data.sommeil?.wakeQuality || ''}
                                onChange={(e) => updateField('sommeil', 'wakeQuality', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-slate-600">Difficultés</Label>
                            <Textarea
                                className="text-sm mt-1 resize-none"
                                placeholder="Insomnies, réveils..."
                                value={data.sommeil?.difficulties || ''}
                                onChange={(e) => updateField('sommeil', 'difficulties', e.target.value)}
                                rows={2}
                            />
                        </div>
                    </div>
                </div>

                {/* Activité physique */}
                <div className="border-l-4 border-l-green-500 pl-3">
                    <div className="flex items-center gap-2 mb-3">
                        <Activity className="h-4 w-4 text-green-600" />
                        <h3 className="text-sm font-semibold text-slate-800">Activité Physique</h3>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <Label className="text-xs text-slate-600">Fréquence et type</Label>
                            <Textarea
                                className="text-sm mt-1 resize-none"
                                placeholder="Course 3x/semaine..."
                                value={data.activite?.frequency || ''}
                                onChange={(e) => updateField('activite', 'frequency', e.target.value)}
                                rows={2}
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-slate-600">Sédentarité</Label>
                            <Input
                                className="h-8 text-sm mt-1"
                                placeholder="Bureau 8h/jour"
                                value={data.activite?.sedentary || ''}
                                onChange={(e) => updateField('activite', 'sedentary', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Gestion du stress */}
                <div className="border-l-4 border-l-purple-500 pl-3">
                    <div className="flex items-center gap-2 mb-3">
                        <Brain className="h-4 w-4 text-purple-600" />
                        <h3 className="text-sm font-semibold text-slate-800">Gestion du Stress</h3>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <Label className="text-xs text-slate-600">Niveau de stress</Label>
                            <Input
                                className="h-8 text-sm mt-1"
                                placeholder="Élevé, modéré..."
                                value={data.stress?.level || ''}
                                onChange={(e) => updateField('stress', 'level', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-slate-600">Sources</Label>
                            <Textarea
                                className="text-sm mt-1 resize-none"
                                placeholder="Travail, famille..."
                                value={data.stress?.sources || ''}
                                onChange={(e) => updateField('stress', 'sources', e.target.value)}
                                rows={2}
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-slate-600">Techniques pratiquées</Label>
                            <Textarea
                                className="text-sm mt-1 resize-none"
                                placeholder="Méditation, respiration..."
                                value={data.stress?.techniques || ''}
                                onChange={(e) => updateField('stress', 'techniques', e.target.value)}
                                rows={2}
                            />
                        </div>
                    </div>
                </div>

                {/* Santé générale */}
                <div className="border-l-4 border-l-red-500 pl-3">
                    <div className="flex items-center gap-2 mb-3">
                        <Heart className="h-4 w-4 text-red-600" />
                        <h3 className="text-sm font-semibold text-slate-800">Santé Générale</h3>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <Label className="text-xs text-slate-600">Antécédents médicaux</Label>
                            <Textarea
                                className="text-sm mt-1 resize-none"
                                placeholder="Maladies, opérations..."
                                value={data.sante?.medicalHistory || ''}
                                onChange={(e) => updateField('sante', 'medicalHistory', e.target.value)}
                                rows={2}
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-slate-600">Traitements en cours</Label>
                            <Textarea
                                className="text-sm mt-1 resize-none"
                                placeholder="Médicaments, compléments..."
                                value={data.sante?.currentTreatments || ''}
                                onChange={(e) => updateField('sante', 'currentTreatments', e.target.value)}
                                rows={2}
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-slate-600">Symptômes actuels</Label>
                            <Textarea
                                className="text-sm mt-1 resize-none"
                                placeholder="Fatigue, douleurs..."
                                value={data.sante?.symptoms || ''}
                                onChange={(e) => updateField('sante', 'symptoms', e.target.value)}
                                rows={2}
                            />
                        </div>
                    </div>
                </div>

                {/* Objectifs */}
                <div className="border-l-4 border-l-blue-500 pl-3">
                    <div className="flex items-center gap-2 mb-3">
                        <Apple className="h-4 w-4 text-blue-600" />
                        <h3 className="text-sm font-semibold text-slate-800">Objectifs de Santé</h3>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <Label className="text-xs text-slate-600">Objectifs souhaités</Label>
                            <Textarea
                                className="text-sm mt-1 resize-none"
                                placeholder="Énergie, poids, digestion..."
                                value={data.objectifs?.goals || ''}
                                onChange={(e) => updateField('objectifs', 'goals', e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </ScrollArea>
    )
}
