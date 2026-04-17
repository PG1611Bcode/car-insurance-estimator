
import streamlit as st
import pandas as pd
import numpy as np
import pickle
import os

# Set page config
st.set_page_config(page_title="Insurance Claim Predictor", page_icon="🚗", layout="wide")

# Load artifacts
# @st.cache_resource
def load_artifacts():
    try:
        with open('artifacts/model_artifacts.pkl', 'rb') as f:
            artifacts = pickle.load(f)
        return artifacts
    except FileNotFoundError:
        st.error("Model artifacts not found. Please run 'training.py' first.")
        return None

artifacts = load_artifacts()

if artifacts:
    model = artifacts['model']
    scaler = artifacts['scaler']
    label_encoders = artifacts['label_encoders']
    severity_map = artifacts['severity_map']
    education_map = artifacts['education_map']
    numerical_cols = artifacts['numerical_cols']
    categorical_cols = artifacts['categorical_cols']
    remaining_cat_cols = artifacts['remaining_cat_cols']
    feature_names = artifacts['feature_names']

    st.title("🚗 Insurance Claim Amount Prediction")
    st.markdown("Enter the details of the incident and policy to predict the total claim amount.")

    # Create input form
    with st.form("prediction_form"):
        col1, col2, col3 = st.columns(3)

        inputs = {}
        
        # Categorical Inputs
        with col1:
            st.subheader("Policy Details")
            inputs['policy_state'] = st.selectbox("Policy State", label_encoders['policy_state'].classes_)
            inputs['policy_deductable'] = st.selectbox("Policy Deductable", [500, 1000, 2000])
            inputs['policy_annual_premium'] = st.number_input("Annual Premium ($)", min_value=0.0, value=1000.0)

        with col2:
            st.subheader("Insured Details")
            inputs['insured_age'] = st.number_input("Insured Age", min_value=18, max_value=100, value=30)
            inputs['insured_education_level'] = st.selectbox("Education Level", list(education_map.keys()))

        with col3:
            st.subheader("Incident Details")
            inputs['incident_type'] = st.selectbox("Incident Type", label_encoders['incident_type'].classes_)
            inputs['collision_type'] = st.selectbox("Collision Type", label_encoders['collision_type'].classes_)
            inputs['incident_severity'] = st.selectbox("Incident Severity", list(severity_map.keys()))
            inputs['authorities_contacted'] = st.selectbox("Authorities Contacted", label_encoders['authorities_contacted'].classes_)
            inputs['incident_hour_of_the_day'] = st.slider("Incident Hour", 0, 23, 12)
            inputs['number_of_vehicles_involved'] = st.number_input("Vehicles Involved", min_value=1, max_value=10, value=1)
            inputs['bodily_injuries'] = st.number_input("Bodily Injuries", min_value=0, max_value=10, value=0)
            inputs['witnesses'] = st.number_input("Witnesses", min_value=0, max_value=10, value=0)
            inputs['police_report_available'] = st.selectbox("Police Report Available", label_encoders['police_report_available'].classes_)

        # Default value for policy_id since it is in training features but not user input
        inputs['policy_id'] = 123456 

        submit_button = st.form_submit_button("Predict Claim Amount")

    if submit_button:
        # Create DataFrame from inputs
        input_data = pd.DataFrame([inputs])

        # Preprocessing
        
        # Manual Encoding
        input_data['incident_severity'] = input_data['incident_severity'].map(severity_map)
        input_data['insured_education_level'] = input_data['insured_education_level'].map(education_map)

        # Label Encoding
        for col in remaining_cat_cols:
            le = label_encoders[col]
            input_data[col] = le.transform(input_data[col])

        try:
            # Reorder columns to match model's expected input using saved feature_names
            input_ordered = input_data[feature_names]
            
            # Scale
            input_scaled = scaler.transform(input_ordered)
            
            # Predict
            prediction = model.predict(input_scaled)[0]
            
            st.success(f"Estimated Total Claim Amount: ${prediction:,.2f}")
            
            # Feature Importance
            st.subheader("Feature Importance")
            if hasattr(model, 'feature_importances_'):
                feat_importances = pd.Series(model.feature_importances_, index=feature_names)
                st.bar_chart(feat_importances.sort_values(ascending=False))
            else:
                st.info("Feature importance not available for this model.")
            
        except Exception as e:
            st.error(f"Error during prediction: {e}")

else:
    st.warning("Please train the model first.")
