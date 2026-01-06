"""
IELTS Practice Test Spider - Crawl FULL question text

Crawls from practice-cam-XX-listening-test-XX pages which have:
- Full question text
- Audio URLs
- Complete answers
- Clear structure
"""

from __future__ import annotations

import os
import re
from datetime import datetime, timezone
from typing import List, Dict, Set

import scrapy
from bs4 import BeautifulSoup

from ..items import IeltsTestItem
from ..utils.parsers import slug_from_url, normalise_space


class IeltsPracticeSpider(scrapy.Spider):
    name = "ielts_practice"
    allowed_domains = ["ieltstrainingonline.com"]
    
    # Crawl Cambridge IELTS 15-20, Tests 1-4 for both skills
    def start_requests(self):
        """Generate all test URLs"""
        
        for series in range(15, 21):  # Cambridge 15-20
            for test_num in range(1, 5):  # Test 1-4
                # Format: test-01, test-02, etc.
                test_str = f"{test_num:02d}"
                
                # Listening test
                listening_url = (
                    f"https://ieltstrainingonline.com/"
                    f"practice-cam-{series}-listening-test-{test_str}-with-answer-and-audioscripts/"
                )
                yield scrapy.Request(
                    listening_url,
                    callback=self.parse_test,
                    cb_kwargs={'skill': 'listening', 'series': series, 'test_num': test_num}
                )
                
                # Reading test
                reading_url = (
                    f"https://ieltstrainingonline.com/"
                    f"practice-cam-{series}-reading-test-{test_str}-with-answer/"
                )
                yield scrapy.Request(
                    reading_url,
                    callback=self.parse_test,
                    cb_kwargs={'skill': 'reading', 'series': series, 'test_num': test_num}
                )

    def parse_test(self, response: scrapy.http.Response, skill: str, series: int, test_num: int):
        """Parse test page with full question text"""
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract title
        title = f"Cambridge IELTS {series} {skill.title()} Test {test_num}"
        
        # Extract parts (1-4)
        parts = self._extract_parts(soup, skill)
        
        if not parts:
            self.logger.warning(f"No parts found: {response.url}")
            return
        
        # Extract answers
        answer_parts = self._extract_answers(soup)
        
        if not answer_parts:
            self.logger.warning(f"No answers found: {response.url}")
            return
        
        # Build structures
        question_content = {
            "skill": skill,
            "title": title,
            "sourceUrl": response.url,
            "series": f"Cambridge IELTS {series}",
            "testNumber": f"Test {test_num}",
            "retrievedAt": datetime.now(timezone.utc).isoformat(),
            "parts": parts,
        }
        
        answer_payload = {
            "skill": skill,
            "sourceUrl": response.url,
            "parts": answer_parts,
        }
        
        total_questions = sum(len(part.get('answers', [])) for part in answer_parts)
        
        item = IeltsTestItem(
            skill=skill,
            title=title,
            series=f"Cambridge IELTS {series}",
            test_number=f"Test {test_num}",
            source_url=response.url,
            test_code=slug_from_url(response.url),
            question_content=question_content,
            answer_payload=answer_payload,
            total_questions=total_questions,
            duration_minutes=30 if skill == 'listening' else 60,
        )
        
        self.logger.info(f"✅ Scraped: {title} ({total_questions} questions)")
        yield item

    def _extract_parts(self, soup: BeautifulSoup, skill: str) -> List[Dict]:
        """Extract parts with FULL question text"""
        
        parts = []
        
        # Find main content area
        article = soup.find('article') or soup.find('div', id='main-content')
        if not article:
            return parts
        
        # Find all PART headers (look for h3 containing "PART")
        for h3 in article.find_all('h3'):
            h3_text = h3.get_text(strip=True)
            match = re.search(r'PART\s+(\d+)', h3_text, re.I)
            if not match:
                continue
            
            part_number = int(match.group(1))
            
            # Extract audio URL (look for next audio link after PART header)
            audio_url = None
            if skill == 'listening':
                audio_link = h3.find_next('a', href=re.compile(r'\.mp3|\.MP3', re.I))
                if audio_link:
                    audio_url = audio_link.get('href')
                    self.logger.debug(f"Found audio for Part {part_number}: {audio_url}")
            
            # Collect all content until next PART header
            part_html_elements = []
            current = h3.find_next_sibling()
            
            while current:
                # Stop at next PART
                if current.name == 'h3' and re.search(r'PART\s+\d+', current.get_text(), re.I):
                    break
                # Stop at Answer section
                if current.name in ['h2', 'h3'] and re.search(r'Answer', current.get_text(), re.I):
                    break
                part_html_elements.append(str(current))
                current = current.find_next_sibling()
            
            part_html = '\n'.join(part_html_elements)
            
            # Extract question sections from this part
            question_sections = self._extract_question_sections_from_html(part_html)
            
            part_data = {
                'part': part_number,
                'title': f'Part {part_number}',
                'questionRange': self._get_question_range_from_sections(question_sections, part_number),
                'questionSections': question_sections,
            }
            
            if audio_url:
                part_data['audio'] = audio_url
            
            parts.append(part_data)
            self.logger.debug(f"Part {part_number}: {len(question_sections)} sections")
        
        return parts

    def _extract_question_sections_from_html(self, part_html: str) -> List[Dict]:
        """Extract question sections with full text from part HTML"""
        
        soup = BeautifulSoup(part_html, 'html.parser')
        sections = []
        
        # Find all elements containing "Questions X-Y" or "Questions X–Y"
        for elem in soup.find_all(['p', 'span', 'strong']):
            text = elem.get_text(strip=True)
            
            # Match "Questions 1-10" or "Questions 1–10" (with en-dash)
            match = re.search(r'Questions?\s+(\d+)\s*[–-]\s*(\d+)', text, re.I)
            if not match:
                # Try single question: "Question 11"
                match = re.search(r'Questions?\s+(\d+)', text, re.I)
                if match:
                    start_q = end_q = int(match.group(1))
                else:
                    continue
            else:
                start_q = int(match.group(1))
                end_q = int(match.group(2))
            
            heading = text
            
            # Find parent container (usually et_pb_text_inner)
            parent = elem.find_parent('div', class_='et_pb_text_inner')
            if not parent:
                parent = elem.parent
            
            # Extract instructions (next <em> or <p> with instructions)
            instructions = ""
            for next_p in parent.find_all(['p', 'em'], limit=5):
                inst_text = next_p.get_text(strip=True)
                if any(kw in inst_text.lower() for kw in 
                      ['complete', 'choose', 'write', 'select', 'match', 'word']):
                    instructions = inst_text
                    break
            
            # Get section HTML (all siblings until next "Questions" header)
            section_html_parts = [str(elem)]
            current = elem
            for _ in range(30):
                current = current.find_next()
                if not current:
                    break
                # Stop at next Questions header
                if re.search(r'Questions?\s+\d+', current.get_text(), re.I):
                    break
                section_html_parts.append(str(current))
            
            section_html = '\n'.join(section_html_parts)
            
            # Extract questions
            questions = self._extract_questions_from_section(
                section_html, start_q, end_q, instructions
            )
            
            sections.append({
                'heading': heading,
                'instructions': instructions,
                'questionRange': [start_q, end_q],
                'questions': questions,
                'html': section_html
            })
            
            self.logger.debug(f"Section {heading}: {len(questions)} questions")
        
        return sections

    def _extract_questions_from_section(
        self, 
        html: str, 
        start_q: int, 
        end_q: int,
        instructions: str
    ) -> List[Dict]:
        """Extract individual questions with full text"""
        
        soup = BeautifulSoup(html, 'html.parser')
        questions = []
        
        # Detect question type from instructions
        question_type = 'fill_in_blank'  # default
        if 'choose' in instructions.lower() and 'letter' in instructions.lower():
            question_type = 'multiple_choice'
        elif 'true' in instructions.lower() and 'false' in instructions.lower():
            question_type = 'true_false_notgiven'
        
        for q_num in range(start_q, end_q + 1):
            # Find question text
            question_text = self._find_question_text_in_html(soup, q_num, question_type)
            
            # Extract options for MCQ
            options = []
            if question_type == 'multiple_choice':
                options = self._extract_mcq_options_for_question(soup, q_num)
            
            questions.append({
                'questionNumber': q_num,
                'questionText': question_text,
                'questionType': question_type,
                'options': options
            })
        
        return questions

    def _find_question_text_in_html(self, soup: BeautifulSoup, q_num: int, question_type: str) -> str:
        """Find question text for a specific question number"""
        
        # For MCQ - look for "11 What is..." pattern
        if question_type == 'multiple_choice':
            for p in soup.find_all('p'):
                text = p.get_text(strip=True)
                # Pattern: "11 Text" or "**11** Text"  
                pattern = rf'^\**{q_num}\**\s+(.+?)(?:_+|$)'
                match = re.match(pattern, text)
                if match:
                    return match.group(1).strip()
        
        # Look in table cells (for form/table completion)
        for td in soup.find_all('td'):
            html_str = str(td)
            # Check for **1**, **2**, etc. or just numbers
            if f'**{q_num}**' in html_str or f'<strong>{q_num}</strong>' in html_str:
                # Get context from cell and surrounding cells
                row = td.find_parent('tr')
                if row:
                    # Get column header if exists
                    table = row.find_parent('table')
                    header_row = table.find('tr') if table else None
                    col_index = list(row.find_all(['td', 'th'])).index(td)
                    
                    header_text = ""
                    if header_row:
                        headers = header_row.find_all(['td', 'th'])
                        if col_index < len(headers):
                            header_text = headers[col_index].get_text(strip=True)
                    
                    # Get cell text with blank marker
                    cell_text = td.get_text(strip=True)
                    # Clean up to show question
                    cell_text = re.sub(rf'\**{q_num}\**', '', cell_text).strip()
                    
                    if header_text and cell_text:
                        return f"{header_text}: {cell_text}"
                    elif cell_text:
                        return cell_text
                    else:
                        return header_text or f"Question {q_num}"
        
        # Look for paragraph with question number
        for p in soup.find_all('p'):
            text = p.get_text()
            if f' {q_num} ' in text or f'{q_num}.' in text or f'{q_num})' in text:
                return text.strip()
        
        return f"Question {q_num}"

    def _extract_mcq_options_for_question(self, soup: BeautifulSoup, q_num: int) -> List[Dict]:
        """Extract MCQ options A, B, C, D for a specific question"""
        
        options = []
        
        # Find question first
        question_found = False
        for elem in soup.find_all('p'):
            text = elem.get_text(strip=True)
            
            # Check if this paragraph contains the question number
            if re.match(rf'^\**{q_num}\**\s+', text):
                question_found = True
                # Try to find options in next siblings
                current = elem.find_next_sibling('p')
                for _ in range(10):
                    if not current:
                        break
                    opt_text = current.get_text(strip=True)
                    # Match "A text" or "**A** text"
                    match = re.match(r'^\**([A-E])\**\s+(.+)', opt_text)
                    if match:
                        options.append({
                            'key': match.group(1),
                            'text': match.group(2).strip()
                        })
                    # Stop at next question or if we have enough options
                    if re.match(r'^\**\d+\**\s+', opt_text) or len(options) >= 5:
                        break
                    current = current.find_next_sibling('p')
                break
        
        return options

    def _get_question_range_from_sections(self, sections: List[Dict], part_number: int) -> List[int]:
        """Get question range from sections or use default"""
        
        if sections:
            all_ranges = [s['questionRange'] for s in sections]
            if all_ranges:
                min_q = min(r[0] for r in all_ranges)
                max_q = max(r[1] for r in all_ranges)
                return [min_q, max_q]
        
        # Default ranges based on part number
        default_ranges = {
            1: [1, 10],
            2: [11, 20],
            3: [21, 30],
            4: [31, 40]
        }
        
        return default_ranges.get(part_number, [1, 10])

    def _extract_answers(self, soup: BeautifulSoup) -> List[Dict]:
        """Extract answers from answer section"""
        
        answer_parts = []
        
        # Find answer section
        answer_heading = soup.find(['h2', 'h3'], string=re.compile(r'Answer', re.I))
        
        if not answer_heading:
            return answer_parts
        
        # Get answer content (usually in a div or following siblings)
        answer_content = answer_heading.find_next(['div', 'section'])
        if not answer_content:
            answer_content = answer_heading.parent
        
        # Find Part headers in answers (Part 1, Part 2, etc.)
        part_headers = answer_content.find_all(['h5', 'h6', 'strong'], 
                                               string=re.compile(r'Part\s+\d+', re.I))
        
        for header in part_headers:
            match = re.search(r'Part\s+(\d+)', header.get_text(), re.I)
            if not match:
                continue
            
            part_num = int(match.group(1))
            
            # Get answers for this part
            answers = []
            current = header.find_next_sibling()
            
            for _ in range(20):  # Max 20 elements
                if not current:
                    break
                
                # Stop at next Part header
                if current.name in ['h5', 'h6', 'strong'] and \
                   re.search(r'Part\s+\d+', current.get_text(), re.I):
                    break
                
                # Parse answer line: "1 fish", "11 A", "21&22 C, E"
                text = current.get_text(strip=True)
                
                # Pattern: number(s) answer(s)
                match = re.match(r'(\d+(?:&\d+)?)\s+(.+)', text)
                if match:
                    q_nums_str = match.group(1)
                    answer_str = match.group(2)
                    
                    # Parse question numbers (handle "21&22")
                    q_nums = [int(n) for n in re.findall(r'\d+', q_nums_str)]
                    
                    # Parse answers (handle "C, E" or "fish")
                    answer_values = [v.strip() for v in re.split(r'[,/]', answer_str)]
                    
                    for q_num in q_nums:
                        answers.append({
                            'question': q_num,
                            'raw': answer_str,
                            'value': answer_values
                        })
                
                current = current.find_next_sibling()
            
            if answers:
                questions = [a['question'] for a in answers]
                answer_parts.append({
                    'part': part_num,
                    'questionRange': [min(questions), max(questions)],
                    'answers': answers
                })
        
        return answer_parts

