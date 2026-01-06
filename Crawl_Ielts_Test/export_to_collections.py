"""
Export crawled test data to separate JSON files for each MongoDB collection

Output files:
- tests.json
- testsections.json  
- questiongroups.json
- questions.json
"""

import json
from datetime import datetime, timezone
from bson import ObjectId


def generate_object_id():
    """Generate a new ObjectId string"""
    return str(ObjectId())


def export_to_collections(input_file: str, output_dir: str = 'export/collections'):
    """
    Transform crawled data into 4 collection files
    """
    
    # Load crawled data
    with open(input_file, 'r', encoding='utf-8') as f:
        crawled_data = json.load(f)
    
    print(f"Processing: {crawled_data['title']}")
    
    # Storage for all collections
    tests = []
    test_sections = []
    question_groups = []
    questions = []
    
    # 1. Create Test document
    test_id = generate_object_id()
    
    # Extract series number from "Cambridge IELTS 20"
    import re
    series_match = re.search(r'Cambridge IELTS (\d+)', crawled_data['series'])
    series_num = int(series_match.group(1)) if series_match else 0
    
    # Extract test number from "Test 2"
    test_num_match = re.search(r'Test (\d+)', crawled_data['testNumber'])
    test_num = int(test_num_match.group(1)) if test_num_match else 0
    
    # Generate hashtags
    skill = crawled_data['skill']
    hashtags = [
        f'cambridge-ielts-{series_num}',
        skill,
        f'test-{test_num}'
    ]
    
    # Generate description
    description = f"{crawled_data['title']} - Full practice test with answers and detailed explanations"
    
    test_doc = {
        '_id': {'$oid': test_id},
        'testType': 'IELTS',
        'language': 'English',
        'level': 'Intermediate',
        'durationMinutes': 60,
        'totalQuestions': 0,  # Will be updated after processing questions
        'totalUser': 0,
        'totalComment': 0,
        'hastag': hashtags,
        'description': description,
        'externalSlug': f'cambridge-ielts-{series_num}-{skill}-test-{test_num}',
        'series': crawled_data['series'],
        'testNumber': crawled_data['testNumber'],
        'skill': skill,
        'title': crawled_data['title'],
        'sourceUrl': crawled_data['sourceUrl'],
        'createdAt': {'$date': datetime.now(timezone.utc).isoformat()},
        'updatedAt': {'$date': datetime.now(timezone.utc).isoformat()},
        'deletedAt': None
    }
    
    # 2. Process Parts -> TestSections
    parts = crawled_data['question_content']['parts']
    
    for part in parts:
        section_id = generate_object_id()
        
        # Create TestSection document
        section_doc = {
            '_id': {'$oid': section_id},
            'testId': {'$oid': test_id},
            'sectionType': crawled_data['skill'],  # 'listening' or 'reading'
            'partNumber': part['part'],
            'title': part['title'],
            'questionRange': part.get('questionRange', []),
            'resources': {},
            'order': part['part'],
            'createdAt': {'$date': datetime.now(timezone.utc).isoformat()},
            'updatedAt': {'$date': datetime.now(timezone.utc).isoformat()},
            'deletedAt': None
        }
        
        # Add audio URL if exists
        if 'audio' in part:
            section_doc['resources']['audio'] = part['audio']
        
        # Add passage HTML if exists (for reading)
        if 'passageHtml' in part:
            section_doc['resources']['passageHtml'] = part['passageHtml']
        
        test_sections.append(section_doc)
        
        # 3. Process QuestionSections -> QuestionGroups
        question_sections = part.get('questionSections', [])
        
        for idx, q_section in enumerate(question_sections):
            group_id = generate_object_id()
            
            # Determine group type
            instructions_lower = q_section.get('instructions', '').lower()
            if 'passage' in instructions_lower:
                group_type = 'passage_based'
            elif 'dialogue' in instructions_lower or 'conversation' in instructions_lower:
                group_type = 'dialogue_based'
            else:
                group_type = 'shared_instruction'
            
            # Create QuestionGroup document
            group_doc = {
                '_id': {'$oid': group_id},
                'sectionId': {'$oid': section_id},
                'groupType': group_type,
                'title': q_section.get('heading', ''),
                'instructions': q_section.get('instructions', ''),
                'questionRange': q_section.get('questionRange', []),
                'sharedContent': {},
                'order': idx,
                'createdAt': {'$date': datetime.now(timezone.utc).isoformat()},
                'updatedAt': {'$date': datetime.now(timezone.utc).isoformat()},
                'deletedAt': None
            }
            
            # Add context HTML if exists
            if 'html' in q_section:
                group_doc['sharedContent']['contextHtml'] = q_section['html']
            
            question_groups.append(group_doc)
            
            # 4. Process Questions
            for q in q_section.get('questions', []):
                question_id = generate_object_id()
                
                # Detect question type from instructions
                question_type = detect_question_type(
                    q_section.get('instructions', ''),
                    q.get('questionText', '')
                )
                
                # Get answer from answer_payload if available
                answer_value = get_answer_for_question(
                    crawled_data.get('answer_payload', {}),
                    q['questionNumber']
                )
                
                # Create Question document
                question_doc = {
                    '_id': {'$oid': question_id},
                    'questionGroupId': {'$oid': group_id},
                    'questionNumber': q['questionNumber'],
                    'questionType': question_type,
                    'questionText': q.get('questionText', ''),
                    'options': q.get('options', []),
                    'correctAnswer': {
                        'value': answer_value if answer_value else []
                    },
                    'explanation': {},
                    'points': 1,
                    'order': q['questionNumber'],
                    'createdAt': {'$date': datetime.now(timezone.utc).isoformat()},
                    'updatedAt': {'$date': datetime.now(timezone.utc).isoformat()},
                    'deletedAt': None
                }
                
                questions.append(question_doc)
    
    # Update totalQuestions count
    test_doc['totalQuestions'] = len(questions)
    
    tests.append(test_doc)
    
    # 5. Create Content document
    contents = []
    content_id = generate_object_id()
    
    # Build questionContent structure
    content_parts = []
    for part in parts:
        section = next((s for s in test_sections if s['partNumber'] == part['part']), None)
        
        part_groups = []
        for q_section in part.get('questionSections', []):
            group = {
                'questionRange': q_section.get('questionRange', []),
                'instructions': q_section.get('instructions', ''),
                'fullHtml': q_section.get('fullHtml', q_section.get('html', ''))
            }
            part_groups.append(group)
        
        content_part = {
            'partNumber': part['part'],
            'title': part['title'],
            'groups': part_groups
        }
        
        # Add audio if exists
        if section and 'audio' in section.get('resources', {}):
            content_part['audio'] = section['resources']['audio']
        
        # Add passage HTML if exists (for reading tests)
        if 'passageHtml' in part:
            content_part['passageHtml'] = part['passageHtml']
        
        content_parts.append(content_part)
    
    content_doc = {
        '_id': {'$oid': content_id},
        'testId': {'$oid': test_id},
        'questionContent': {
            'parts': content_parts
        },
        'createdAt': {'$date': datetime.now(timezone.utc).isoformat()},
        'updatedAt': {'$date': datetime.now(timezone.utc).isoformat()},
        'deletedAt': None
    }
    
    contents.append(content_doc)
    
    # 6. Write to separate JSON files
    import os
    os.makedirs(output_dir, exist_ok=True)
    
    files_written = []
    
    # Write tests.json
    tests_file = f'{output_dir}/tests.json'
    with open(tests_file, 'w', encoding='utf-8') as f:
        json.dump(tests, f, indent=2, ensure_ascii=False)
    files_written.append(('tests.json', len(tests)))
    
    # Write testsections.json
    sections_file = f'{output_dir}/testsections.json'
    with open(sections_file, 'w', encoding='utf-8') as f:
        json.dump(test_sections, f, indent=2, ensure_ascii=False)
    files_written.append(('testsections.json', len(test_sections)))
    
    # Write questiongroups.json
    groups_file = f'{output_dir}/questiongroups.json'
    with open(groups_file, 'w', encoding='utf-8') as f:
        json.dump(question_groups, f, indent=2, ensure_ascii=False)
    files_written.append(('questiongroups.json', len(question_groups)))
    
    # Write questions.json
    questions_file = f'{output_dir}/questions.json'
    with open(questions_file, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    files_written.append(('questions.json', len(questions)))
    
    # Write contents.json
    contents_file = f'{output_dir}/contents.json'
    with open(contents_file, 'w', encoding='utf-8') as f:
        json.dump(contents, f, indent=2, ensure_ascii=False)
    files_written.append(('contents.json', len(contents)))
    
    # Print summary
    print("\n" + "="*60)
    print("✅ EXPORT COMPLETED")
    print("="*60)
    print(f"Test: {crawled_data['title']}")
    print(f"Total Questions: {len(questions)}")
    print("\nFiles created:")
    for filename, count in files_written:
        print(f"  ✓ {output_dir}/{filename} ({count} documents)")
    
    print("\n" + "="*60)
    print("💡 To import into MongoDB:")
    print("="*60)
    print(f"mongoimport --db your_database --collection tests --file {output_dir}/tests.json --jsonArray")
    print(f"mongoimport --db your_database --collection testsections --file {output_dir}/testsections.json --jsonArray")
    print(f"mongoimport --db your_database --collection questiongroups --file {output_dir}/questiongroups.json --jsonArray")
    print(f"mongoimport --db your_database --collection questions --file {output_dir}/questions.json --jsonArray")
    print(f"mongoimport --db your_database --collection contents --file {output_dir}/contents.json --jsonArray")
    print("="*60)
    
    return files_written


def detect_question_type(instructions: str, question_text: str) -> str:
    """Detect IELTS question type from instructions and question text"""
    
    instructions_lower = instructions.lower()
    
    # Multiple choice
    if 'choose' in instructions_lower and 'letter' in instructions_lower:
        if 'two' in instructions_lower or 'three' in instructions_lower or 'five' in instructions_lower:
            return 'multiple_choice_multiple'
        return 'multiple_choice_single'
    
    # True/False/Not Given
    if 'true' in instructions_lower and 'false' in instructions_lower:
        return 'true_false_not_given'
    
    # Matching
    if 'match' in instructions_lower or 'write the correct letter' in instructions_lower:
        return 'matching'
    
    # Fill in blank / Completion
    if 'complete' in instructions_lower or 'write' in instructions_lower:
        if 'table' in instructions_lower:
            return 'table_completion'
        elif 'diagram' in instructions_lower:
            return 'diagram_labeling'
        elif 'flowchart' in instructions_lower or 'flow chart' in instructions_lower:
            return 'flowchart_completion'
        elif 'sentence' in instructions_lower:
            return 'sentence_completion'
        elif 'note' in instructions_lower:
            return 'note_completion'
        return 'fill_in_blank'
    
    # Short answer
    if 'answer the question' in instructions_lower:
        return 'short_answer'
    
    # Default
    return 'fill_in_blank'


def get_answer_for_question(answer_payload: dict, question_number: int) -> list:
    """Extract answer for a specific question from answer_payload"""
    
    if not answer_payload or 'parts' not in answer_payload:
        return []
    
    for part in answer_payload['parts']:
        for answer in part.get('answers', []):
            if answer['question'] == question_number:
                return answer.get('value', [])
    
    return []


if __name__ == '__main__':
    import sys
    
    # Default input file
    input_file = 'export/cam20_test02.json'
    
    # Allow custom input file from command line
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
    
    print(f"Reading from: {input_file}\n")
    
    try:
        export_to_collections(input_file)
    except FileNotFoundError:
        print(f"❌ Error: File not found: {input_file}")
        print("\nUsage:")
        print(f"  python3 {sys.argv[0]} [input_file.json]")
        print(f"\nExample:")
        print(f"  python3 {sys.argv[0]} export/cam20_test02.json")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

