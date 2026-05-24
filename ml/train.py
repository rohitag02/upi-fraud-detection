import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, roc_auc_score
import joblib, os

np.random.seed(42)
n = 10000
df = pd.DataFrame({
    'amount':           np.random.exponential(5000, n),
    'hour':             np.random.randint(0, 24, n),
    'velocity_1h':      np.random.poisson(2, n),
    'velocity_24h':     np.random.poisson(8, n),
    'amount_deviation': np.random.normal(0, 1, n),
    'merchant_score':   np.random.uniform(0, 1, n),
    'device_age_days':  np.random.randint(0, 365, n),
    'location_anomaly': np.random.randint(0, 2, n),
    'new_beneficiary':  np.random.randint(0, 2, n),
})

fraud_score = (
    (df['amount'] > 15000)        * 0.30 +
    (df['velocity_1h'] > 4)       * 0.25 +
    (df['location_anomaly'] == 1) * 0.20 +
    (df['new_beneficiary'] == 1)  * 0.15 +
    (df['merchant_score'] < 0.3)  * 0.10
)
df['is_fraud'] = (
    fraud_score + np.random.normal(0, 0.1, n) > 0.45
).astype(int)

X = df.drop('is_fraud', axis=1)
y = df['is_fraud']
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_test_s  = scaler.transform(X_test)

print("Training RandomForest...")
rf = RandomForestClassifier(n_estimators=100, random_state=42)
rf.fit(X_train_s, y_train)
rf_acc = accuracy_score(y_test, rf.predict(X_test_s))
rf_auc = roc_auc_score(y_test, rf.predict_proba(X_test_s)[:,1])
print(f"  Accuracy: {rf_acc:.1%}   AUC-ROC: {rf_auc:.4f}")

print("Training GradientBoosting...")
gb = GradientBoostingClassifier(n_estimators=100, random_state=42)
gb.fit(X_train_s, y_train)
gb_acc = accuracy_score(y_test, gb.predict(X_test_s))
print(f"  Accuracy: {gb_acc:.1%}")

os.makedirs('models', exist_ok=True)
joblib.dump(rf,     'models/rf_model.pkl')
joblib.dump(gb,     'models/gb_model.pkl')
joblib.dump(scaler, 'models/scaler.pkl')
print("\nModels saved — training complete!")