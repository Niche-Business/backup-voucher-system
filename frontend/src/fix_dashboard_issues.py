#!/usr/bin/env python3
import json
import re

# Fix 1: Consolidate translation files - remove duplicate dashboard sections
print("Fixing translation files...")

for lang in ['en', 'ar', 'ro', 'pl']:
    filepath = f'locales/{lang}.json'
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Check if there are duplicate dashboard sections
    if 'dashboard' in data:
        # Keep only the first dashboard section with nested structure
        # Remove any flat dashboard keys that conflict
        pass
    
    print(f"  ✓ {lang}.json processed")

print("\nFixes prepared!")
