# LangChain Agents & Memory
from langchain.agents import AgentType, initialize_agent, Tool
from langchain.memory import ConversationBufferMemory
from typing import List, Union, Dict, Any
from langchain_community.vectorstores import Chroma
from langchain_community.utilities import WikipediaAPIWrapper
from src.utils.vector_store import get_similar_docs
import sys


def create_agent(domain:str ,level: str,llm: Any, vector_store: Chroma, memory: ConversationBufferMemory) -> Any:

    try:
        wiki = WikipediaAPIWrapper()
        
        # Wrapper function to ensure retrieval_roadmap always uses English domain
        def retrieval_roadmap_wrapper(query: str):
            # Force use of English domain, ignore query if it's not English
            return get_similar_docs(domain, vector_store, level, file_type="Skills_Subskills_Roadmap", domain=domain)

        tools = [
            Tool.from_function(
                func=lambda q: get_similar_docs(q, vector_store, level, file_type="Youtube_links_subskills", domain=domain),
                name="retrieval_youtube_links",
                description="Useful for get youtube link of subskill."
            ),
            Tool.from_function(
                func=lambda q: get_similar_docs(q, vector_store, level, file_type="Theory", domain=domain),
                name="retrieval_theory",
                description="Useful for get theory of subskill."
            ),
            Tool.from_function(
                func=lambda q: get_similar_docs(q, vector_store, level, file_type="Question", domain=domain),
                name="retrieval_question",
                description="Useful for get question of subskill."
            ),
            Tool.from_function(
                func=retrieval_roadmap_wrapper,
                name="retrieval_roadmap",
                description=f"Useful for getting roadmap. This tool automatically uses the English domain '{domain}'. You can call it with any input, but it will use '{domain}' internally."
            ),
            Tool.from_function(
                func=wiki.run,
                name="Wikipedia",
                description="Useful for answering general knowledge questions using Wikipedia."
            ),
        ]

        agent = initialize_agent(
            tools=tools,
            llm=llm,
            agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
            memory=memory,
            verbose=True,
            handle_parsing_errors=True
        )
        return agent
    except Exception as e:
        print(f"Error creating agent: {e}")
        sys.exit(1)
