#!/usr/bin/env python3
import google.generativeai as genai

# Your API key
api_key = "AIzaSyCTDaSOjvFrwUbXBt4QbfSVnnTA6yXZ03g"
genai.configure(api_key=api_key)

print("=" * 60)
print("TESTING GEMINI API KEY")
print("=" * 60)

print("\n1. Listing all available models that support generateContent:\n")

available_models = []
try:
    for model in genai.list_models():
        if 'generateContent' in model.supported_generation_methods:
            available_models.append(model.name)
            print(f"✅ {model.name}")
    
    if not available_models:
        print("No models found with generateContent support")
except Exception as e:
    print(f"Error listing models: {e}")

print("\n" + "=" * 60)
print("2. Testing each model with a simple request:\n")

# Test the first available model if any
if available_models:
    test_model = available_models[0]
    print(f"Testing {test_model}...")
    try:
        model = genai.GenerativeModel(test_model)
        response = model.generate_content("Say 'test success'")
        print(f"✅ SUCCESS! Model {test_model} works!")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Failed: {e}")
else:
    # If list_models failed, try common model names
    test_models = [
        'gemini-1.5-flash',
        'gemini-1.5-pro', 
        'gemini-pro',
        'gemini-1.0-pro',
    ]
    
    for model_name in test_models:
        print(f"\nTrying {model_name}...")
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content("Say 'test'")
            print(f"✅ SUCCESS! Use: {model_name}")
            print(f"Response: {response.text[:100]}")
            break
        except Exception as e:
            print(f"❌ Failed: {str(e)[:150]}")
