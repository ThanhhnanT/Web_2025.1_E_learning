from typing import List, Union, Dict, Any

def create_learning_path(agent: Any, skill: str, subskill: str, level: str, day: int = 1) -> str:
    try:
        prompt = f"""
        You are a helpful AI assistant designed to create personalized learning paths.
        The user wants to know what should user learn with {subskill}.
        Return JSON in the following format:

        {{
          "day": {day},
          "skill": "{skill}",
          "subskill": "{subskill}",
          "youtube_links": "youtube_link of subskill",
          "theory": "Theory of subskill",
          "question_review": [
            {{
              "id": "Question_ID",
              "question_text": "The question text",
              "options": [
                "A. ...",
                "B. ...",
                "C. ...",
                "D. ..."
              ],
              "correct_answer": "Correct option (Example: B)",
              "level" : "difficult level of questions"
            }}
          ]
        }}

        IMPORTANT RULES:
        To indentify required information, you follow these actions
        - Firstly you MUST call the tool (retrieval_youtube_links) to retrieve youtube link, then retrival theory.
        - For theory, you MUST call the tool (retrieval_theory) to retrieve theory, then retrival question_review.
        - For question_review, you MUST call the tool (retrieval_questions) to retrieve all questions you can see, then THOUGHT "I now know the final answer" and RETURN FINAL ANSWER NOW.
        - You MUST NOT RETURN Observation: Invalid Format: Missing 'Action:' after 'Thought'
        """

        prompt += f"""
            Action: the action to take, should be one of the tools
            Action Input: the input to the action
            Observation: the result of the action
            ...
            Final Answer: summary of the final process or a prompt for the user
        """
        return agent.run(prompt.strip())
    except Exception as e:
        print(f"Error creating learning path: {e}")
        return "Sorry, I could not create a learning path."



def create_roadmap(agent: Any, learning_goal: str, user_knowledge: str = "", domain: str = None) -> str:

    try:
        # Use English domain for tool calls, but keep original learning_goal for context
        domain_for_tools = domain if domain else learning_goal
        
        prompt = f"""
                You are a helpful AI assistant designed to create personalized roadmap.
                The user's learning goal is: "{learning_goal}".
                """
        if user_knowledge:
            prompt += f'The user already has some prior knowledge: "{user_knowledge}".'
        prompt += f"""
                    The domain for this learning goal in English is: "{domain_for_tools}"
                    
                    Return your result in JSON format with the following structure:
                    {{
                      "skills": {{
                        "skill 1": [subskill of skill 1],
                        "skill 2": [subskill of skill 2],
                      }}
                    }}
        """
        prompt += f"""
          CRITICAL RULES FOR TOOL USAGE:
          - When you call the tool (retrieval_roadmap), you MUST use ONLY the English domain name: "{domain_for_tools}"
          - DO NOT use the original learning goal "{learning_goal}" in the tool call if it's not in English
          - The Action Input for retrieval_roadmap MUST be: "{domain_for_tools}"
          - After using the tool, thought "I now know the final answer" and return final answer.
          """
        return agent.run(prompt.strip())
    except Exception as e:
        print(f"Error creating roadmap: {e}")
        return "Sorry, I could not create a roadmap."


