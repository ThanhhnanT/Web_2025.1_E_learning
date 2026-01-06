"""
IELTS Buddy Spider - Crawl full question text

Crawls IELTS tests from ieltsbuddy.com with FULL question text
"""

from __future__ import annotations

import os
import re
from datetime import datetime, timezone
from typing import List, Dict, Any

import scrapy
from bs4 import BeautifulSoup

from ..items import IeltsTestItem
from ..utils.parsers import slug_from_url, normalise_space


class IeltsBuddySpider(scrapy.Spider):
    name = "ielts_buddy"
    allowed_domains = ["ieltsbuddy.com"]
    
    start_urls = [
        "https://www.ieltsbuddy.com/ielts-listening-test.html",
        "https://www.ieltsbuddy.com/ielts-listening-practice-test.html",
        "https://www.ieltsbuddy.com/ielts-reading-test.html",
        "https://www.ieltsbuddy.com/ielts-reading-practice-test.html",
    ]

    def parse(self, response: scrapy.http.Response):
        """Parse test page and extract questions, audio, answers"""
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Determine skill from URL
        skill = 'listening' if 'listening' in response.url else 'reading'
        
        # Extract title
        title_elem = soup.find('h1')
        title = title_elem.get_text(strip=True) if title_elem else f"IELTS Buddy {skill.title()} Test"
        
        # Extract parts (sections 1-4)
        parts = self._extract_parts(soup, skill, response.url)
        
        if not parts:
            self.logger.warning(f"No parts found on {response.url}")
            return
        
        # Extract answers
        answer_parts = self._extract_answers(soup)
        
        # Build question content
        question_content = {
            "skill": skill,
            "title": title,
            "sourceUrl": response.url,
            "series": "IELTS Buddy",
            "testNumber": "Practice Test",
            "retrievedAt": datetime.now(timezone.utc).isoformat(),
            "parts": parts,
        }
        
        # Build answer payload
        answer_payload = {
            "skill": skill,
            "sourceUrl": response.url,
            "parts": answer_parts,
        }
        
        # Count total questions
        total_questions = sum(len(part['answers']) for part in answer_parts)
        
        # Create item
        item = IeltsTestItem(
            skill=skill,
            title=title,
            series="IELTS Buddy",
            test_number="Practice Test",
            source_url=response.url,
            test_code=slug_from_url(response.url),
            question_content=question_content,
            answer_payload=answer_payload,
            total_questions=total_questions,
            duration_minutes=30 if skill == 'listening' else 60,
        )
        
        self.logger.info(f"Scraped: {title} ({total_questions} questions)")
        yield item

    def _extract_parts(self, soup: BeautifulSoup, skill: str, url: str) -> List[Dict]:
        """Extract test parts with full question text"""
        parts = []
        
        # Find section headings (Questions 1-10, Questions 11-20, etc.)
        section_pattern = re.compile(r'Questions?\s+(\d+)\s*[-–]\s*(\d+)', re.IGNORECASE)
        
        # Get all text content
        content = soup.find('div', class_='content') or soup.find('article') or soup.body
        
        if not content:
            return parts
        
        # Find all section headers
        section_headers = []
        for elem in content.find_all(['p', 'h2', 'h3', 'strong']):
            text = elem.get_text(strip=True)
            match = section_pattern.search(text)
            if match:
                start_q = int(match.group(1))
                end_q = int(match.group(2))
                section_headers.append({
                    'element': elem,
                    'start': start_q,
                    'end': end_q,
                    'text': text
                })
        
        # Determine part numbers (1-10 = Part 1, 11-20 = Part 2, etc.)
        for idx, header in enumerate(section_headers):
            part_number = (header['start'] - 1) // 10 + 1
            
            # Extract content between this header and next
            content_elem = header['element']
            
            # Collect all content until next section or end
            question_html = []
            for sibling in content_elem.find_all_next():
                # Stop at next section header
                if sibling in [h['element'] for h in section_headers[idx+1:]][:1]:
                    break
                question_html.append(str(sibling))
            
            question_html_str = '\n'.join(question_html)
            
            # Extract questions with full text
            questions = self._extract_questions_from_html(
                question_html_str, 
                header['start'], 
                header['end']
            )
            
            # Extract audio URL (for listening only)
            audio_url = None
            if skill == 'listening':
                audio_elem = content.find('audio') or content.find('source')
                if audio_elem:
                    audio_url = audio_elem.get('src') or audio_elem.parent.get('src')
            
            # Extract instructions
            instructions = self._extract_instructions(content_elem)
            
            part_data = {
                'part': part_number,
                'title': f'Part {part_number}',
                'questionRange': [header['start'], header['end']],
                'questions': questions,
                'instructions': instructions,
                'questionSections': [{
                    'heading': header['text'],
                    'html': question_html_str
                }]
            }
            
            if audio_url:
                part_data['audio'] = audio_url
            
            parts.append(part_data)
        
        return parts

    def _extract_questions_from_html(
        self, 
        html: str, 
        start_q: int, 
        end_q: int
    ) -> List[Dict]:
        """Extract individual questions with full text"""
        
        soup = BeautifulSoup(html, 'html.parser')
        questions = []
        
        # Pattern to match question numbers
        for q_num in range(start_q, end_q + 1):
            question_text = ""
            question_type = "fill_in_blank"  # Default
            options = []
            
            # Find question text
            # Pattern 1: "1. Question text <input>"
            pattern = rf'\b{q_num}[\.\)]\s*(.+?)(?:<input|$)'
            for elem in soup.find_all(['p', 'td', 'li']):
                text = elem.get_text(separator=' ', strip=True)
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    question_text = match.group(1).strip()
                    # Check for blanks
                    if '______' in text or '........' in text:
                        question_text = text
                    break
            
            # Pattern 2: In table cells
            if not question_text:
                for td in soup.find_all('td'):
                    if str(q_num) in td.get_text():
                        # Get surrounding context
                        row = td.find_parent('tr')
                        if row:
                            question_text = row.get_text(separator=' | ', strip=True)
                            break
            
            # Fallback
            if not question_text:
                question_text = f"Question {q_num}"
            
            # Detect question type from instructions
            lower_html = html.lower()
            if 'choose' in lower_html and 'letter' in lower_html:
                question_type = 'multiple_choice'
                # Extract options A, B, C, D
                option_pattern = r'([A-H])[\.\)]\s*([^\n<]+)'
                for match in re.finditer(option_pattern, html):
                    options.append({
                        'key': match.group(1),
                        'text': match.group(2).strip()
                    })
            elif 'true' in lower_html and 'false' in lower_html and 'not given' in lower_html:
                question_type = 'true_false_notgiven'
            elif 'complete the table' in lower_html:
                question_type = 'table_completion'
            
            questions.append({
                'questionNumber': q_num,
                'questionText': question_text,
                'questionType': question_type,
                'options': options
            })
        
        return questions

    def _extract_instructions(self, elem) -> str:
        """Extract instructions like 'Write NO MORE THAN TWO WORDS'"""
        
        instructions = []
        
        # Look for emphasized text with keywords
        for sibling in elem.find_all_next(['p', 'em', 'strong'], limit=5):
            text = sibling.get_text(strip=True)
            if any(keyword in text.lower() for keyword in [
                'complete', 'write', 'choose', 'no more than', 
                'one word', 'two words', 'three words'
            ]):
                instructions.append(text)
                if len(instructions) >= 2:
                    break
        
        return ' '.join(instructions)

    def _extract_answers(self, soup: BeautifulSoup) -> List[Dict]:
        """Extract answers from answer key section"""
        
        answer_parts = []
        
        # Find answer section (usually at bottom or in spoiler)
        answer_section = soup.find('div', class_='answer') or \
                        soup.find('div', id='answers') or \
                        soup.find('p', string=re.compile(r'Answer', re.I))
        
        if not answer_section:
            # Look for answers in text
            answer_section = soup
        
        # Extract answers
        # Pattern: "1. answer", "Question 1: answer", etc.
        answer_pattern = re.compile(r'(\d+)[\.\:\)]\s*([^\n\d]+)', re.IGNORECASE)
        
        answers_by_part = {}
        
        for match in answer_pattern.finditer(answer_section.get_text()):
            q_num = int(match.group(1))
            answer_text = match.group(2).strip()
            
            # Skip if looks like a question, not an answer
            if len(answer_text) > 100:
                continue
            
            # Determine part (1-10 = Part 1, etc.)
            part_num = (q_num - 1) // 10 + 1
            
            if part_num not in answers_by_part:
                answers_by_part[part_num] = []
            
            # Split multiple acceptable answers
            values = [v.strip() for v in re.split(r'[/,]', answer_text) if v.strip()]
            
            answers_by_part[part_num].append({
                'question': q_num,
                'raw': answer_text,
                'value': values
            })
        
        # Convert to list format
        for part_num in sorted(answers_by_part.keys()):
            answers = answers_by_part[part_num]
            questions = [a['question'] for a in answers]
            
            answer_parts.append({
                'part': part_num,
                'questionRange': [min(questions), max(questions)],
                'answers': answers
            })
        
        return answer_parts



