"""
Test script to verify the groundwater prediction model and service.
Run this after setting up the environment to ensure everything works correctly.
"""

import sys
import os
import requests
import json
import time
from datetime import datetime

def test_python_dependencies():
    """Test if all Python dependencies are available"""
    print("Testing Python dependencies...")
    
    try:
        import flask
        from flask_cors import CORS
        import joblib
        import numpy
        import pandas
        import sklearn
        print("✅ All Python dependencies are available")
        return True
    except ImportError as e:
        print(f"❌ Missing Python dependency: {e}")
        return False

def test_model_file():
    """Test if the ML model file exists and can be loaded"""
    print("Testing ML model file...")
    
    model_path = 'groundwater_model.pkl'
    
    if not os.path.exists(model_path):
        print(f"❌ Model file not found: {model_path}")
        print("   Please ensure the trained model file is in the root directory")
        return False
    
    try:
        import joblib
        model = joblib.load(model_path)
        print(f"✅ Model loaded successfully: {type(model).__name__}")
        
        # Test if model has prediction capability
        if hasattr(model, 'predict'):
            print("✅ Model has predict method")
        else:
            print("❌ Model doesn't have predict method")
            return False
            
        return True
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return False

def test_flask_service():
    """Test if Flask service can start and respond"""
    print("Testing Flask service...")
    
    # Import and test the service
    try:
        import predict_service
        print("✅ Flask service imports successfully")
        return True
    except Exception as e:
        print(f"❌ Error importing Flask service: {e}")
        return False

def test_prediction_api():
    """Test the prediction API endpoint"""
    print("Testing prediction API...")
    
    service_url = "http://localhost:5002"
    
    # Test health endpoint
    try:
        response = requests.get(f"{service_url}/health", timeout=5)
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ Health check passed: {health_data.get('status')}")
            
            if health_data.get('model_loaded'):
                print("✅ Model is loaded in service")
            else:
                print("❌ Model is not loaded in service")
                return False
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to Flask service: {e}")
        print("   Make sure the Flask service is running on port 5001")
        return False
    
    # Test prediction endpoint
    test_data = {
        "latitude": 28.6139,
        "longitude": 77.2090,
        "year": 2025,
        "previous_level": 10.0,
        "rainfall": 800.0,
        "temperature": 25.0
    }
    
    try:
        response = requests.post(f"{service_url}/predict", json=test_data, timeout=10)
        if response.status_code == 200:
            prediction_data = response.json()
            print(f"✅ Prediction successful: {prediction_data.get('prediction')} meters")
            print(f"   Interpretation: {prediction_data.get('interpretation')}")
            return True
        else:
            print(f"❌ Prediction failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Prediction request failed: {e}")
        return False

def test_express_integration():
    """Test the Express server integration"""
    print("Testing Express server integration...")
    
    express_url = "http://localhost:5000"
    
    try:
        # Test the health endpoint
        response = requests.get(f"{express_url}/api/predict/health", timeout=5)
        if response.status_code == 200:
            print("✅ Express prediction route is accessible")
            return True
        else:
            print(f"❌ Express prediction route failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to Express server: {e}")
        print("   Make sure the Express server is running on port 5000")
        return False

def run_full_test():
    """Run all tests"""
    print("=" * 60)
    print("  Bhujal ML Prediction System Test")
    print("=" * 60)
    print()
    
    tests = [
        ("Python Dependencies", test_python_dependencies),
        ("ML Model File", test_model_file),
        ("Flask Service", test_flask_service),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"[{test_name}]")
        result = test_func()
        results.append((test_name, result))
        print()
    
    # Summary
    print("=" * 60)
    print("  Test Summary")
    print("=" * 60)
    
    all_passed = True
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
        if not result:
            all_passed = False
    
    print()
    if all_passed:
        print("🎉 All tests passed! The ML prediction system is ready.")
        print()
        print("Next steps:")
        print("1. Start Flask service: python predict_service.py")
        print("2. Start Express server: npm run dev")
        print("3. Or run both together: npm run dev:full")
    else:
        print("❌ Some tests failed. Please check the errors above.")
        print()
        print("Common solutions:")
        print("- Install dependencies: pip install -r requirements.txt")
        print("- Ensure groundwater_model.pkl is in the root directory")
        print("- Check Python and Node.js versions")

def run_service_test():
    """Test running services (requires services to be running)"""
    print("=" * 60)
    print("  Live Service Test")
    print("=" * 60)
    print()
    
    tests = [
        ("Prediction API", test_prediction_api),
        ("Express Integration", test_express_integration),
    ]
    
    for test_name, test_func in tests:
        print(f"[{test_name}]")
        test_func()
        print()

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "live":
        run_service_test()
    else:
        run_full_test()
        print()
        print("To test running services, use: python test_ml_system.py live")
