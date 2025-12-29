import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv() # Load the .env file

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("API Key not found in environment variables")

genai.configure(api_key=api_key)

if __name__ == "__main__":
    print("Configuration loaded successfully. API Key found.")
