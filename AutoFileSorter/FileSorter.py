import os
import shutil
from pathlib import Path

source_folder = Path(r"C:\Users\hp\Downloads")

file_types = {'Images': ['.jpeg', '.png', '.jpg', '.gif', '.jfif'],
              'Videos': ['.mp4', '.mkv', '.flv', '.avi', '.mov'],
              'Documents': ['.doc', '.docx', '.txt', '.xlsx', '.pptx'],
              'Setups': ['.exe', '.msi', '.dmg'],
              'PDFs': ['.pdf']
}

# List Files

for item in source_folder.iterdir():
    if item.is_file():
        print(item.name)
        
        
for item in source_folder.iterdir():
    if item.is_file():
        extension = item.suffix.lower()
        
        moved = False
        
        for folder_name, extensions in file_types.items():
            if extension in extensions:
                print(f'{item.name} belongs to {folder_name} folder')
                moved = True
                break
        if not moved:
            print(f'{item.name} belongs to Others')


for item in source_folder.iterdir():
    if item.is_file():
        extension = item.suffix.lower()
        
        moved = False
        
        for folder_name, extensions in file_types.items():
            if extension in extensions:
                target_folder = source_folder / folder_name
                target_folder.mkdir(exist_ok=True)
                shutil.move(str(item), str(target_folder / item.name))
                moved = True
                break
        if not moved:
            target_folder = source_folder / 'Others'
            target_folder.mkdir(exist_ok=True)
            shutil.move(str(item), str(target_folder / item.name))