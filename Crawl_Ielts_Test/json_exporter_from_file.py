"""
JSON Exporter from Crawled File (No MongoDB Required)

Exports scraped IELTS data from raw_crawl.json to 4 JSON files:
- tests.json
- testsections.json  
- questiongroups.json
- questions.json
"""

import json
import os
import re
from typing import List, Dict, Any
from bs4 import BeautifulSoup
from Crawl_Ielts_Test.utils.question_type_detector import QuestionTypeDetector
from Crawl_Ielts_Test.utils.content_extractors import ContentExtractors


class JSONExporterFromFile:
    """Export IELTS data from raw JSON file to new structure"""
    
    def __init__(self, input_file: str = 'export/raw_crawl.json'):
        self.input_file = input_file
        self.detector = QuestionTypeDetector()
        self.extractor = ContentExtractors()
        
        # Output directory
        self.output_dir = "export/new_structure"
        os.makedirs(self.output_dir, exist_ok=True)
    
    def export_all(self):
        """Export all data to JSON files"""
        print("🚀 Starting export from raw crawl file...\n")
        
        # Load raw crawled data
        with open(self.input_file, 'r', encoding='utf-8') as f:
            raw_tests = json.load(f)
        
        print(f"Found {len(raw_tests)} tests to export\n")
        
        tests_data = []
        sections_data = []
        groups_data = []
        questions_data = []
        
        for raw_test in raw_tests:
            print(f"📝 Processing: {raw_test.get('title', 'Untitled')}")
            
            # 1. Export Test
            test_doc = self._export_test(raw_test)
            tests_data.append(test_doc)
            
            # 2. Export Sections, Groups, Questions
            question_content = raw_test.get('question_content', {})
            answer_payload = raw_test.get('answer_payload', {})
            
            test_sections, test_groups, test_questions = self._export_test_structure(
                test_doc, question_content, answer_payload
            )
            
            sections_data.extend(test_sections)
            groups_data.extend(test_groups)
            questions_data.extend(test_questions)
            
            print(f"   ✅ {len(test_sections)} sections, {len(test_groups)} groups, {len(test_questions)} questions\n")
        
        # Write to JSON files (named after collections)
        self._write_json('tests.json', tests_data)
        self._write_json('testsections.json', sections_data)
        self._write_json('questiongroups.json', groups_data)
        self._write_json('questions.json', questions_data)
        
        print(f"\n🎉 Export complete!")
        print(f"   Tests: {len(tests_data)}")
        print(f"   Sections: {len(sections_data)}")
        print(f"   Groups: {len(groups_data)}")
        print(f"   Questions: {len(questions_data)}")
        print(f"\n📁 Files saved to: {self.output_dir}/")
    
    def _export_test(self, raw_test: Dict) -> Dict:
        """Export test document"""
        return {
            'title': raw_test.get('title', 'Untitled'),
            'testType': 'IELTS',
            'language': 'English',
            'level': 'IELTS',
            'durationMinutes': raw_test.get('duration_minutes', 60),
            'totalQuestions': raw_test.get('total_questions', 40),
            'totalUser': 0,
            'totalComment': 0,
            'hastag': [],
            'description': '',
            'externalSlug': raw_test.get('test_code', ''),
            'series': raw_test.get('series'),
            'testNumber': raw_test.get('test_number'),
            'skill': raw_test.get('skill'),
            'sourceUrl': raw_test.get('source_url'),
        }
    
    def _export_test_structure(
        self, 
        test_doc: Dict, 
        question_content: Dict, 
        answer_payload: Dict
    ) -> tuple:
        """Export sections, groups, and questions for a test"""
        
        sections = []
        groups = []
        questions = []
        
        parts = question_content.get('parts', [])
        answer_parts = answer_payload.get('parts', [])
        
        for part_idx, part in enumerate(parts):
            part_number = part.get('part', part_idx + 1)
            
            # Find corresponding answers
            part_answers = next(
                (ap for ap in answer_parts if ap.get('part') == part_number),
                None
            )
            
            if not part_answers:
                print(f"      ⚠️  No answers for part {part_number}, skipping...")
                continue
            
            # Create section
            section_ref = f"{test_doc['externalSlug']}-part-{part_number}"
            section_doc = {
                'testExternalSlug': test_doc['externalSlug'],
                'sectionType': question_content.get('skill', 'listening'),
                'partNumber': part_number,
                'title': part.get('title', f'Part {part_number}'),
                'questionRange': part.get('questionRange', [0, 0]),
                'resources': {
                    'audio': part.get('audio'),
                    'passageHtml': part.get('passageHtml'),
                    'transcriptHtml': part.get('transcriptHtml'),
                    'transcriptText': part.get('transcriptText'),
                },
                'order': part_idx,
                '_ref': section_ref
            }
            sections.append(section_doc)
            
            # Process question sections to create groups
            question_sections = part.get('questionSections', [])
            
            if question_sections:
                # For reading: create groups per question section
                for group_idx, qs in enumerate(question_sections):
                    group_doc, group_questions = self._create_group_from_section(
                        section_ref, qs, part_answers, group_idx
                    )
                    groups.append(group_doc)
                    questions.extend(group_questions)
            else:
                # For listening: create one group per part
                group_doc, group_questions = self._create_default_group(
                    section_ref, part, part_answers
                )
                groups.append(group_doc)
                questions.extend(group_questions)
        
        return sections, groups, questions
    
    def _create_group_from_section(
        self, 
        section_ref: str, 
        question_section: Dict,
        part_answers: Dict,
        group_idx: int
    ) -> tuple:
        """Create question group and questions from a question section"""
        
        heading = question_section.get('heading', '')
        html = question_section.get('html', '')
        
        # Extract instructions
        instructions = self.extractor.extract_instructions(html)
        
        # Determine question range from heading
        numbers = self._numbers_from_heading(heading)
        if not numbers:
            # Fallback: use all answers in this section
            numbers = [a['question'] for a in part_answers.get('answers', [])]
        
        question_range = [min(numbers), max(numbers)] if numbers else [0, 0]
        
        # Detect group type
        group_type = self.detector.detect_group_type(instructions)
        
        # Extract shared content
        shared_content = {}
        
        # Check for passage HTML
        soup = BeautifulSoup(html, 'html.parser')
        
        # Extract matching options if applicable
        if 'match' in instructions.lower():
            matching_options = self.extractor.extract_matching_list(html)
            if matching_options:
                shared_content['matchingOptions'] = matching_options
        
        # Extract diagram URL
        diagram_url = self.extractor.extract_diagram_url(html)
        if diagram_url:
            shared_content['diagram'] = diagram_url
        
        # Extract table structure
        table_data = self.extractor.extract_table_structure(html)
        if table_data:
            shared_content['table'] = table_data
        
        group_ref = f"{section_ref}-group-{group_idx}"
        group_doc = {
            'sectionRef': section_ref,
            'groupType': group_type,
            'title': heading or f"Questions {question_range[0]}-{question_range[1]}",
            'instructions': instructions,
            'questionRange': question_range,
            'sharedContent': shared_content,
            'order': group_idx,
            '_ref': group_ref
        }
        
        # Create questions
        group_questions = self._create_questions_for_group(
            group_ref, numbers, html, part_answers, instructions
        )
        
        return group_doc, group_questions
    
    def _create_default_group(
        self, 
        section_ref: str, 
        part: Dict, 
        part_answers: Dict
    ) -> tuple:
        """Create default group for parts without explicit question sections (mostly listening)"""
        
        answers = part_answers.get('answers', [])
        question_numbers = [a['question'] for a in answers]
        question_range = [min(question_numbers), max(question_numbers)] if question_numbers else [0, 0]
        
        instructions = ""
        group_type = "shared_instruction"
        
        group_ref = f"{section_ref}-group-0"
        group_doc = {
            'sectionRef': section_ref,
            'groupType': group_type,
            'title': f"Questions {question_range[0]}-{question_range[1]}",
            'instructions': instructions,
            'questionRange': question_range,
            'sharedContent': {},
            'order': 0,
            '_ref': group_ref
        }
        
        # Create questions
        html = ""
        group_questions = self._create_questions_for_group(
            group_ref, question_numbers, html, part_answers, instructions
        )
        
        return group_doc, group_questions
    
    def _create_questions_for_group(
        self, 
        group_ref: str,
        question_numbers: List[int],
        html: str,
        part_answers: Dict,
        instructions: str
    ) -> List[Dict]:
        """Create individual question documents"""
        
        questions = []
        answers_list = part_answers.get('answers', [])
        answers_map = {a['question']: a for a in answers_list}
        
        for idx, qnum in enumerate(question_numbers):
            answer_data = answers_map.get(qnum)
            if not answer_data:
                continue
            
            # Detect question type
            question_type = self.detector.detect_from_instructions(
                instructions, 
                answer_data.get('value', [])
            )
            
            # Extract question text
            question_text = f"Question {qnum}"
            if html:
                question_text = self.extractor.extract_question_text(html, qnum)
            
            # Extract options for MCQ
            options = []
            if 'multiple_choice' in question_type:
                if html:
                    options = self.extractor.extract_mcq_options(html)
            elif question_type in ['true_false_notgiven', 'yes_no_notgiven']:
                # Standard options
                if 'true' in question_type:
                    options = [
                        {'key': 'TRUE', 'text': 'TRUE'},
                        {'key': 'FALSE', 'text': 'FALSE'},
                        {'key': 'NOT GIVEN', 'text': 'NOT GIVEN'}
                    ]
                else:
                    options = [
                        {'key': 'YES', 'text': 'YES'},
                        {'key': 'NO', 'text': 'NO'},
                        {'key': 'NOT GIVEN', 'text': 'NOT GIVEN'}
                    ]
            
            # Build correct answer
            correct_answer = {
                'value': answer_data.get('value', []),
                'alternatives': answer_data.get('value', [])
            }
            
            # Extract word limit for fill-in questions
            word_limit = self.detector.extract_word_limit(instructions) if instructions else None
            
            question_doc = {
                'groupRef': group_ref,
                'questionNumber': qnum,
                'questionType': question_type,
                'questionText': question_text,
                'options': options,
                'correctAnswer': correct_answer,
                'explanation': {},
                'points': 1,
                'order': idx
            }
            
            # Add word limit if applicable
            if word_limit:
                question_doc['wordLimit'] = word_limit
            
            questions.append(question_doc)
        
        return questions
    
    def _numbers_from_heading(self, heading: str) -> List[int]:
        """Extract question numbers from heading like 'Questions 14-18'"""
        matches = [int(num) for num in re.findall(r'\d+', heading)]
        if len(matches) >= 2:
            return list(range(matches[0], matches[1] + 1))
        return matches
    
    def _write_json(self, filename: str, data: List[Dict]):
        """Write data to JSON file"""
        filepath = os.path.join(self.output_dir, filename)
        
        # Clean _ref fields before export (used only for linking)
        cleaned_data = []
        for item in data:
            cleaned = {k: v for k, v in item.items() if not k.startswith('_')}
            cleaned_data.append(cleaned)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(cleaned_data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Exported {len(data)} documents to {filename}")


def main():
    """Main export function"""
    import sys
    
    input_file = 'export/raw_crawl.json'
    
    if not os.path.exists(input_file):
        print(f"❌ File not found: {input_file}")
        print("   Please run: scrapy crawl ielts_tests -o export/raw_crawl.json --set ITEM_PIPELINES={}")
        sys.exit(1)
    
    print(f"Input file: {input_file}\n")
    
    exporter = JSONExporterFromFile(input_file)
    
    try:
        exporter.export_all()
    except Exception as e:
        print(f"\n❌ Export failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    print("\n✨ Done! Files are ready for import.")
    print("\nNext step:")
    print("  python import_to_mongodb.py --db elearning --dir export/new_structure --drop")


if __name__ == '__main__':
    main()

