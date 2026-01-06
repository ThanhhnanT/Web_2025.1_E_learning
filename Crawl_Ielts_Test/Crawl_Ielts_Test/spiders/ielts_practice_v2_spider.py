"""
IELTS Practice Spider V2 - Simplified and Accurate

Crawls practice-cam-XX pages with FULL question text
"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import List, Dict

import scrapy
from bs4 import BeautifulSoup, Tag

from ..items import IeltsTestItem
from ..utils.parsers import slug_from_url


class IeltsPracticeV2Spider(scrapy.Spider):
    name = "ielts_practice_v2"
    allowed_domains = ["ieltstrainingonline.com"]
    
    def start_requests(self):
        """Generate all test URLs for Cambridge IELTS 15-20"""
        
        for series in range(15, 21):
            for test_num in range(1, 5):
                test_str = f"{test_num:02d}"
                
                # Listening
                url = (f"https://ieltstrainingonline.com/"
                      f"practice-cam-{series}-listening-test-{test_str}-with-answer-and-audioscripts/")
                yield scrapy.Request(url, callback=self.parse,
                                   cb_kwargs={'skill': 'listening', 'series': series, 'test_num': test_num})
                
                # Reading
                url = (f"https://ieltstrainingonline.com/"
                      f"practice-cam-{series}-reading-test-{test_str}-with-answer/")
                yield scrapy.Request(url, callback=self.parse,
                                   cb_kwargs={'skill': 'reading', 'series': series, 'test_num': test_num})

    def parse(self, response, skill: str, series: int, test_num: int):
        """Parse test page"""
        
        soup = BeautifulSoup(response.text, 'html.parser')
        title = f"Cambridge IELTS {series} {skill.title()} Test {test_num}"
        
        # Find main article content only (not sidebar)
        article = soup.find('article') or soup.find('div', id='main-content')
        if not article:
            self.logger.warning(f"No article found: {response.url}")
            return
        
        # Extract parts
        parts = []
        part_sections = article.find_all('h3', string=re.compile(r'^PART\s+\d+$', re.I))
        
        for part_h3 in part_sections:
            part_num = int(re.search(r'\d+', part_h3.get_text()).group())
            
            # Get audio (for listening)
            audio = None
            if skill == 'listening':
                audio_link = part_h3.find_next('a', href=re.compile(r'\.mp3', re.I))
                if audio_link:
                    audio = audio_link.get('href')
            
            # Collect HTML until next PART or Answer section
            part_html = self._collect_until_next_part(part_h3)
            
            # Parse questions
            question_sections = self._parse_question_sections(part_html)
            
            part_data = {
                'part': part_num,
                'title': f'Part {part_num}',
                'questionSections': question_sections
            }
            
            if audio:
                part_data['audio'] = audio
            
            # Calculate question range
            if question_sections:
                all_q = []
                for qs in question_sections:
                    all_q.extend(qs['questionRange'])
                part_data['questionRange'] = [min(all_q), max(all_q)]
            
            parts.append(part_data)
        
        # Extract answers
        answer_parts = self._extract_answers(article)
        
        # Build item
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
        
        total_q = sum(len(p.get('answers', [])) for p in answer_parts)
        
        item = IeltsTestItem(
            skill=skill,
            title=title,
            series=f"Cambridge IELTS {series}",
            test_number=f"Test {test_num}",
            source_url=response.url,
            test_code=slug_from_url(response.url),
            question_content=question_content,
            answer_payload=answer_payload,
            total_questions=total_q,
            duration_minutes=30 if skill == 'listening' else 60,
        )
        
        self.logger.info(f"✅ {title}: {total_q} questions, {len(parts)} parts")
        yield item

    def _collect_until_next_part(self, part_h3: Tag) -> str:
        """Collect all HTML from PART header until next PART or Answer"""
        
        html_parts = []
        current = part_h3.find_next_sibling()
        
        while current:
            # Stop conditions
            if current.name == 'h3' and re.search(r'^PART\s+\d+$', current.get_text(), re.I):
                break
            if current.name in ['h2', 'h3'] and re.search(r'Answer', current.get_text(), re.I):
                break
            
            html_parts.append(str(current))
            current = current.find_next_sibling()
        
        return '\n'.join(html_parts)

    def _parse_question_sections(self, part_html: str) -> List[Dict]:
        """Parse question sections from part HTML"""
        
        soup = BeautifulSoup(part_html, 'html.parser')
        sections = []
        
        # Find all "Questions X-Y" or "Questions X–Y" (en-dash)
        for elem in soup.find_all(string=re.compile(r'Questions?\s+\d+\s*[–-]\s*\d+', re.I)):
            if not isinstance(elem, str):
                continue
            
            match = re.search(r'Questions?\s+(\d+)\s*[–-]\s*(\d+)', elem, re.I)
            if not match:
                continue
            
            start_q = int(match.group(1))
            end_q = int(match.group(2))
            
            # Get parent element
            parent = elem.parent if hasattr(elem, 'parent') else None
            if not parent:
                continue
            
            # Get grandparent container (usually et_pb_text)
            container = parent.find_parent('div', class_=re.compile(r'et_pb_text'))
            if not container:
                container = parent.parent
            
            # Extract instructions
            instructions = self._extract_instructions_from_container(container)
            
            # Get full HTML of this section
            section_html = str(container)
            
            # Extract questions
            questions = self._extract_questions_from_html(
                section_html, start_q, end_q, instructions
            )
            
            sections.append({
                'heading': elem.strip(),
                'instructions': instructions,
                'questionRange': [start_q, end_q],
                'questions': questions,
                'html': section_html
            })
        
        return sections

    def _extract_instructions_from_container(self, container: Tag) -> str:
        """Extract instructions like 'Complete the notes' and 'Write NO MORE THAN...'"""
        
        instructions = []
        
        for em in container.find_all('em', limit=5):
            text = em.get_text(strip=True)
            if any(kw in text.lower() for kw in 
                  ['complete', 'choose', 'write', 'select', 'match', 'word', 'number']):
                instructions.append(text)
        
        return ' '.join(instructions)

    def _extract_questions_from_html(
        self, 
        html: str, 
        start_q: int, 
        end_q: int, 
        instructions: str
    ) -> List[Dict]:
        """Extract individual questions"""
        
        soup = BeautifulSoup(html, 'html.parser')
        questions = []
        
        # Detect type
        lower_inst = instructions.lower()
        question_type = 'fill_in_blank'
        if 'choose' in lower_inst and 'letter' in lower_inst:
            question_type = 'multiple_choice'
        
        for q_num in range(start_q, end_q + 1):
            q_text = self._find_question_text(soup, q_num, question_type)
            options = []
            
            if question_type == 'multiple_choice':
                options = self._find_mcq_options(soup, q_num)
            
            questions.append({
                'questionNumber': q_num,
                'questionText': q_text,
                'questionType': question_type,
                'options': options
            })
        
        return questions

    def _find_question_text(self, soup: BeautifulSoup, q_num: int, qtype: str) -> str:
        """Find question text by number"""
        
        # MCQ: "11 What is the main..." format
        if qtype == 'multiple_choice':
            for p in soup.find_all('p'):
                text = p.get_text(strip=True)
                if re.match(rf'^\**{q_num}\**\s+\w', text):
                    # Remove question number
                    cleaned = re.sub(rf'^\**{q_num}\**\s*', '', text)
                    return cleaned.strip()
        
        # Table/Form completion: look in table cells
        for td in soup.find_all('td'):
            # Check if cell contains **1** or **2** etc.
            if f'**{q_num}**' in str(td) or f'<strong>{q_num}</strong>' in str(td):
                # Get row context
                row = td.find_parent('tr')
                table = row.find_parent('table') if row else None
                
                # Get column header
                col_idx = list(row.find_all(['td', 'th'])).index(td)
                header_row = table.find('tr') if table else None
                header = ""
                if header_row:
                    headers = header_row.find_all(['td', 'th'])
                    if col_idx < len(headers):
                        header = headers[col_idx].get_text(strip=True)
                
                # Get cell text (remove number markers)
                cell_text = td.get_text(strip=True)
                cell_text = re.sub(rf'\**{q_num}\**', '', cell_text).strip()
                cell_text = cell_text.replace('______', '___')
                
                # Build question
                if header and cell_text:
                    return f"{header}: {cell_text}"
                return cell_text or header or f"Question {q_num}"
        
        return f"Question {q_num}"

    def _find_mcq_options(self, soup: BeautifulSoup, q_num: int) -> List[Dict]:
        """Find MCQ options after question"""
        
        options = []
        found_q = False
        
        for p in soup.find_all('p'):
            text = p.get_text(strip=True)
            
            # Find question first
            if re.match(rf'^\**{q_num}\**\s+', text):
                found_q = True
                continue
            
            # After question, collect options
            if found_q:
                match = re.match(r'^\**([A-E])\**\s+(.+)', text)
                if match:
                    options.append({
                        'key': match.group(1),
                        'text': match.group(2).strip()
                    })
                # Stop at next question
                elif re.match(r'^\**\d+\**\s+', text):
                    break
        
        return options

    def _extract_answers(self, article: Tag) -> List[Dict]:
        """Extract answers from Answer section"""
        
        # Find "Answer" heading
        answer_h2 = article.find(['h2', 'h3'], string=re.compile(r'Answer', re.I))
        if not answer_h2:
            return []
        
        answer_parts = []
        
        # Find "Part 1", "Part 2" headers under Answer section
        current = answer_h2.find_next_sibling()
        current_part = None
        current_answers = []
        
        while current:
            text = current.get_text(strip=True)
            
            # Check for Part header
            part_match = re.match(r'^Part\s+(\d+)$', text, re.I)
            if part_match:
                # Save previous part
                if current_part and current_answers:
                    q_nums = [a['question'] for a in current_answers]
                    answer_parts.append({
                        'part': current_part,
                        'questionRange': [min(q_nums), max(q_nums)],
                        'answers': current_answers
                    })
                # Start new part
                current_part = int(part_match.group(1))
                current_answers = []
            
            # Parse answer line: "1 fish" or "21&22 C, E"
            elif current_part:
                match = re.match(r'^(\d+(?:&\d+)?)\s+(.+)', text)
                if match:
                    q_str = match.group(1)
                    ans_str = match.group(2)
                    
                    # Parse question numbers
                    q_nums = [int(n) for n in re.findall(r'\d+', q_str)]
                    # Parse answer values
                    values = [v.strip() for v in re.split(r'[,/]', ans_str)]
                    
                    for qn in q_nums:
                        current_answers.append({
                            'question': qn,
                            'raw': ans_str,
                            'value': values
                        })
            
            # Stop at next major section
            if current.name == 'h2':
                break
            
            current = current.find_next_sibling()
        
        # Save last part
        if current_part and current_answers:
            q_nums = [a['question'] for a in current_answers]
            answer_parts.append({
                'part': current_part,
                'questionRange': [min(q_nums), max(q_nums)],
                'answers': current_answers
            })
        
        return answer_parts



