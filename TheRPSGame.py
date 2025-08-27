import random


    
def getchoice():
    options = ['rock', 'paper', 'scissors']
    user_choice = input("Enter rock, paper, or scissors: ").lower()
    while user_choice not in options:
        user_choice = input("Invalid choice. Please enter rock, paper, or scissors: ").lower()
    computer_choice = random.choice(options)
    choices = {'user': user_choice, 'computer': computer_choice} #Using dictionary to store choices
    return choices

#Function to determine the winner

def check_win(userchoice, computerchoice):  #taking user and computer choices as parameters
    print(f"You chose: {userchoice}" and f"Computer chose: {computerchoice}") 

#Checking for win conditions
    if userchoice == computerchoice:
        return "It's a tie!"
    
    elif userchoice == 'rock':
        if computerchoice == 'scissors':
            return "Rock smashes scissors, You win!"
        else:
            return "Paper covers rock, You lose."
        
    elif userchoice == 'paper':
        if computerchoice == 'rock':
            return "Paper covers rock, You win!"
        else:
            return "Scissors cut paper, You lose."

    elif userchoice == 'scissors':
        if computerchoice == 'paper':
            return "Scissors cut paper, You win!"
        else:
            return "Rock smashes scissors, You lose."
        
def play_game():  
    #Main game loop      
    while True:
        choices = getchoice()
        result = check_win(choices['user'], choices['computer'])   #Using dictionary to access user and computer choices 
        print(result)

        play_again = input("Do you want to play again? (yes/no): ").lower()
        if play_again != 'yes':
            print("Thanks for playing!")
            break
        
play_game()