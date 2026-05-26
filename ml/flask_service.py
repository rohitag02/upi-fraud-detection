from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app)

# Load models once at startup
MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'ml', 'models')

try:
    rf_model = joblib.load(os.path.join(MODEL_DIR, 'rf_model.pkl'))
    gb_model = joblib.load(os.path.join(MODEL_DIR, 'gb_model.pkl'))
    scaler   = joblib.load(os.path.join(MODEL_DIR, 'scaler.pkl'))
    print("✅ ML models loaded successfully")
except Exception as e:
    print(f"⚠️  Could not load models: {e}")
    rf_model = gb_model = scaler = None


def build_features(data):
    """Extract feature vector from request data."""
    return np.array([[
        float(data.get('amount',          0)),
        float(data.get('hour',            12)),
        float(data.get('velocity1h',      0)),
        float(data.get('velocity24h',     0)),
        float(data.get('amountDeviation', 0)),
        float(data.get('merchantScore',   0.5)),
        float(data.get('deviceAgeDays',   365)),
        float(data.get('locationAnomaly', 0)),
        float(data.get('newBeneficiary',  0)),
    ]])


def get_reasons(data, rf_prob):
    """Generate human-readable fraud reasons."""
    amount           = float(data.get('amount',          0))
    velocity1h       = float(data.get('velocity1h',      0))
    location_anomaly = float(data.get('locationAnomaly', 0))
    new_beneficiary  = float(data.get('newBeneficiary',  0))
    merchant_score   = float(data.get('merchantScore',   0.5))
    device_age       = float(data.get('deviceAgeDays',   365))
    hour             = float(data.get('hour',            12))
    amount_dev       = float(data.get('amountDeviation', 0))

    reasons = []
    if amount > 50000:      reasons.append('Very high amount (>₹50,000)')
    elif amount > 15000:    reasons.append('High amount (>₹15,000)')
    if velocity1h > 5:      reasons.append('Too many transactions in 1 hour')
    elif velocity1h > 3:    reasons.append('High transaction frequency')
    if location_anomaly:    reasons.append('Payment from unusual location')
    if new_beneficiary:     reasons.append('First time paying this person')
    if merchant_score < 0.2:reasons.append('Merchant has very low trust score')
    elif merchant_score < 0.4: reasons.append('Merchant trust score is low')
    if 1 <= hour <= 4:      reasons.append('Transaction at unusual hour (1am–4am)')
    if device_age < 7:      reasons.append('Payment from a brand new device')
    if amount_dev > 2.5:    reasons.append('Unusual amount for this account')
    return reasons


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'models_loaded': rf_model is not None,
        'message': 'ML microservice running'
    })


@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    if rf_model is None:
        return jsonify({'error': 'Models not loaded'}), 503

    try:
        features   = build_features(data)
        scaled     = scaler.transform(features)

        # Ensemble: average probability from both models
        rf_prob    = rf_model.predict_proba(scaled)[0][1]
        gb_prob    = gb_model.predict_proba(scaled)[0][1]
        avg_prob   = (rf_prob + gb_prob) / 2

        risk_score = min(int(avg_prob * 100 * 1.3), 100)
        decision   = 'BLOCKED' if risk_score >= 80 else 'REVIEW' if risk_score >= 50 else 'APPROVED'
        confidence = 'HIGH'    if risk_score >= 80 else 'MEDIUM' if risk_score >= 50 else 'LOW'
        reasons    = get_reasons(data, rf_prob)

        return jsonify({
            'riskScore':  risk_score,
            'decision':   decision,
            'confidence': confidence,
            'reasons':    reasons,
            'modelInfo': {
                'rfProbability': round(rf_prob, 4),
                'gbProbability': round(gb_prob, 4),
                'ensemble':      round(avg_prob, 4),
                'type':          'RandomForest + GradientBoosting'
            }
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"🤖 ML microservice starting on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
