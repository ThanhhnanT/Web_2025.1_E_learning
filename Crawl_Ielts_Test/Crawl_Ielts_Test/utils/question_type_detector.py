"""
Question Type Detection for IELTS Tests

Detects all 14 IELTS question types based on instructions and answer patterns.
"""

from typing import Dict, List, Optional
import re


class QuestionTypeDetector:
    """Detects IELTS question types from instructions and answer data"""
    
    @staticmethod
    def detect_from_instructions(instructions: str, answer_value: List[str]) -> str:
        """
        Detect question type based on instructions text and answer format
        
        Returns question type string matching backend enum:
        - multiple_choice
        - multiple_choice_multiple_answers
        - fill_in_blank
        - sentence_completion
        - table_completion
        - diagram_labeling
        - matching (headings/features/endings)
        - true_false_notgiven
        - yes_no_notgiven
        - short_answer
        """
        lower_inst = instructions.lower()
        
        # Check for multiple choice patterns
        if "choose the correct letter" in lower_inst or "circle the correct letter" in lower_inst:
            # Check for multiple answers
            if any(keyword in lower_inst for keyword in ["choose two", "choose three", "two letters", "three letters"]):
                return "multiple_choice_multiple_answers"
            return "multiple_choice"
        
        # Check for True/False/Not Given
        if "true" in lower_inst and "false" in lower_inst and "not given" in lower_inst:
            return "true_false_notgiven"
        
        # Check for Yes/No/Not Given
        if "yes" in lower_inst and "no" in lower_inst and "not given" in lower_inst:
            return "yes_no_notgiven"
        
        # Check for completion types
        if "complete the" in lower_inst:
            if "table" in lower_inst:
                return "table_completion"
            if "flow" in lower_inst or "flowchart" in lower_inst:
                return "diagram_labeling"  # flow-chart is a type of diagram
            if "diagram" in lower_inst or "plan" in lower_inst or "map" in lower_inst:
                return "diagram_labeling"
            if "notes" in lower_inst or "summary" in lower_inst or "form" in lower_inst:
                return "sentence_completion"
            if "sentences" in lower_inst:
                return "sentence_completion"
            return "fill_in_blank"
        
        # Check for label diagram/map
        if "label" in lower_inst and ("diagram" in lower_inst or "plan" in lower_inst or "map" in lower_inst):
            return "diagram_labeling"
        
        # Check for matching types
        if "match" in lower_inst or "matching" in lower_inst:
            if "heading" in lower_inst:
                return "matching"  # matching_headings
            if "ending" in lower_inst:
                return "matching"  # matching_endings
            if "feature" in lower_inst or "information" in lower_inst:
                return "matching"  # matching_features
            return "matching"
        
        # Check for short answer
        if "short answer" in lower_inst or "answer the questions" in lower_inst:
            # Look for word limit
            if "no more than" in lower_inst or "one word" in lower_inst:
                return "short_answer"
        
        # Fallback: check answer format
        if answer_value and len(answer_value) > 0:
            first_value = answer_value[0]
            
            # Multiple choice if answer is single letter
            if re.fullmatch(r'[A-H]', first_value):
                if len(answer_value) > 1:
                    return "multiple_choice_multiple_answers"
                return "multiple_choice"
            
            # True/False/Not Given
            if first_value in ['TRUE', 'FALSE', 'NOT GIVEN', 'NOT']:
                return "true_false_notgiven"
            
            # Yes/No/Not Given
            if first_value in ['YES', 'NO', 'NOT GIVEN', 'NOT']:
                return "yes_no_notgiven"
        
        # Default to fill in blank
        return "fill_in_blank"
    
    @staticmethod
    def extract_word_limit(instructions: str) -> Optional[int]:
        """Extract word limit from instructions (e.g., 'NO MORE THAN TWO WORDS')"""
        lower_inst = instructions.lower()
        
        # Look for patterns like "no more than X words"
        match = re.search(r'no more than (\w+) word', lower_inst)
        if match:
            word = match.group(1)
            word_to_num = {
                'one': 1, 'two': 2, 'three': 3, 'four': 4,
                '1': 1, '2': 2, '3': 3, '4': 4
            }
            return word_to_num.get(word)
        
        # Look for "ONE WORD ONLY", "TWO WORDS", etc.
        match = re.search(r'(\w+) words? only', lower_inst)
        if match:
            word = match.group(1)
            word_to_num = {'one': 1, 'two': 2, 'three': 3}
            return word_to_num.get(word)
        
        return None
    
    @staticmethod
    def detect_group_type(instructions: str) -> str:
        """
        Detect question group type for QuestionGroup.groupType
        
        Returns group type string matching backend enum:
        - shared_passage
        - shared_instruction
        - diagram
        - table
        - form
        - note_completion
        - flow_chart
        - map
        - plan
        - multiple_choice
        - matching
        - short_answer
        """
        lower_inst = instructions.lower()
        
        if "diagram" in lower_inst:
            return "diagram"
        if "table" in lower_inst:
            return "table"
        if "flow" in lower_inst or "flowchart" in lower_inst:
            return "flow_chart"
        if "map" in lower_inst:
            return "map"
        if "plan" in lower_inst:
            return "plan"
        if "form" in lower_inst:
            return "form"
        if "note" in lower_inst or "summary" in lower_inst:
            return "note_completion"
        if "match" in lower_inst:
            return "matching"
        if "passage" in lower_inst:
            return "shared_passage"
        
        return "shared_instruction"

