import os
import google.generativeai as genai
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import json
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

def classify_intent(text):
    prompt = f"""
    CLASSIFY STUDENT INTENT
    Text: "{text}"
    
    Classes:
    - ACADEMIC_QUERY (questions about subjects, facts)
    - ADMINISTRATIVE (attendance, schedule, grades)
    - GENERAL (greeting, feedback, small talk)
    
    Output Format: JSON with key 'intent'
    """
    
    response = model.generate_content(prompt)
    try:
        data = json.loads(response.text.replace('```json', '').replace('```', '').strip())
        return data.get('intent', 'GENERAL')
    except:
        return 'GENERAL'

def extract_keywords(text):
    prompt = f"""
    EXTRACT KEYWORDS
    Text: "{text}"
    
    Limit to 5-7 key academic or technical entities.
    Output Format: JSON list 'keywords'
    """
    
    response = model.generate_content(prompt)
    try:
        data = json.loads(response.text.replace('```json', '').replace('```', '').strip())
        return data.get('keywords', [])
    except:
        return []

def calculate_similarity(text1, text2):
    tfidf = TfidfVectorizer().fit_transform([text1, text2])
    return cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]
