import pickle
import pandas as pd
import numpy as np
import xgboost as xgboost
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.metrics import r2_score
from statsmodels.stats.outliers_influence import variance_inflation_factor

# Load the dataset
df = pd.read_csv('Backend/Insurance Premium Prediction Dataset.csv/insurance_claim_prediction.csv')

# Drop features with low correlation
df.drop(['insured_hobbies', 'insured_sex', 'insured_occupation'], axis=1, inplace=True)

# 1. Handling Missing Values
# Numerical Imputation (Mean)
num_imputer = SimpleImputer(strategy='mean')
numerical_cols = df.select_dtypes(include=['int64', 'float64']).columns
df[numerical_cols] = num_imputer.fit_transform(df[numerical_cols])

# Categorical Imputation (Most Frequent)
cat_imputer = SimpleImputer(strategy='most_frequent')
categorical_cols = df.select_dtypes(include=['object']).columns
df[categorical_cols] = cat_imputer.fit_transform(df[categorical_cols])

# 2. Outlier Treatment (IQR)
# Cap outliers at 1.5 * IQR
for col in numerical_cols:
    Q1 = df[col].quantile(0.25)
    Q3 = df[col].quantile(0.75)
    IQR = Q3 - Q1
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    df[col] = np.clip(df[col], lower_bound, upper_bound)

# 3. Encoding Categorical Variables
# Manual Ordinal Encoding
severity_map = {'Trivial Damage': 0, 'Minor Damage': 1, 'Major Damage': 2, 'Total Loss': 3}
df['incident_severity'] = df['incident_severity'].map(severity_map)

education_map = {'High School': 0, 'Associate': 1, 'Bachelors': 2, 'Masters': 3, 'PhD': 4}
df['insured_education_level'] = df['insured_education_level'].map(education_map)

# Label Encoding for remaining categorical columns
label_encoders = {}
remaining_cat_cols = [col for col in categorical_cols if col not in ['incident_severity', 'insured_education_level']]
for col in remaining_cat_cols:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])
    label_encoders[col] = le

# 4. Feature Selection using VIF
# Calculate VIF for each feature
def calculate_vif(dataframe):
    vif_data = pd.DataFrame()
    vif_data["feature"] = dataframe.columns
    vif_data["VIF"] = [variance_inflation_factor(dataframe.values, i)
                       for i in range(len(dataframe.columns))]
    return vif_data

# Analyze VIF (Print only, do not drop)
X = df.drop('total_claim_amount', axis=1) # Target variable not included
# vif_df = calculate_vif(X) 
# print(vif_df) # Optional: Print VIF for analysis
# NOTE: We do not drop features based on VIF for Tree-based models as they handle multicollinearity well.

# Target Variable
y = df['total_claim_amount']

# 5. Train Test Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 6. Scaling
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# 7. Model Training & Evaluation

# Random Forest
print("\nTraining Random Forest...")
rf_model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
rf_model.fit(X_train, y_train)
rf_pred = rf_model.predict(X_test)
print(f"Random Forest Accuracy (R2 Score): {r2_score(y_test, rf_pred):.4f}")

# XGBoost with Hyperparameter Tuning
print("\nTuning XGBoost...")
xgb_model = xgboost.XGBRegressor(objective='reg:squarederror', n_jobs=-1)

# XGBoost before Hyperparameter Tuning
print("\nTraining XGBoost (Default)...")
xgb_model.fit(X_train, y_train)
xgb_pred_default = xgb_model.predict(X_test)
print(f"XGBoost Accuracy (Before Tuning) (R2 Score): {r2_score(y_test, xgb_pred_default):.4f}")

param_grid = {
    'n_estimators': [100, 200, 300],
    'max_depth': [3, 5, 7],
    'learning_rate': [0.01, 0.05, 0.1, 0.2],
    'subsample': [0.7, 0.8, 0.9, 1.0],
    'colsample_bytree': [0.7, 0.8, 0.9, 1.0]
}

random_search = RandomizedSearchCV(xgb_model, param_distributions=param_grid, 
                                   n_iter=10, scoring='r2', n_jobs=-1, cv=3, verbose=0, random_state=42)
random_search.fit(X_train, y_train)

best_xgb = random_search.best_estimator_
xgb_pred = best_xgb.predict(X_test)

print(f"\nBest XGBoost Params: {random_search.best_params_}")
print(f"XGBoost Accuracy (R2 Score): {r2_score(y_test, xgb_pred):.4f}")

# 8. Save Model and Artifacts
print("\nSaving model artifacts...")
import os

# Create artifacts directory if not exists
if not os.path.exists('Backend/artifacts'):
    os.makedirs('Backend/artifacts')

artifacts = {
    'model': best_xgb,
    'scaler': scaler,
    'label_encoders': label_encoders,
    'severity_map': severity_map,
    'education_map': education_map,
    'numerical_cols': numerical_cols.tolist(),
    'categorical_cols': categorical_cols.tolist(),
    'remaining_cat_cols': remaining_cat_cols,
    'feature_names': X.columns.tolist()
}

with open('Backend/artifacts/model_artifacts.pkl', 'wb') as f:
    pickle.dump(artifacts, f)

print("Model artifacts saved to 'Backend/artifacts/model_artifacts.pkl'")
