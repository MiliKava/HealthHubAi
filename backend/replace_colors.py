import os
import glob

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # We want to map standard blue/indigo tailwind colors to rose/red
    # indigo -> rose
    # blue -> red
    # sky -> pink
    # emerald -> teal (to keep a secondary color that matches red well, maybe leave emerald as is, or change to a warmer tone? Red + Emerald is fine for success/medical, or change emerald to orange? Let's leave emerald alone for success states, but change the main theme)
    
    replacements = {
        "indigo-": "rose-",
        "blue-": "red-",
        "sky-": "pink-"
    }

    new_content = content
    for old, new in replacements.items():
        new_content = new_content.replace(old, new)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

# Find all tsx files
tsx_files = glob.glob("../frontend/src/**/*.tsx", recursive=True)
for file in tsx_files:
    replace_in_file(file)

print("Done replacing colors!")
