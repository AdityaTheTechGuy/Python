# The Black Jack Game

import random

class Deck:
    def __init__(self):
    
        self.cards = []
        suits = ["Hearts", "Diamonds", "Spades", "Clubs"]
        ranks = [{"rank": "A" , "value": 11}
                ,{"rank": "2" , "value": 2}
                ,{"rank": "3" , "value": 3} 
                ,{"rank": "4" , "value": 4}
                ,{"rank": "5" , "value": 5}
                ,{"rank": "6" , "value": 6}
                ,{"rank": "7" , "value": 7}
                ,{"rank": "8" , "value": 8}
                ,{"rank": "9" , "value": 9}
                ,{"rank": "10" , "value": 10}
                ,{"rank": "J" , "value": 10}
                ,{"rank": "Q" , "value": 10}
                ,{"rank": "K" , "value": 10}
                ]

        for rank in ranks:
            for suit in suits:
                self.cards.append([suit, rank])
            

    def shuffle_deck(self ):
        random.shuffle(self.cards)
        

    def deal_card(self, number):
        cards_dealt = []
        
        for x in range(number):
            card = self.cards.pop()
            cards_dealt.append(card)
            
        return cards_dealt

deck1 = Deck()
print(deck1.cards)

    
