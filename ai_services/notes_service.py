import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel('gemini-1.5-flash')

def generate_notes(topic, detail_level="standard"):
    prompt = f"""
    GENERATE PROFESSIONAL ACADEMIC NOTES
    Topic: {topic}
    Detail Level: {detail_level}
    
    Structure Required:
    1. FORMAL DEFINITION: Precise engineering/technical definition.
    2. CORE MECHANISMS: How it works (step-by-step).
    3. REAL-WORLD EXAMPLES: Industry use cases.
    4. CONCEPTUAL SUMMARY: One paragraph for quick review.
    5. EXAM FOCUS: 3 potential questions.
    
    Output Format: Markdown.
    """
    
    response = model.generate_content(prompt)
    return response.text
