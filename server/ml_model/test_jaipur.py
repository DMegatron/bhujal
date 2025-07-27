from groundwater_predictor import predict_groundwater

# Test Jaipur specifically
result = predict_groundwater(26.9124, 75.7873)
if result['success']:
    data = result['data']
    seasonal = data['seasonalAnalysis']
    drilling = data['drillingTimeline']
    
    print("=== JAIPUR TEST ===")
    print(f"🌍 Region: {seasonal['regionType']}")
    print(f"🌡️ Climate: {seasonal['climateZone']}")
    print(f"⚠️ Critical Months: {', '.join(seasonal['criticalMonths'])}")
    print(f"🚧 Drilling Reasoning: {drilling['reasoning']}")
    print(f"💧 Recharge Period: {seasonal['rechargePeriod']['description']}")
else:
    print(f"Error: {result['error']}")
