from langchain.prompts import PromptTemplate
from src.utils.initialize_llms import initialize_llm
from langchain.chains import LLMChain

def generate_course_title(user_input: str) -> str:
    """
    Generate a beautiful, standardized course title from user input.
    Examples:
    - "nlp" -> "Natural Language Processing" or "Xử lý ngôn ngữ tự nhiên"
    - "cv" -> "Computer Vision" or "Thị giác máy tính"
    - "ml" -> "Machine Learning" or "Học máy"
    """
    llm = initialize_llm()

    prompt = PromptTemplate(
        input_variables=["user_input"],
        template="""
You are a helpful assistant that generates beautiful, professional course titles.

Given a user input (which might be an abbreviation, short phrase, or full description), generate a proper, full course title.

RULES:
1. If the input is an abbreviation (like "nlp", "cv", "ml"), expand it to the full English name
2. The title should be professional, clear, and descriptive
3. Use proper capitalization (Title Case)
4. Return ONLY the title, no explanations, no quotes, no additional text
5. If the input is already a good title, keep it but improve capitalization if needed

Examples:
- Input: "nlp" -> Output: "Natural Language Processing"
- Input: "cv" -> Output: "Computer Vision"
- Input: "ml" -> Output: "Machine Learning"
- Input: "python data science" -> Output: "Python for Data Science"
- Input: "học máy" -> Output: "Machine Learning"
- Input: "xử lý ngôn ngữ tự nhiên" -> Output: "Natural Language Processing"
- Input: "I want to learn NLP" -> Output: "Natural Language Processing"
- Input: "Computer Vision" -> Output: "Computer Vision"

Now generate the course title for: "{user_input}"

Course Title:
"""
    )

    chain = LLMChain(llm=llm, prompt=prompt)
    result = chain.run({"user_input": user_input})
    
    # Clean up the result
    result = result.strip()
    # Remove quotes if present
    result = result.strip('"\'')
    # Remove common prefixes
    result = result.replace("Course Title:", "").strip()
    result = result.replace("Title:", "").strip()
    result = result.replace("Output:", "").strip()
    
    return result

