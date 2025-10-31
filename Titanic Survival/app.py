import streamlit as st
import joblib
import pandas as pd
import numpy as np
import matplotlib as plt

# Load the trained model and scaler
model = joblib.load('Titanic Survival/titanic_logistic_regression_model.pkl')
scaler = joblib.load('Titanic Survival/titanic_scaler.pkl')

# Page title
st.set_page_config(page_title= "Titanic Survival Predictor", page_icon="🚢", layout="centered")

st.title("🚢Titanic Survival Prediction")
st.markdown("""
Welcome aboard!  
This app predicts whether a Titanic passenger **would have survived** based on key details.
""")
st.write("Enter the passenger details to predict survival.")

# Input widgets
st.header("Passenger Details")

col1,col2 = st.columns(2)

with col1 :
    pclass = st.selectbox("Passenger Class", ["1st class", "2nd class", "3rd class"])
    sex = st.selectbox("Sex", ["Male", "Female"]).lower()
    age = st.number_input("Age", min_value=0, max_value=100, value=26)
    
with col2 :
    sibsp = st.number_input("Number of Siblings/Spouses aboard", min_value=0, max_value=10, value=0)
    parch = st.number_input("Number of Parents/Children aboard", min_value=0, max_value=10, value=0)
    fare = st.number_input("Fare", min_value=0.0, max_value=1000.0, value=32.2)



embarked = st.selectbox("Port of Embarkation", ["Southampton", "Cherbourg", "Queenstown"])

# Data Mapping

pclass_map = {"1st Class" : 1, "2nd Class" : 2, "3rd Class": 3}
pclass_num = pclass_map.get(pclass, 3) 
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
st.subheader("Passenger Summary")
st.dataframe(input_data, hide_index=True)

# Scale the input data
input_data_scaled = scaler.transform(input_data)

# Make the prediction
if st.button("Predict Survival"):
    try:
        prediction = model.predict(input_data_scaled)[0]
        probability = model.predict_proba(input_data_scaled)[0][1]
    
        st.subheader("Prediction Result")
        if prediction == 1:
            st.success(f"The passenger is predicted to SURVIVE with a probability of {probability*100:.2f}%.")
        else:
            st.error(f"The passenger is predicted to NOT SURVIVE with a probability of {(1 - probability)*100:.2f}%.")  
    
    except Exception as e:
        st.error(f"An error occurred during prediction: {e}")
        

# Feature Importance Visualisation for user
st.markdown("---")
st.caption("Feature Importance")

features = ['Pclass', 'Sex', 'Age', 'SibSp', 'Parch', 'Fare', 'Embarked']
coefficients = model.coef_[0]

coef_df = pd.DataFrame({
    'Feature': features,
    'Coefficient': coefficients
}).sort_values(by='Coefficient', ascending=False)

st.bar_chart(data=coef_df, x='Feature', y='Coefficient', use_container_width=True)
st.info("""
**Interpretation Guide:**
- Bars on the **right (positive)** → increase survival likelihood.
- Bars on the **left (negative)** → decrease survival likelihood.
- Larger bar = stronger influence.
""")


# Footer
st.markdown("---")
st.caption("Developed by Aditya Gupta 🚀")