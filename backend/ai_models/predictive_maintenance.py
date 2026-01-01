import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import joblib
from datetime import datetime
from sqlalchemy.orm import Session
from database import TransmissionLine, TrippingIncident, TowerLocation

class PredictiveMaintenanceModel:
    def __init__(self):
        self.model = None
        self.label_encoders = {}

    def prepare_features(self, db: Session):
        """Extract features from database for ML model"""
        lines = db.query(TransmissionLine).all()
        data = []

        for line in lines:
            line_age = (datetime.now().date() - line.commission_date).days / 365

            incidents = db.query(TrippingIncident).filter(
                TrippingIncident.transmission_line_id == line.id
            ).all()
            incident_count = len(incidents)
            recent_incidents = len([i for i in incidents
                                   if (datetime.now().date() - i.fault_date).days <= 180])

            towers = db.query(TowerLocation).filter(
                TowerLocation.transmission_line_id == line.id
            ).all()
            poor_towers = len([t for t in towers if t.condition in ['Needs Inspection', 'Under Repair']])

            if recent_incidents > 3:
                risk_score = 2
            elif recent_incidents > 1 or line_age > 30 or poor_towers > 2:
                risk_score = 1
            else:
                risk_score = 0

            data.append({
                'line_id': line.id,
                'line_name': line.line_name,
                'voltage_level': line.voltage_level,
                'total_length_km': line.total_length_km,
                'line_age': line_age,
                'incident_count': incident_count,
                'recent_incidents': recent_incidents,
                'tower_count': len(towers),
                'poor_tower_count': poor_towers,
                'risk_level': risk_score
            })

        return pd.DataFrame(data)

    def train_model(self, db: Session):
        """Train the predictive maintenance model"""
        df = self.prepare_features(db)
        if len(df) < 10:
            print("Not enough data to train model")
            return False

        le_voltage = LabelEncoder()
        df['voltage_encoded'] = le_voltage.fit_transform(df['voltage_level'])
        self.label_encoders['voltage_level'] = le_voltage

        feature_cols = ['total_length_km', 'line_age', 'incident_count',
                       'recent_incidents', 'tower_count', 'poor_tower_count',
                       'voltage_encoded']
        X = df[feature_cols]
        y = df['risk_level']

        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.model.fit(X, y)

        joblib.dump(self.model, 'predictive_maintenance_model.pkl')
        joblib.dump(self.label_encoders, 'label_encoders.pkl')

        print("Model trained successfully!")
        return True

    def predict_maintenance_needs(self, db: Session):
        """Predict which lines need maintenance"""
        if self.model is None:
            try:
                self.model = joblib.load('predictive_maintenance_model.pkl')
                self.label_encoders = joblib.load('label_encoders.pkl')
            except:
                print("Model not found. Training new model...")
                self.train_model(db)

        df = self.prepare_features(db)
        df['voltage_encoded'] = self.label_encoders['voltage_level'].transform(df['voltage_level'])

        feature_cols = ['total_length_km', 'line_age', 'incident_count',
                       'recent_incidents', 'tower_count', 'poor_tower_count',
                       'voltage_encoded']
        X = df[feature_cols]

        predictions = self.model.predict(X)
        probabilities = self.model.predict_proba(X)

        df['predicted_risk'] = predictions
        df['risk_probability'] = probabilities.max(axis=1)

        high_risk_lines = df[df['predicted_risk'] >= 1].sort_values('risk_probability', ascending=False)
        return high_risk_lines[['line_id', 'line_name', 'voltage_level',
                               'line_age', 'recent_incidents', 'predicted_risk',
                               'risk_probability']].to_dict('records')

    def get_model_metrics(self, db: Session):
        """Get model performance metrics"""
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
        
        df = self.prepare_features(db)
        
        if len(df) < 10:
            return {
                "error": "Not enough data for evaluation",
                "message": "Need at least 10 transmission lines to calculate metrics",
                "current_samples": len(df)
            }
        
        # Prepare data
        le_voltage = LabelEncoder()
        df['voltage_encoded'] = le_voltage.fit_transform(df['voltage_level'])
        
        feature_cols = ['total_length_km', 'line_age', 'incident_count', 
                    'recent_incidents', 'tower_count', 'poor_tower_count', 
                    'voltage_encoded']
        
        X = df[feature_cols]
        y = df['risk_level']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y if len(np.unique(y)) > 1 else None
        )
        
        # Train model
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        
        # Predictions
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)
        
        # Feature importance
        feature_importance = dict(zip(feature_cols, model.feature_importances_))
        sorted_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
        
        # Confusion matrix
        cm = confusion_matrix(y_test, y_pred)
        
        return {
            "accuracy": float(accuracy_score(y_test, y_pred)),
            "precision": float(precision_score(y_test, y_pred, average='weighted', zero_division=0)),
            "recall": float(recall_score(y_test, y_pred, average='weighted', zero_division=0)),
            "f1_score": float(f1_score(y_test, y_pred, average='weighted', zero_division=0)),
            "training_samples": len(X_train),
            "test_samples": len(X_test),
            "total_samples": len(df),
            "feature_importance": [{"name": name, "importance": float(imp)} for name, imp in sorted_features],
            "confusion_matrix": cm.tolist(),
            "risk_distribution": {
                "low": int((y == 0).sum()),
                "medium": int((y == 1).sum()),
                "high": int((y == 2).sum())
            }
        }