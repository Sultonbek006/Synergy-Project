import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("ERROR: GOOGLE_API_KEY not found in .env")
    exit(1)

genai.configure(api_key=api_key)

print(f"Using API Key: {api_key[:5]}...{api_key[-5:]}")

try:
    print("\n[1] Listing available models...")
    found_models = []
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"  - {m.name}")
            found_models.append(m.name)
    
    if not found_models:
        print("ERROR: No models found with generateContent support.")
        exit(1)

    # Prefer gemini-1.5-flash, fall back to gemini-pro, then first available
    target_model = 'models/gemini-1.5-flash'
    if target_model not in found_models:
        if 'models/gemini-pro' in found_models:
            target_model = 'models/gemini-pro'
        else:
            target_model = found_models[0]
            
    print(f"\n[2] Testing generation with: {target_model}")
    model = genai.GenerativeModel(target_model)
    response = model.generate_content("Hello! Are you online?")
    
    print("\nBASIC CONNECTION TEST:")
    print("-" * 30)
    print(f"Response: {response.text}")
    print("-" * 30)
    print("SUCCESS: Connected to Gemini API.")

except Exception as e:
    print("\nCONNECTION FAILED:")
    print("-" * 30)
    print(e)
    print("-" * 30)
