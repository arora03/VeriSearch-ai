import google.generativeai as genai
import os

# Configure API
api_key = "AIzaSyCTDaSOjvFrwUbXBt4QbfSVnnTA6yXZ03g"
genai.configure(api_key=api_key)

print("🔍 Listing all available Gemini models:\n")

try:
    for model in genai.list_models():
        if 'generateContent' in model.supported_generation_methods:
            print(f"✅ {model.name}")
            print(f"   Display Name: {model.display_name}")
            print(f"   Methods: {model.supported_generation_methods}")
            print()
except Exception as e:
    print(f"❌ Error listing models: {e}")
    print(f"\n Trying alternative approach...")
    
    # Try with different model names
    test_models = [
        'gemini-pro',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'models/gemini-pro',
        'models/gemini-1.5-flash',
        'models/gemini-1.5-pro',
        'gemini-1.5-flash-latest',
    ]
    
    for model_name in test_models:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content("Say 'test'")
            print(f"✅ {model_name} - WORKS!")
        except Exception as e:
            print(f"❌ {model_name} - {str(e)[:80]}")
