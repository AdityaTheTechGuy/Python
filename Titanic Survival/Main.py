import pandas as pd
import numpy as np
import sklearn
import streamlit as st
import seaborn as sns
import matplotlib.pyplot as plt
from sklearn.linear_model import LogisticRegression  
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import confusion_matrix, classification_report
from sklearn.model_selection import train_test_split
from sklearn.metrics import ConfusionMatrixDisplay
from sklearn.metrics import roc_curve, auc
import joblib


df_Train = pd.read_csv('TitanicTrain.csv')
df_Test = pd.read_csv('TitanicTest.csv')

# print(df_Train.info())

def clean_data(df):
    df['Age'] = df['Age'].fillna(df['Age'].median())
    df['Embarked'] = df['Embarked'].fillna(df['Embarked'].mode()[0])
    df['Fare'] = df['Fare'].fillna(df['Fare'].median())
    
    df['Sex'] = df['Sex'].map({'male': 0 , 'female': 1}).astype(int)
    df['Embarked'] = df['Embarked'].map({'S': 0 , 'C': 1, 'Q': 2}).astype(int)
    
    df.drop(['Name', 'Ticket', 'Cabin'], axis=1, inplace=True)
    return df

df_Train = clean_data(df_Train)
df_Test = clean_data(df_Test)

# Training the Logistic Regression Model

X_train = df_Train.drop(['Survived','PassengerId'], axis=1) 
Y_train = df_Train['Survived']

# Split training and validation sets(80-20 split)

X_train,X_val,Y_train,Y_val = train_test_split(X_train,Y_train,test_size=0.2,random_state=42, stratify=Y_train)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_val_scaled = scaler.transform(X_val)

# Training the Model
model = LogisticRegression(max_iter=1000)
model.fit(X_train_scaled, Y_train)

# Evaluating the Model on Training Data
Y_pred = model.predict(X_train_scaled)

train_acc = accuracy_score(Y_train, Y_pred)
print(f"Training Accuracy: {train_acc * 100:.2f}%")

# Evaluating the Model on Validation Data
Y_val_pred = model.predict(X_val_scaled)

val_acc = accuracy_score(Y_val, Y_val_pred)
print(f"Validation Accuracy: {val_acc * 100:.2f}%")

# Confusion Matrix and Classification Report on Validation Data
print("Confusion Matrix and Classification Report on Validation Data:")
print(confusion_matrix(Y_val, Y_val_pred))
print(classification_report(Y_val, Y_val_pred))

# Retraining the model on the entire training dataset
X_full_train = df_Train.drop(['Survived','PassengerId'], axis=1)
Y_full_train = df_Train['Survived']

scaler = StandardScaler()
X_full_train_scaled = scaler.fit_transform(X_full_train)

X_test = df_Test[X_full_train.columns]
X_test_scaled = scaler.transform(X_test)

# Train the final model
finalmodel = LogisticRegression(max_iter=1000)
finalmodel.fit(X_full_train_scaled, Y_full_train)

# Save the model
joblib.dump(finalmodel, 'titanic_logistic_regression_model.pkl')
joblib.dump(scaler, 'titanic_scaler.pkl')

# Predictions on full training (for accuracy) 
Y_full_pred = finalmodel.predict(X_full_train_scaled)
full_train_acc = accuracy_score(Y_full_train, Y_full_pred)
print(f"Full Training Accuracy after retraining: {full_train_acc * 100:.2f}%")

# Predictions on test data
Y_pred_test = finalmodel.predict(X_test_scaled)

# Confusion matrix and Classification Report on Full Training Data
print("Confusion Matrix and Classification Report on Full Training Data:")
print(confusion_matrix(Y_full_train, Y_full_pred))
print(classification_report(Y_full_train, Y_full_pred))

# model coefficients
coefficients = finalmodel.coef_[0]
feature_names = X_full_train.columns
coef_df = pd.DataFrame({'Feature': feature_names, 'Coefficient': coefficients})
print("Model Coefficients:")
print(coef_df)

# Feature plot
plt.figure(figsize=(10,6))
sns.barplot(x='Coefficient', y='Feature', data=coef_df.sort_values(by='Coefficient', ascending=False))
plt.title('Feature Coefficients from Logistic Regression Model')
plt.xlabel('Effect on Survival')
plt.ylabel('Features')
plt.grid(True, axis='x', linestyle='--', alpha=0.7)
plt.tight_layout()

fig = plt.gcf()
fig.savefig('feature_coefficients.png')
plt.close()

# Confusion Matrix Display for Full Training Data
ConfusionMatrixDisplay.from_estimator(finalmodel, X_full_train_scaled, Y_full_train, cmap='Blues')
plt.title('Confusion Matrix on Full Training Data')
plt.savefig('confusion_matrix_full_training.png')
plt.close()

# ROC Curve for Full Training Data
Y_full_train_prob = finalmodel.predict_proba(X_full_train_scaled)[:, 1]
fpr,tpr,thresholds = roc_curve(Y_full_train, Y_full_train_prob)

roc_auc = auc(fpr,tpr)

plt.figure(figsize=(8,6))
plt.plot(fpr,tpr,color='blue',label=f'ROC curve (AUC = {roc_auc:.2f})')

plt.plot([0,1],[0,1],color='red',linestyle='--')        

plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('Receiver Operating Characteristic (ROC) Curve')
plt.legend(loc='lower right')
plt.grid(True, linestyle='--', alpha=0.7)
plt.tight_layout()
plt.savefig('roc_curve_full_training.png')
plt.close()

# Creating submission file
submission = pd.DataFrame({
    'PassengerId': df_Test['PassengerId'],
    'Survived': Y_pred_test
})
submission.to_csv('titanic_submission.csv', index=False)
print("Submission file created: titanic_submission.csv")



