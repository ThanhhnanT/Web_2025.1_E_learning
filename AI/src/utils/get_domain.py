from langchain.prompts import PromptTemplate
from src.utils.initialize_llms import initialize_llm
from langchain.chains import LLMChain
from rapidfuzz import process
import re

def get_domain(text: str):
    DOMAIN_SYNONYMS = {
        "computer vision": ["cv", "comput vision", "comp vision", "vision"],
        "nlp": ["natural language processing", "language ai", "text ai"],
        "machine learning": ["ml", "machine learn", "machin learning"],
    }

    llm = initialize_llm()

    prompt = PromptTemplate(
        input_variables=["user_input"],
        template="""
    Extract the main domain or topic from the following sentence. 
    CRITICAL RULES:
    1. If the input is in Vietnamese or any other non-English language, you MUST translate it to English first
    2. You MUST return ONLY the domain name in English
    3. Return ONLY the English keyword or phrase, no explanations, no additional text
    4. Use standard English domain names like: "computer vision", "natural language processing", "machine learning", "nlp", "ml", "cv"
    
    Input: "{user_input}"
    
    Examples:
    - Input: "Tôi muốn học thị giác máy tính" -> Output: "computer vision"
    - Input: "I want to learn computer vision" -> Output: "computer vision"
    - Input: "Học xử lý ngôn ngữ tự nhiên" -> Output: "natural language processing"
    - Input: "Natural language processing" -> Output: "natural language processing"
    - Input: "Học máy" -> Output: "machine learning"
    
    Now extract the domain from the input above. Return ONLY the English domain name:
    """
    )

    chain = LLMChain(llm=llm, prompt=prompt)

    result = chain.run({"user_input": text})
    result = result.lower().strip()
    
    # Remove quotes, extra whitespace, and common prefixes/suffixes that LLM might add
    result = re.sub(r'^(output|result|domain|answer):\s*', '', result, flags=re.IGNORECASE)
    result = re.sub(r'["\']', '', result)  # Remove quotes
    result = re.sub(r'\s+', ' ', result)  # Normalize whitespace
    result = result.strip()
    
    # Only remove characters that are definitely not part of English domain names
    # Keep letters, numbers, spaces, and hyphens (for phrases like "natural-language-processing")
    result = re.sub(r'[^a-z0-9\s-]', '', result)
    result = result.strip()

    all_labels = list(DOMAIN_SYNONYMS.keys())
    for synonyms in DOMAIN_SYNONYMS.values():
        all_labels.extend(synonyms)

    # Fuzzy match
    best_match, score, _ = process.extractOne(result, all_labels)

    if score > 70:
        for domain, synonyms in DOMAIN_SYNONYMS.items():
            if best_match == domain or best_match in synonyms:
                return domain
    
    if result and any(char.isalpha() for char in result):
        if any(keyword in result for keyword in ["vision", "cv", "computer"]):
            return "computer vision"
        elif any(keyword in result for keyword in ["nlp", "language", "processing", "natural"]):
            return "nlp"
        elif any(keyword in result for keyword in ["machine", "learning", "ml"]):
            return "machine learning"
        # Return the cleaned English result as fallback
        return result

    return None