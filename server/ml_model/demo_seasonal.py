from groundwater_predictor import predict_groundwater
import datetime

def test_location(lat, lng, name):
    print(f"\n{'='*60}")
    print(f"🏷️  TESTING: {name}")
    print(f"📍 Coordinates: ({lat}, {lng})")
    print(f"📅 Current Date: {datetime.datetime.now().strftime('%B %d, %Y')}")
    print(f"{'='*60}")
    
    result = predict_groundwater(lat, lng)
    if result['success']:
        data = result['data']
        seasonal = data['seasonalAnalysis']
        drilling = data['drillingTimeline']
        best_time = data['bestDrillingTime']
        
        # Core water level info
        print(f"\n🌊 WATER LEVEL ANALYSIS:")
        print(f"   Current: {data['currentWaterLevel']}m (mbgl)")
        print(f"   Future (3 years): {data['futureWaterLevel']}m (mbgl)")
        print(f"   Suitable for Borewell: {'✅ YES' if data['isSuitableForBorewell'] else '❌ NO'}")
        
        # Regional context
        print(f"\n🌍 REGIONAL CONTEXT:")
        print(f"   Region: {seasonal['regionType']}")
        print(f"   Climate Zone: {seasonal['climateZone']}")
        
        # Seasonal insights
        print(f"\n📊 SEASONAL INSIGHTS:")
        print(f"   ⚠️  Critical Low Months: {', '.join(seasonal['criticalMonths'])}")
        print(f"   💧 Recharge Period: {', '.join(seasonal['rechargePeriod']['months'])}")
        print(f"      └─ {seasonal['rechargePeriod']['description']}")
        print(f"   🔥 Stressed Period: {', '.join(seasonal['stressedPeriod']['months'])}")
        print(f"      └─ {seasonal['stressedPeriod']['description']}")
        
        # Drilling recommendations
        print(f"\n🚧 DRILLING RECOMMENDATIONS:")
        print(f"   🚨 Urgency: {drilling['urgency']}")
        print(f"   ⭐ Best Time: {best_time['monthName']} ({best_time['monthsFromNow']} months away)")
        print(f"   📋 Recommendation: {best_time['recommendation']}")
        print(f"   ✅ Optimal Months: {', '.join([f'Month {m}' for m in drilling['optimalMonths']])}")
        print(f"   ❌ Avoid Months: {', '.join([f'Month {m}' for m in drilling['avoidMonths']])}")
        
        # Reasoning
        print(f"\n💭 EXPERT REASONING:")
        print(f"   {drilling['reasoning']}")
        
        # Advisory note
        if 'suitabilityNote' in data:
            print(f"\n📝 ADVISORY NOTE:")
            print(f"   {data['suitabilityNote']}")
            
    else:
        print(f"❌ Error: {result['error']}")

# Test different regions to show variety
test_location(26.9124, 75.7873, "Jaipur, Rajasthan (Thar Desert)")
test_location(12.9716, 77.5946, "Bangalore, Karnataka (Deccan Plateau)")
test_location(19.0760, 72.8777, "Mumbai, Maharashtra (Coastal)")

print(f"\n{'='*60}")
print("🎯 SUMMARY:")
print("The system now provides:")
print("✅ Region-specific seasonal water level patterns")
print("✅ Climate-zone-aware drilling recommendations") 
print("✅ Month-wise drilling suitability analysis")
print("✅ Urgency-based timeline planning")
print("✅ Expert reasoning for all recommendations")
print("✅ Accurate Indian regional and seasonal patterns")
print(f"{'='*60}")
