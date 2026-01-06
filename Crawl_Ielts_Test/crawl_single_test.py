"""
Simple script to crawl a single IELTS test
"""

import re
import json
from datetime import datetime, timezone
import requests
from bs4 import BeautifulSoup


def crawl_single_test(url: str) -> dict:
    """Crawl a single IELTS test page"""
    
    print(f"Fetching: {url}")
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Extract title from URL
    match = re.search(r'cam-(\d+)-(\w+)-test-(\d+)', url)
    series = int(match.group(1))
    skill = match.group(2)
    test_num = int(match.group(3))
    title = f"Cambridge IELTS {series} {skill.title()} Test {test_num}"
    
    # Find main article
    article = soup.find('article') or soup.find('div', id='main-content')
    if not article:
        print("❌ No article found")
        return None
    
    # Extract parts
    parts = []
    part_headers = article.find_all('h3', string=re.compile(r'^PART\s+\d+$', re.I))
    print(f"Found {len(part_headers)} PART headers")
    
    for part_h3 in part_headers:
        part_num = int(re.search(r'\d+', part_h3.get_text()).group())
        print(f"\n=== PART {part_num} ===")
        
        # Get audio URL
        audio = None
        audio_link = part_h3.find_next('a', href=re.compile(r'\.mp3', re.I))
        if audio_link:
            audio = audio_link.get('href')
            print(f"Audio: {audio}")
        
        # Find all question sections for this part
        # Strategy: find divs with class et_pb_text_inner that contain "Questions X-Y"
        # Filter by question number range to assign to correct part
        
        question_sections = []
        seen_ranges = set()  # To avoid duplicates
        
        # Part number to question range mapping
        # Part 1: 1-10, Part 2: 11-20, Part 3: 21-30, Part 4: 31-40
        expected_start = (part_num - 1) * 10 + 1
        expected_end = part_num * 10
        
        # Find all et_pb_text_inner divs in the entire article
        for div in article.find_all('div', class_='et_pb_text_inner'):
            # Look for "Questions X-Y" in this div
            text = div.get_text()
            match = re.search(r'Questions?\s+(\d+)\s*[–-]\s*(\d+)', text, re.I)
            if not match:
                continue
            
            start_q = int(match.group(1))
            end_q = int(match.group(2))
            range_key = f"{start_q}-{end_q}"
            
            # Check if this range belongs to current part
            if not (expected_start <= start_q <= expected_end):
                continue
            
            if range_key in seen_ranges:
                continue
            seen_ranges.add(range_key)
            
            print(f"Questions {start_q}-{end_q}")
            
            # Extract instructions
            instructions = []
            for em in div.find_all('em', limit=3):
                inst_text = em.get_text(strip=True)
                if any(kw in inst_text.lower() for kw in 
                      ['complete', 'choose', 'write', 'word', 'number']):
                    instructions.append(inst_text)
            
            instructions_text = ' '.join(instructions)
            if instructions_text:
                print(f"Instructions: {instructions_text[:80]}...")
            
            # Extract individual questions
            # Question text is often in sibling divs, not the same div as "Questions X-Y"
            # So we need to search in parent's siblings
            search_areas = [div]  # Start with current div
            
            # Add sibling divs (next few siblings after the parent)
            parent = div.parent
            if parent:
                next_sibling = parent.find_next_sibling()
                count = 0
                while next_sibling and count < 3:
                    if next_sibling.name == 'div':
                        # Check if this div has et_pb_text_inner
                        inner = next_sibling.find('div', class_='et_pb_text_inner')
                        if inner:
                            search_areas.append(inner)
                    next_sibling = next_sibling.find_next_sibling()
                    count += 1
            
            questions = []
            for q_num in range(start_q, end_q + 1):
                # Try to find question text in multiple areas
                q_text = None
                for area in search_areas:
                    q_text = extract_question_text(area, q_num)
                    if q_text != f"Question {q_num}":
                        break  # Found real text
                
                questions.append({
                    'questionNumber': q_num,
                    'questionText': q_text or f"Question {q_num}",
                    'questionType': 'fill_in_blank'  # default
                })
            
            print(f"Extracted {len(questions)} questions")
            
            # Collect full HTML content (header + all content divs)
            html_parts = [str(div)]
            
            # Get all sibling divs after the parent until next question group
            if parent:
                next_div = parent.find_next_sibling()
                content_divs_count = 0
                max_content_divs = 10  # Reasonable limit
                
                while next_div and content_divs_count < max_content_divs:
                    # Stop if we encounter another "Questions X-Y" header
                    next_text = next_div.get_text()
                    if re.search(r'Questions?\s+\d+\s*[–-]\s*\d+', next_text):
                        break
                    
                    # Add this div to HTML parts
                    html_parts.append(str(next_div))
                    next_div = next_div.find_next_sibling()
                    content_divs_count += 1
            
            full_html = '\n'.join(html_parts)
            
            question_sections.append({
                'heading': f'Questions {start_q}-{end_q}',
                'instructions': instructions_text,
                'questionRange': [start_q, end_q],
                'questions': questions,
                'html': str(div),  # Keep original for backward compatibility
                'fullHtml': full_html  # New: full content including tables/lists
            })
        
        part_data = {
            'part': part_num,
            'title': f'Part {part_num}',
            'questionSections': question_sections
        }
        
        if audio:
            part_data['audio'] = audio
        
        # Calculate question range
        if question_sections:
            all_ranges = [qs['questionRange'] for qs in question_sections]
            min_q = min(r[0] for r in all_ranges)
            max_q = max(r[1] for r in all_ranges)
            part_data['questionRange'] = [min_q, max_q]
        
        parts.append(part_data)
    
    # Extract answers
    answer_parts = extract_answers(article)
    print(f"\n=== ANSWERS ===")
    print(f"Found {len(answer_parts)} answer parts")
    
    # Build final structure
    result = {
        'title': title,
        'skill': skill,
        'series': f'Cambridge IELTS {series}',
        'testNumber': f'Test {test_num}',
        'sourceUrl': url,
        'retrievedAt': datetime.now(timezone.utc).isoformat(),
        'question_content': {
            'parts': parts
        },
        'answer_payload': {
            'parts': answer_parts
        },
        'total_questions': sum(len(p.get('answers', [])) for p in answer_parts)
    }
    
    print(f"\n✅ Total: {result['total_questions']} questions, {len(parts)} parts")
    return result


def extract_question_text(section_elem, q_num: int) -> str:
    """Extract question text for a specific question number"""
    
    # Look in paragraphs with <strong>NUMBER</strong> tags
    for p in section_elem.find_all('p'):
        # Check if paragraph contains <strong>q_num</strong>
        for strong in p.find_all('strong'):
            strong_text = strong.get_text(strip=True)
            if strong_text == str(q_num):
                # Get full paragraph text
                full_text = p.get_text(strip=True)
                # Remove bullet points and number
                cleaned = full_text.replace('●', '').replace('○', '')
                cleaned = re.sub(rf'\b{q_num}\b', '', cleaned)
                cleaned = cleaned.replace('_________', '___').replace('________', '___')
                cleaned = re.sub(r'_{3,}', '___', cleaned)
                cleaned = cleaned.strip()
                return cleaned if cleaned else f"Question {q_num}"
    
    # Look in table cells (backup method)
    for td in section_elem.find_all('td'):
        html_str = str(td)
        if f'<strong>{q_num}</strong>' in html_str:
            # Get row
            row = td.find_parent('tr')
            table = row.find_parent('table') if row else None
            
            # Get header
            col_idx = list(row.find_all(['td', 'th'])).index(td)
            header_row = table.find('tr') if table else None
            header = ""
            if header_row:
                headers = header_row.find_all(['td', 'th'])
                if col_idx < len(headers):
                    header = headers[col_idx].get_text(strip=True)
            
            # Get cell text
            cell_text = td.get_text(strip=True)
            cell_text = re.sub(rf'\b{q_num}\b', '', cell_text).strip()
            cell_text = re.sub(r'_{3,}', '___', cell_text)
            
            if header and cell_text:
                return f"{header}: {cell_text}"
            return cell_text or header
    
    # Look in list items
    for li in section_elem.find_all('li'):
        if f'<strong>{q_num}</strong>' in str(li):
            text = li.get_text(strip=True)
            cleaned = re.sub(rf'\b{q_num}\b', '', text)
            cleaned = re.sub(r'_{3,}', '___', cleaned)
            return cleaned.strip()
    
    return f"Question {q_num}"


def extract_answers(article) -> list:
    """Extract answers from Answer section"""
    
    # Find "Answer" heading
    answer_h = None
    for h in article.find_all(['h2', 'h3', 'h5']):
        if re.search(r'Answer\s+Cam', h.get_text(), re.I):
            answer_h = h
            break
    
    if not answer_h:
        return []
    
    answer_parts = []
    
    # Find all h5 tags with "Part X" after the Answer heading
    # Look only within a reasonable range (next ~50 siblings) to avoid going too far
    part_headers = []
    current = answer_h.find_next('h5')
    checked_count = 0
    max_checks = 50  # Don't search too far
    
    while current and checked_count < max_checks:
        h5_text = current.get_text(strip=True)
        if re.match(r'^Part\s+\d+$', h5_text, re.I):
            part_headers.append(current)
        checked_count += 1
        current = current.find_next('h5')
    
    for part_h5 in part_headers:
        part_num = int(re.search(r'\d+', part_h5.get_text()).group())
        
        # Get answers from following paragraphs
        answers = []
        current = part_h5.find_next_sibling()
        
        while current:
            # Stop at next Part header
            if current.name == 'h5' and re.match(r'^Part\s+\d+$', current.get_text(strip=True), re.I):
                break
            # Stop at next major section
            if current.name in ['h2', 'h3']:
                break
            
            text = current.get_text(strip=True)
            
            # Find ALL answer patterns in the text: "NUMBER WORD(s)"
            # Pattern handles: "1 break", "31 photos/ photographs pictures", etc.
            # Use finditer to find all matches, not just first one
            for match in re.finditer(r'(\d+)\s+([a-zA-Z][^\d]*?)(?=\d+\s+[a-zA-Z]|$)', text):
                q_num = int(match.group(1))
                ans_str = match.group(2).strip()
                
                # Remove trailing numbers that might be part of next answer
                ans_str = re.sub(r'\d+\s*$', '', ans_str).strip()
                
                # Split multiple acceptable answers by / or comma
                # e.g., "photos/ photographs pictures" -> ["photos", "photographs", "pictures"]
                values = [v.strip() for v in re.split(r'[/,]', ans_str) if v.strip()]
                
                # Further split each value by spaces if it contains multiple words
                # e.g., "photographs pictures" -> ["photographs", "pictures"]
                expanded_values = []
                for val in values:
                    if ' ' in val:
                        # Check if genuinely multiple answers (all words, no numbers)
                        words = val.split()
                        if all(not any(char.isdigit() for char in word) for word in words):
                            expanded_values.extend(words)
                        else:
                            expanded_values.append(val)
                    else:
                        expanded_values.append(val)
                
                values = expanded_values
                
                answers.append({
                    'question': q_num,
                    'raw': ans_str,
                    'value': values
                })
            
            current = current.find_next_sibling()
        
        if answers:
            q_nums = [a['question'] for a in answers]
            answer_parts.append({
                'part': part_num,
                'questionRange': [min(q_nums), max(q_nums)],
                'answers': answers
            })
    
    return answer_parts


if __name__ == '__main__':
    import sys
    
    # Default URL for test 01, but allow override via command line
    default_url = "https://ieltstrainingonline.com/practice-cam-20-listening-test-01-with-answer-and-audioscripts/"
    url = sys.argv[1] if len(sys.argv) > 1 else default_url
    
    # Determine output filename from URL
    match = re.search(r'cam-(\d+)-(\w+)-test-(\d+)', url)
    if match:
        series = match.group(1)
        skill = match.group(2)
        test_num = match.group(3)
        output_file = f'export/cam{series}_test{test_num}.json'
    else:
        output_file = 'export/cam20_test01.json'
    
    result = crawl_single_test(url)
    
    if result:
        # Save to JSON
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Saved to: {output_file}")
        
        # Show summary
        print("\n" + "="*60)
        print(f"Title: {result['title']}")
        print(f"Total Questions: {result['total_questions']}")
        print(f"Parts: {len(result['question_content']['parts'])}")
        for part in result['question_content']['parts']:
            print(f"  Part {part['part']}: {len(part['questionSections'])} sections, {len(part.get('questionSections', []))} question groups")

