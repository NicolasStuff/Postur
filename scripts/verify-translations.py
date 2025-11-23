#!/usr/bin/env python3
"""
Script de vérification de synchronisation entre en.json et fr.json
Usage: python3 scripts/verify-translations.py
"""

import json
import sys
from pathlib import Path

def get_all_leaf_keys(obj, prefix=''):
    """Récupère toutes les clés terminales (chaînes traduisibles) récursivement."""
    keys = {}
    for key, value in obj.items():
        full_key = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            keys.update(get_all_leaf_keys(value, full_key))
        else:
            keys[full_key] = value
    return keys

def main():
    # Chemins des fichiers
    base_path = Path(__file__).parent.parent
    en_path = base_path / "messages" / "en.json"
    fr_path = base_path / "messages" / "fr.json"
    
    # Charger les fichiers
    try:
        with open(en_path, 'r', encoding='utf-8') as f:
            en = json.load(f)
        print(f"✓ {en_path} chargé avec succès")
    except Exception as e:
        print(f"✗ Erreur lors du chargement de {en_path}: {e}")
        return 1
    
    try:
        with open(fr_path, 'r', encoding='utf-8') as f:
            fr = json.load(f)
        print(f"✓ {fr_path} chargé avec succès")
    except Exception as e:
        print(f"✗ Erreur lors du chargement de {fr_path}: {e}")
        return 1
    
    print()
    
    # Extraire les clés
    en_keys = get_all_leaf_keys(en)
    fr_keys = get_all_leaf_keys(fr)
    
    # Trouver les clés manquantes
    missing_in_fr = {}
    for key, value in en_keys.items():
        if key not in fr_keys:
            missing_in_fr[key] = value
    
    # Afficher le résumé
    print("="*70)
    print("RAPPORT DE VÉRIFICATION DES TRADUCTIONS")
    print("="*70)
    print(f"Clés totales EN: {len(en_keys)}")
    print(f"Clés totales FR: {len(fr_keys)}")
    print(f"Clés manquantes dans FR: {len(missing_in_fr)}")
    print(f"Clés additionnelles dans FR: {len(fr_keys) - len(en_keys)}")
    print()
    
    if len(missing_in_fr) == 0:
        print("✓ SUCCÈS: Tous les textes de en.json sont traduits dans fr.json")
        print()
        return 0
    else:
        print("✗ ERREUR: Certaines clés de en.json ne sont pas traduites dans fr.json")
        print()
        print("Clés manquantes:")
        for key, value in sorted(missing_in_fr.items()):
            print(f"  {key}")
            print(f"    EN: {value}")
        print()
        return 1

if __name__ == "__main__":
    sys.exit(main())
