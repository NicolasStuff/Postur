# Fichiers de traduction

Ce dossier contient les fichiers de traduction pour l'application postur.

## Fichiers

- `en.json` - Traductions anglaises (309 clés)
- `fr.json` - Traductions françaises (512 clés)

## Statut de synchronisation

✓ **SYNCHRONISÉ** - Tous les textes de `en.json` sont traduits dans `fr.json`

### Détails

| Section               | EN  | FR  | Statut |
| --------------------- | --- | --- | ------ |
| Consultation partagée | 20  | 20  | ✓      |
| Réservation publique  | 42  | 42  | ✓      |
| Calendrier            | 22  | 22  | ✓      |
| Rendez-vous           | 8   | 8   | ✓      |
| Patients              | 17  | 17  | ✓      |
| Facturation           | 20  | 20  | ✓      |
| Tableau de bord       | 83  | 103 | ✓      |
| Commun                | 51  | 51  | ✓      |
| Authentification      | 17  | 17  | ✓      |
| Erreurs               | 29  | 29  | ✓      |

### Fonctionnalités additionnelles dans FR

Le fichier français contient 203 clés supplémentaires pour des fonctionnalités étendues :

- **Consultation Ostéopathe** (~99 clés)

  - Schéma corporel (anterior/posterior)
  - Timeline traumatique
  - Historique des sélections
  - Notes rapides

- **Consultation Naturopathe** (~84 clés)
  - Questionnaire d'anamnèse
  - Programme d'Hygiène Vitale (PHV)
  - Bibliothèque de conseils

## Vérification

Pour vérifier la synchronisation des traductions :

```bash
python3 scripts/verify-translations.py
```

Ce script vérifie que toutes les clés présentes dans `en.json` sont également présentes dans `fr.json`.

## Structure

Les fichiers de traduction utilisent une structure JSON imbriquée :

```json
{
  "section": {
    "subsection": {
      "key": "Texte traduit"
    }
  }
}
```

## Utilisation dans le code

Les traductions sont accessibles via le système i18n de l'application :

```typescript
import { useTranslations } from "next-intl";

const t = useTranslations("section.subsection");
const text = t("key"); // Retourne "Texte traduit"
```

## Ajout de nouvelles traductions

1. Ajouter la clé dans `en.json`
2. Ajouter la traduction dans `fr.json`
3. Exécuter `python3 scripts/verify-translations.py` pour vérifier

## Dernière vérification

Date : 2025-11-23
Résultat : ✓ SYNCHRONISÉ (0 clés manquantes)
