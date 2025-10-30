import streamlit as st
import joblib
import pandas as pd

# Load the trained model and scaler
model = joblib.load('titanic_logistic_regression_model.pkl')
scaler = joblib.load('titanic_scaler.pkl')

st.title("Titanic Survival Prediction")
st.write("Enter the passenger details to predict survival.")

# Input widgets
pclass = st.selectbox("Passenger Class", ["1st class", "2nd class", "3rd class"])
pclass_map = {"1st class": 1, "2nd class": 2, "3rd class": 3}
pclass_num = pclass_map[pclass]

sex = st.selectbox("Sex", ["Male", "Female"]).lower()
age = st.number_input("Age", min_value=0, max_value=100, value=26)
sibsp = st.number_input("Number of Siblings/Spouses aboard", min_value=0, max_value=10, value=0)
parch = st.number_input("Number of Parents/Children aboard", min_value=0, max_value=10, value=0)
fare = st.number_input("Fare", min_value=0.0, max_value=1000.0, value=32.2)
embarked = st.selectbox("Port of Embarkation", ["Southampton", "Cherbourg", "Queenstown"])

# Convert sex to numerical
sex_num = 0 if sex == "male" else 1
embarked_map = {"Southampton": 0, "Cherbourg": 1, "Queenstown": 2}
embarked_num = embarked_map[embarked]

# Preview dataframe
input_data = pd.DataFrame({
    'Pclass': [pclass_num],
    'Sex': [sex_num],
    'Age': [age],
    'SibSp': [sibsp],
    'Parch': [parch],
    'Fare': [fare],
    'Embarked': [embarked_num]
    
})
# Show input data without index
st.subheader("Input Data")
st.dataframe(input_data, hide_index=True)

# Scale the input data
input_data_scaled = scaler.transform(input_data)

# Make the prediction
if st.button("Predict Survival"):
    prediction = model.predict(input_data_scaled)[0]
    probability = model.predict_proba(input_data_scaled)[0][1]
    
    st.subheader("Prediction Result")
    if prediction == 1:
        st.success(f"The passenger is predicted to SURVIVE with a probability of {probability*100:.2f}%.")
    else:
        st.error(f"The passenger is predicted to NOT SURVIVE with a probability of {(1 - probability)*100:.2f}%.")  
        