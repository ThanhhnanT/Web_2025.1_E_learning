"""
Content Extractors for Different IELTS Question Types

Extracts question text, options, diagrams, tables, etc. for all 14 IELTS question types.
"""

from typing import Dict, List, Optional, Any
from bs4 import Tag, BeautifulSoup
import re


class ContentExtractors:
    """Extract content for different question types"""
    
    @staticmethod
    def extract_question_text(question_html: str, question_number: int) -> str:
        """
        Extract the actual question text from HTML
        Looks for patterns like "1. Question text" or "Question 1: text"
        """
        soup = BeautifulSoup(question_html, 'html.parser')
        
        # Try to find question text near the question number
        # Pattern 1: <strong>1</strong> Question text
        for strong in soup.find_all('strong'):
            text = strong.get_text(strip=True)
            if text == str(question_number) or text == f"{question_number}.":
                # Get the text after this strong tag
                next_text = []
                for sibling in strong.next_siblings:
                    if isinstance(sibling, str):
                        next_text.append(sibling.strip())
                    elif isinstance(sibling, Tag):
                        if sibling.name == 'strong':
                            break  # Next question
                        next_text.append(sibling.get_text(' ', strip=True))
                if next_text:
                    return ' '.join(next_text).strip(': .')
        
        # Pattern 2: Question {number} text or {number}. text
        for elem in soup.find_all(['p', 'li', 'div']):
            text = elem.get_text(' ', strip=True)
            # Look for "Question 1:" or "1." at start
            pattern = rf'^(?:Question\s+)?{question_number}[\.:]\s*(.+)'
            match = re.match(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        # Fallback: just return Question {number}
        return f"Question {question_number}"
    
    @staticmethod
    def extract_mcq_options(question_html: str) -> List[Dict[str, str]]:
        """
        Extract multiple choice options (A, B, C, D, etc.)
        Returns list of {key: 'A', text: 'Option text'}
        """
        soup = BeautifulSoup(question_html, 'html.parser')
        options = []
        
        # Pattern 1: Look for lists with options
        for li in soup.find_all('li'):
            text = li.get_text(' ', strip=True)
            # Match "A Option text" or "A. Option text"
            match = re.match(r'^([A-H])[\.\)]\s*(.+)', text)
            if match:
                key, option_text = match.groups()
                options.append({'key': key, 'text': option_text.strip()})
        
        # Pattern 2: Options in paragraphs
        if not options:
            for p in soup.find_all('p'):
                text = p.get_text(' ', strip=True)
                match = re.match(r'^([A-H])[\.\)]\s*(.+)', text)
                if match:
                    key, option_text = match.groups()
                    options.append({'key': key, 'text': option_text.strip()})
        
        # Pattern 3: Inline options in text
        if not options:
            text = soup.get_text(' ', strip=True)
            # Find all A) ... B) ... C) ... patterns
            parts = re.split(r'\b([A-H])\)', text)
            current_key = None
            for i, part in enumerate(parts):
                if i % 2 == 1:  # Odd indices are the keys
                    current_key = part
                elif current_key and part.strip():
                    options.append({'key': current_key, 'text': part.strip()})
        
        return options
    
    @staticmethod
    def extract_matching_list(html_section: str) -> List[Dict[str, str]]:
        """
        Extract matching options (i, ii, iii or A, B, C)
        Used for matching headings, features, sentence endings
        """
        soup = BeautifulSoup(html_section, 'html.parser')
        options = []
        
        # Look for roman numerals or letters
        for li in soup.find_all('li'):
            text = li.get_text(' ', strip=True)
            # Roman numerals: i, ii, iii, iv, etc.
            match = re.match(r'^([ivxIVX]+|[A-H])[\.\)]\s*(.+)', text)
            if match:
                key, option_text = match.groups()
                options.append({'key': key, 'text': option_text.strip()})
        
        return options
    
    @staticmethod
    def extract_diagram_url(html_section: str) -> Optional[str]:
        """Extract diagram/map/plan image URL"""
        soup = BeautifulSoup(html_section, 'html.parser')
        
        # Look for img tags
        img = soup.find('img')
        if img and img.get('src'):
            return img['src'].split('?')[0]  # Remove query params
        
        return None
    
    @staticmethod
    def extract_table_structure(html_section: str) -> Optional[Dict[str, Any]]:
        """
        Extract table structure with headers and cells
        Returns table data for context
        """
        soup = BeautifulSoup(html_section, 'html.parser')
        table = soup.find('table')
        
        if not table:
            return None
        
        headers = []
        rows = []
        
        # Extract headers
        for th in table.find_all('th'):
            headers.append(th.get_text(' ', strip=True))
        
        # Extract rows
        for tr in table.find_all('tr'):
            row_data = []
            for td in tr.find_all(['td', 'th']):
                cell_text = td.get_text(' ', strip=True)
                row_data.append(cell_text)
            if row_data:
                rows.append(row_data)
        
        return {
            'headers': headers,
            'rows': rows,
            'tableHtml': str(table)
        }
    
    @staticmethod
    def find_question_in_table(table_data: Dict, question_number: int) -> Optional[Dict]:
        """Find where a question number appears in a table"""
        if not table_data:
            return None
        
        pattern = rf'_*{question_number}_*|{{{question_number}}}|\({question_number}\)'
        
        for row_idx, row in enumerate(table_data['rows']):
            for col_idx, cell in enumerate(row):
                if re.search(pattern, cell):
                    return {
                        'row': row_idx,
                        'column': col_idx,
                        'columnHeader': table_data['headers'][col_idx] if col_idx < len(table_data['headers']) else '',
                        'rowData': row
                    }
        
        return None
    
    @staticmethod
    def extract_paragraph_labels(html_section: str) -> List[str]:
        """
        Extract paragraph labels (A, B, C, D, etc.) for matching headings
        """
        soup = BeautifulSoup(html_section, 'html.parser')
        labels = []
        
        # Look for paragraph headings like "Paragraph A", "A", etc.
        for elem in soup.find_all(['h4', 'h5', 'strong', 'b']):
            text = elem.get_text(strip=True)
            # Match single capital letter or "Paragraph X"
            if re.fullmatch(r'[A-Z]', text):
                labels.append(text)
            elif re.match(r'Paragraph\s+([A-Z])', text, re.IGNORECASE):
                match = re.match(r'Paragraph\s+([A-Z])', text, re.IGNORECASE)
                labels.append(match.group(1))
        
        return labels
    
    @staticmethod
    def extract_instructions(html_section: str) -> str:
        """Extract the instructions/directions for a question group"""
        soup = BeautifulSoup(html_section, 'html.parser')
        
        # Common instruction patterns
        instruction_keywords = [
            'complete the', 'choose the correct', 'label the', 
            'match', 'write', 'answer the questions', 'classify'
        ]
        
        # Look for emphasized text with instructions
        for elem in soup.find_all(['p', 'div', 'strong']):
            text = elem.get_text(' ', strip=True)
            lower_text = text.lower()
            if any(keyword in lower_text for keyword in instruction_keywords):
                if len(text) < 300:  # Instructions are usually concise
                    return text
        
        return ""
    
    @staticmethod
    def extract_context_for_fill_in(question_html: str, question_number: int) -> str:
        """
        Extract the context sentence with blank for fill-in-the-blank questions
        E.g., "The hotel is called ___"
        """
        soup = BeautifulSoup(question_html, 'html.parser')
        
        # Look for text with blanks (__, ___, ......., etc.)
        for elem in soup.find_all(['p', 'li', 'div']):
            text = elem.get_text(' ', strip=True)
            if '_' in text or '.....' in text or '………' in text:
                # Check if this is near our question number
                if str(question_number) in text or f"({question_number})" in text:
                    return text
        
        # Fallback
        return ContentExtractors.extract_question_text(question_html, question_number)

