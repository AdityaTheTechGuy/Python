# # import argparse

# # class CharacterProfile : 
# #     def __init__(self, name , race, char_class, level):
# #         self.name = name
# #         self.race = race
# #         self.char_class = char_class
# #         self.level = level

# #     def display_profile(self):
# #         print("\n--- CHARACTER PROFILE ---")
# #         print(f"Name:  {self.name}")
# #         print(f"Race:  {self.race}")
# #         print(f"Class: {self.char_class}")
# #         print(f"Level: {self.level}")
# #         print("-----------------------")

# # parser = argparse.ArgumentParser(description="Create a character profile for an RPG game.")
# # parser.add_argument('name', type=str, help="Name of the character")
# # parser.add_argument('race', type = str, choices=['Human', 'Elf', 'Dwarf', 'Orc'], help= "Choose a race for your character")    
# # parser.add_argument('char_class', type = str, choices=['Warrior', 'Mage', 'Rogue', 'Cleric'], help= "Choose a class for your character")
# # parser.add_argument('--level', type=int, default=1, help="Level of the character (default is 1)")

# # args = parser.parse_args()
# # Character = CharacterProfile(args.name, args.race, args.char_class, args.level)
# # Character.display_profile()
        

# def logtime(func):

#     def wrapper():
#         print("before")
#         val = func()
#         print("after")
#         return val
#     return wrapper

# @logtime
# def hello():
#     print("Hello World")
    
# hello()


# def set_age(age):
#     if age < 0:
#         # Create and raise an exception if the input is invalid.
#         raise ValueError("Age cannot be negative.")
#     print(f"Age set to {age}")

# try:
#     set_age(25)  # This works
#     set_age(-5)  # This will raise the ValueError
# except ValueError as e:
#     print(f"Error: {e}") # Prints "Error: Age cannot be negative."