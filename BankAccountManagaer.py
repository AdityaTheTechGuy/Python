class Account:
    def __init__(self, account_number, account_holder, account_balance = 0.0):
        self.account_number = account_number
        self.account_holder = account_holder
        self.account_balance = account_balance
        self.transaction_history = []
        
    def deposit(self, amount):
        if amount > 0:
            self.account_balance += amount
            self.transaction_history.append(f"{timestamp} - Deposited: Rs.{amount:.2f}")
            print(f"Deposited: Rs.{amount:.2f}")
            print(f"New Balance: Rs.{self.account_balance:.2f}")
        else:
            print("Deposit amount must be positive.")
    
    def withdraw(self, amount):
        if amount > 0:
            if amount <= self.account_balance:
                self.transaction_history.append(f"{timestamp} - Withdrew: Rs.{amount:.2f}")
                self.account_balance -= amount
                print(f"Withdrew: Rs.{amount:.2f}")
                print(f"New Balance: Rs.{self.account_balance:.2f}")
            else:
                print("Insufficient funds for this withdrawal.")
        else:
            print("Withdrawal amount must be positive.")
    
    def transfer(self, target_account, amount):
        if target_account == self:
            print("Cannot transfer to the same account.")
            return
        
        if amount > 0:
            self.transaction_history.append(f"{timestamp} Transferred: Rs.{amount:.2f} to {target_account.account_holder}")
            target_account.transaction_history.append(f"{timestamp} -Received: Rs.{amount:.2f} from {self.account_holder}")
            
            if amount <= self.account_balance:
                self.account_balance -= amount
                target_account.account_balance += amount
                print(f"Transferred: Rs.{amount:.2f} to {target_account.account_holder}")
                print(f"New Balance: Rs.{self.account_balance:.2f}")
            else:
                print("Insufficient funds for this transfer.")
        
        else:
            print("Transfer amount must be positive.")
            
    def display_balance(self):
        print(f"Account Balance for {self.account_holder} (Account No: {self.account_number}): Rs.{self.account_balance:.2f}")
    
    def display_transaction_history(self):
        print(f"Transaction History for {self.account_holder} (Account No: {self.account_number}):")
        if not self.transaction_history:
            print("No transactions yet.")
        else:
            for transaction in self.transaction_history:
                print(transaction)

from datetime import datetime

timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

#main program to demonstrate functionality
if __name__ == "__main__":
    
    def create_account():
        print("Creating a new account:")
        account_number = int(input("Enter account number: "))
        while True:
            if account_number in accounts:
                print("Account number already exists. Please enter a different account number.")
            else:
                break
        
        account_holder = input("Enter account holder name: ")
        initial_deposit = float(input("Enter initial deposit amount: "))
        
        if initial_deposit < 0:
            print("Initial deposit must be non-negative.")
            return None
        
        return Account(account_number, account_holder, initial_deposit)
    
    print("Welcome to the Bank Account Manager")
    accounts = {}
    if not accounts:
        print("No accounts found. Please create an account first.")
        account = create_account()
        if not account:
            print("Account creation failed.")
            exit()
            
        accounts[account.account_number] = account
    

    def find_account():
        acc_number = int(input("Enter account number: "))
        if acc_number in accounts:
            return accounts[acc_number]
        else:
            print("Account not found.")
            return None

            
    
    
    
        
    while True:
        print("\n--- Bank Account Manager ---")
        print("1. Deposit")
        print("2. Withdraw")
        print("3. Transfer")
        print("4. Display Balance")
        print("5. Display Transaction History")
        print("6. Create New Account")
        print("7. Exit")
        
        choice = input("Choose an option (1-7): ")
        
        if choice == '1':
            account = find_account()
            if account:
                amount = float(input("Enter deposit amount: "))
                account.deposit(amount)
                
        elif choice == '2':
            account = find_account()
            if account:
                amount = float(input("Enter withdrawal amount: "))
                account.withdraw(amount)
                
        elif choice == '3':
            print("Source Account:")
            source_account = find_account()
            if source_account:
                print("Target Account:")
                target_account = find_account()
                if target_account:
                    amount = float(input("Enter transfer amount: "))
                    source_account.transfer(target_account, amount)
                    
        elif choice == '4':
            account = find_account()
            if account:
                account.display_balance()
                
        elif choice == '5':
            account = find_account()
            if account:
                account.display_transaction_history()
        
        elif choice == '6':
            new_account = create_account()
            if new_account:
                accounts[new_account.account_number] = new_account
                print("Account created successfully.")
            
        else:
            print("Invalid choice. Please select a valid option.")
        