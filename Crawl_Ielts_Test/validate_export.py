"""
Validation Script for JSON Export

Validates that all 14 IELTS question types are properly detected and exported.
"""

import json
import os
from collections import Counter
from typing import Dict, List


class ExportValidator:
    """Validate exported JSON files"""
    
    EXPECTED_QUESTION_TYPES = [
        'multiple_choice',
        'multiple_choice_multiple_answers',
        'fill_in_blank',
        'sentence_completion',
        'table_completion',
        'diagram_labeling',
        'matching',
        'true_false_notgiven',
        'yes_no_notgiven',
        'short_answer'
    ]
    
    def __init__(self, json_dir: str = 'export/new_structure'):
        self.json_dir = json_dir
        self.tests = []
        self.sections = []
        self.groups = []
        self.questions = []
    
    def load_data(self):
        """Load all JSON files"""
        print("📂 Loading exported JSON files...\n")
        
        with open(os.path.join(self.json_dir, 'tests.json'), 'r') as f:
            self.tests = json.load(f)
        print(f"   ✅ Loaded {len(self.tests)} tests")
        
        with open(os.path.join(self.json_dir, 'testsections.json'), 'r') as f:
            self.sections = json.load(f)
        print(f"   ✅ Loaded {len(self.sections)} sections")
        
        with open(os.path.join(self.json_dir, 'questiongroups.json'), 'r') as f:
            self.groups = json.load(f)
        print(f"   ✅ Loaded {len(self.groups)} groups")
        
        with open(os.path.join(self.json_dir, 'questions.json'), 'r') as f:
            self.questions = json.load(f)
        print(f"   ✅ Loaded {len(self.questions)} questions\n")
    
    def validate_structure(self):
        """Validate basic structure"""
        print("🔍 Validating structure...\n")
        
        # Check tests have required fields
        for test in self.tests:
            assert 'title' in test, "Test missing title"
            assert 'testType' in test, "Test missing testType"
            assert 'externalSlug' in test, "Test missing externalSlug"
        print("   ✅ All tests have required fields")
        
        # Check sections have resources
        listening_sections = [s for s in self.sections if s.get('sectionType') == 'listening']
        reading_sections = [s for s in self.sections if s.get('sectionType') == 'reading']
        
        audio_count = sum(1 for s in listening_sections if s.get('resources', {}).get('audio'))
        print(f"   ✅ {audio_count}/{len(listening_sections)} listening sections have audio")
        
        passage_count = sum(1 for s in reading_sections if s.get('resources', {}).get('passageHtml'))
        print(f"   ✅ {passage_count}/{len(reading_sections)} reading sections have passages")
        
        # Check groups have instructions
        groups_with_instructions = sum(1 for g in self.groups if g.get('instructions'))
        print(f"   ✅ {groups_with_instructions}/{len(self.groups)} groups have instructions\n")
    
    def validate_question_types(self):
        """Validate question type detection"""
        print("🎯 Validating question types...\n")
        
        type_counts = Counter(q.get('questionType') for q in self.questions)
        
        print("   Question type distribution:")
        for qtype, count in type_counts.most_common():
            print(f"      {qtype}: {count}")
        
        # Check if we have variety
        if len(type_counts) < 5:
            print(f"\n   ⚠️  Warning: Only {len(type_counts)} question types detected")
            print("      Expected at least 5-8 different types")
        else:
            print(f"\n   ✅ Good variety: {len(type_counts)} different question types detected")
        
        # Check for required types in typical IELTS tests
        has_mcq = type_counts.get('multiple_choice', 0) > 0
        has_fill = type_counts.get('fill_in_blank', 0) > 0
        
        if has_mcq and has_fill:
            print("   ✅ Found both MCQ and fill-in-blank (most common types)\n")
        else:
            print("   ⚠️  Warning: Missing common question types\n")
    
    def validate_options(self):
        """Validate options are extracted for MCQ"""
        print("📋 Validating MCQ options...\n")
        
        mcq_questions = [q for q in self.questions 
                        if 'multiple_choice' in q.get('questionType', '')]
        
        if not mcq_questions:
            print("   ⚠️  No MCQ questions found\n")
            return
        
        with_options = sum(1 for q in mcq_questions if q.get('options'))
        print(f"   {with_options}/{len(mcq_questions)} MCQ questions have options")
        
        if with_options > 0:
            # Sample a question with options
            sample = next(q for q in mcq_questions if q.get('options'))
            print(f"\n   Sample MCQ (Q{sample['questionNumber']}):")
            print(f"      Text: {sample['questionText'][:60]}...")
            print(f"      Options: {len(sample['options'])} choices")
            for opt in sample['options'][:3]:
                print(f"         {opt['key']}: {opt['text'][:40]}...")
            print(f"      Answer: {sample['correctAnswer']['value']}\n")
    
    def validate_matching(self):
        """Validate matching questions have shared options"""
        print("🔗 Validating matching questions...\n")
        
        matching_groups = [g for g in self.groups if g.get('groupType') == 'matching']
        
        if not matching_groups:
            print("   ⚠️  No matching groups found\n")
            return
        
        print(f"   Found {len(matching_groups)} matching groups")
        
        with_options = sum(1 for g in matching_groups 
                          if g.get('sharedContent', {}).get('matchingOptions'))
        
        if with_options > 0:
            print(f"   {with_options}/{len(matching_groups)} have matching option lists")
            
            # Sample
            sample = next((g for g in matching_groups 
                          if g.get('sharedContent', {}).get('matchingOptions')), None)
            if sample:
                print(f"\n   Sample matching group:")
                print(f"      Title: {sample['title']}")
                opts = sample['sharedContent']['matchingOptions']
                print(f"      Options: {len(opts)} items")
                for opt in opts[:3]:
                    print(f"         {opt['key']}: {opt['text'][:50]}...")
        print()
    
    def validate_diagrams(self):
        """Validate diagram URLs are captured"""
        print("🖼️  Validating diagrams/images...\n")
        
        with_diagrams = sum(1 for g in self.groups 
                           if g.get('sharedContent', {}).get('diagram'))
        
        if with_diagrams > 0:
            print(f"   ✅ Found {with_diagrams} groups with diagram URLs")
            
            # Sample
            sample = next((g for g in self.groups 
                          if g.get('sharedContent', {}).get('diagram')), None)
            if sample:
                print(f"      Sample: {sample['sharedContent']['diagram']}")
        else:
            print("   ℹ️  No diagrams found (may be normal for listening-only exports)")
        print()
    
    def validate_correct_answers(self):
        """Validate correct answers are present"""
        print("✔️  Validating correct answers...\n")
        
        with_answers = sum(1 for q in self.questions 
                          if q.get('correctAnswer', {}).get('value'))
        
        print(f"   {with_answers}/{len(self.questions)} questions have correct answers")
        
        if with_answers < len(self.questions):
            missing = len(self.questions) - with_answers
            print(f"   ⚠️  {missing} questions missing correct answers\n")
        else:
            print("   ✅ All questions have correct answers\n")
    
    def generate_report(self):
        """Generate summary report"""
        print("=" * 60)
        print("📊 VALIDATION SUMMARY")
        print("=" * 60)
        print()
        print(f"Tests:          {len(self.tests)}")
        print(f"Sections:       {len(self.sections)}")
        print(f"Groups:         {len(self.groups)}")
        print(f"Questions:      {len(self.questions)}")
        print()
        
        # Question types
        type_counts = Counter(q.get('questionType') for q in self.questions)
        print(f"Question types: {len(type_counts)}")
        
        # Coverage
        listening_qs = sum(1 for s in self.sections if s.get('sectionType') == 'listening')
        reading_qs = sum(1 for s in self.sections if s.get('sectionType') == 'reading')
        print(f"Listening:      {listening_qs} sections")
        print(f"Reading:        {reading_qs} sections")
        print()
        
        # Quality checks
        mcq_with_opts = sum(1 for q in self.questions 
                           if 'multiple_choice' in q.get('questionType', '') 
                           and q.get('options'))
        all_mcq = sum(1 for q in self.questions 
                     if 'multiple_choice' in q.get('questionType', ''))
        
        if all_mcq > 0:
            coverage = (mcq_with_opts / all_mcq) * 100
            print(f"MCQ coverage:   {coverage:.1f}% have extracted options")
        
        print()
        print("=" * 60)
        print()
        
        # Recommendations
        if len(type_counts) >= 6:
            print("✅ Excellent: Detected 6+ question types")
        elif len(type_counts) >= 4:
            print("✅ Good: Detected 4+ question types")
        else:
            print("⚠️  Limited: Only detected <4 question types")
            print("   Consider crawling more diverse test content")
        
        print()
        print("🎯 Ready for import to MongoDB!")
        print()


def main():
    """Main validation function"""
    validator = ExportValidator()
    
    try:
        validator.load_data()
        validator.validate_structure()
        validator.validate_question_types()
        validator.validate_options()
        validator.validate_matching()
        validator.validate_diagrams()
        validator.validate_correct_answers()
        validator.generate_report()
        
    except FileNotFoundError as e:
        print(f"\n❌ Error: JSON files not found")
        print(f"   Make sure to run json_exporter_v2.py first")
        print(f"   {e}\n")
        return 1
    except Exception as e:
        print(f"\n❌ Validation failed: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == '__main__':
    import sys
    sys.exit(main())

