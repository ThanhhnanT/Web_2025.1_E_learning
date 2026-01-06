"""
MongoDB Import Script with Reference Resolution

Imports JSON files into MongoDB collections with proper ObjectId references:
- tests.json -> tests collection
- testsections.json -> testsections collection (resolve testId)
- questiongroups.json -> questiongroups collection (resolve sectionId)
- questions.json -> questions collection (resolve questionGroupId)
"""

import json
import os
from typing import Dict, List
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime


class MongoDBImporter:
    """Import JSON data to MongoDB with reference resolution"""
    
    def __init__(self, mongo_uri: str, db_name: str, json_dir: str):
        self.client = MongoClient(mongo_uri)
        self.db = self.client[db_name]
        self.json_dir = json_dir
        
        # Reference mappings
        self.test_map = {}  # externalSlug -> ObjectId
        self.section_map = {}  # section_ref -> ObjectId
        self.group_map = {}  # group_ref -> ObjectId
        
        print(f"📦 Connected to MongoDB: {db_name}\n")
    
    def import_all(self, drop_existing: bool = False):
        """Import all JSON files in correct order"""
        
        if drop_existing:
            print("⚠️  Dropping existing collections...\n")
            self.db.tests.drop()
            self.db.testsections.drop()
            self.db.questiongroups.drop()
            self.db.questions.drop()
        
        # Import in dependency order
        print("📥 Starting import...\n")
        
        tests_count = self.import_tests()
        sections_count = self.import_sections()
        groups_count = self.import_groups()
        questions_count = self.import_questions()
        
        # Update section references in tests
        self.update_test_section_references()
        
        print("\n✅ Import complete!")
        print(f"   Tests: {tests_count}")
        print(f"   Sections: {sections_count}")
        print(f"   Groups: {groups_count}")
        print(f"   Questions: {questions_count}")
    
    def import_tests(self) -> int:
        """Import tests and build externalSlug -> ObjectId mapping"""
        filepath = os.path.join(self.json_dir, 'tests.json')
        
        if not os.path.exists(filepath):
            print(f"❌ File not found: {filepath}")
            return 0
        
        with open(filepath, 'r', encoding='utf-8') as f:
            tests = json.load(f)
        
        print(f"📝 Importing {len(tests)} tests...")
        
        inserted_count = 0
        for test in tests:
            # Add timestamps
            test['createdAt'] = datetime.utcnow()
            test['updatedAt'] = datetime.utcnow()
            test['deletedAt'] = None
            
            # Initialize empty sections array (will be populated later)
            test['sections'] = []
            
            result = self.db.tests.insert_one(test)
            
            # Map externalSlug to ObjectId
            if test.get('externalSlug'):
                self.test_map[test['externalSlug']] = result.inserted_id
            
            inserted_count += 1
        
        print(f"   ✅ Imported {inserted_count} tests\n")
        return inserted_count
    
    def import_sections(self) -> int:
        """Import sections and resolve testId from testExternalSlug"""
        filepath = os.path.join(self.json_dir, 'testsections.json')
        
        if not os.path.exists(filepath):
            print(f"❌ File not found: {filepath}")
            return 0
        
        with open(filepath, 'r', encoding='utf-8') as f:
            sections = json.load(f)
        
        print(f"📝 Importing {len(sections)} test sections...")
        
        inserted_count = 0
        skipped_count = 0
        
        for section in sections:
            # Resolve testId from testExternalSlug
            test_slug = section.get('testExternalSlug')
            if not test_slug or test_slug not in self.test_map:
                print(f"   ⚠️  Skipping section: test slug '{test_slug}' not found")
                skipped_count += 1
                continue
            
            section['testId'] = self.test_map[test_slug]
            
            # Remove temporary field
            section_ref = section.pop('_ref', None)
            section.pop('testExternalSlug', None)
            
            # Add timestamps
            section['createdAt'] = datetime.utcnow()
            section['updatedAt'] = datetime.utcnow()
            section['deletedAt'] = None
            
            result = self.db.testsections.insert_one(section)
            
            # Map section ref to ObjectId
            if section_ref:
                self.section_map[section_ref] = result.inserted_id
            
            inserted_count += 1
        
        if skipped_count > 0:
            print(f"   ⚠️  Skipped {skipped_count} sections")
        print(f"   ✅ Imported {inserted_count} sections\n")
        return inserted_count
    
    def import_groups(self) -> int:
        """Import question groups and resolve sectionId from sectionRef"""
        filepath = os.path.join(self.json_dir, 'questiongroups.json')
        
        if not os.path.exists(filepath):
            print(f"❌ File not found: {filepath}")
            return 0
        
        with open(filepath, 'r', encoding='utf-8') as f:
            groups = json.load(f)
        
        print(f"📝 Importing {len(groups)} question groups...")
        
        inserted_count = 0
        skipped_count = 0
        
        for group in groups:
            # Resolve sectionId from sectionRef
            section_ref = group.get('sectionRef')
            if not section_ref or section_ref not in self.section_map:
                print(f"   ⚠️  Skipping group: section ref '{section_ref}' not found")
                skipped_count += 1
                continue
            
            group['sectionId'] = self.section_map[section_ref]
            
            # Remove temporary fields
            group_ref = group.pop('_ref', None)
            group.pop('sectionRef', None)
            
            # Add timestamps
            group['createdAt'] = datetime.utcnow()
            group['updatedAt'] = datetime.utcnow()
            group['deletedAt'] = None
            
            result = self.db.questiongroups.insert_one(group)
            
            # Map group ref to ObjectId
            if group_ref:
                self.group_map[group_ref] = result.inserted_id
            
            inserted_count += 1
        
        if skipped_count > 0:
            print(f"   ⚠️  Skipped {skipped_count} groups")
        print(f"   ✅ Imported {inserted_count} groups\n")
        return inserted_count
    
    def import_questions(self) -> int:
        """Import questions and resolve questionGroupId from groupRef"""
        filepath = os.path.join(self.json_dir, 'questions.json')
        
        if not os.path.exists(filepath):
            print(f"❌ File not found: {filepath}")
            return 0
        
        with open(filepath, 'r', encoding='utf-8') as f:
            questions = json.load(f)
        
        print(f"📝 Importing {len(questions)} questions...")
        
        inserted_count = 0
        skipped_count = 0
        
        for question in questions:
            # Resolve questionGroupId from groupRef
            group_ref = question.get('groupRef')
            if not group_ref or group_ref not in self.group_map:
                print(f"   ⚠️  Skipping question {question.get('questionNumber')}: group ref '{group_ref}' not found")
                skipped_count += 1
                continue
            
            question['questionGroupId'] = self.group_map[group_ref]
            
            # Remove temporary fields
            question.pop('groupRef', None)
            
            # Add timestamps
            question['createdAt'] = datetime.utcnow()
            question['updatedAt'] = datetime.utcnow()
            question['deletedAt'] = None
            
            self.db.questions.insert_one(question)
            inserted_count += 1
        
        if skipped_count > 0:
            print(f"   ⚠️  Skipped {skipped_count} questions")
        print(f"   ✅ Imported {inserted_count} questions\n")
        return inserted_count
    
    def update_test_section_references(self):
        """Update tests.sections array with section ObjectIds"""
        print("🔗 Updating test section references...")
        
        updated_count = 0
        for test_slug, test_id in self.test_map.items():
            # Find all sections for this test
            section_ids = []
            for section_ref, section_id in self.section_map.items():
                # Check if this section belongs to this test
                section = self.db.testsections.find_one({'_id': section_id})
                if section and section.get('testId') == test_id:
                    section_ids.append(section_id)
            
            if section_ids:
                # Update test with section IDs
                self.db.tests.update_one(
                    {'_id': test_id},
                    {'$set': {'sections': section_ids}}
                )
                updated_count += 1
        
        print(f"   ✅ Updated {updated_count} tests with section references\n")
    
    def verify_import(self):
        """Verify the import was successful"""
        print("🔍 Verifying import...\n")
        
        tests_count = self.db.tests.count_documents({})
        sections_count = self.db.testsections.count_documents({})
        groups_count = self.db.questiongroups.count_documents({})
        questions_count = self.db.questions.count_documents({})
        
        print(f"   Tests: {tests_count}")
        print(f"   Sections: {sections_count}")
        print(f"   Groups: {groups_count}")
        print(f"   Questions: {questions_count}")
        
        # Check for orphaned documents
        orphaned_sections = self.db.testsections.count_documents({'testId': None})
        orphaned_groups = self.db.questiongroups.count_documents({'sectionId': None})
        orphaned_questions = self.db.questions.count_documents({'questionGroupId': None})
        
        if orphaned_sections > 0:
            print(f"   ⚠️  Found {orphaned_sections} orphaned sections")
        if orphaned_groups > 0:
            print(f"   ⚠️  Found {orphaned_groups} orphaned groups")
        if orphaned_questions > 0:
            print(f"   ⚠️  Found {orphaned_questions} orphaned questions")
        
        if orphaned_sections == 0 and orphaned_groups == 0 and orphaned_questions == 0:
            print("\n   ✅ All references are valid!")
    
    def close(self):
        """Close MongoDB connection"""
        self.client.close()


def main():
    """Main import function"""
    import sys
    import argparse
    
    parser = argparse.ArgumentParser(description='Import JSON files to MongoDB')
    parser.add_argument('--uri', default=os.getenv('IELTS_MONGO_URI', 'mongodb://localhost:27017'),
                        help='MongoDB connection URI')
    parser.add_argument('--db', default=os.getenv('IELTS_MONGO_DB', 'elearning'),
                        help='Database name')
    parser.add_argument('--dir', default='export/new_structure',
                        help='Directory containing JSON files')
    parser.add_argument('--drop', action='store_true',
                        help='Drop existing collections before import')
    
    args = parser.parse_args()
    
    print(f"MongoDB URI: {args.uri}")
    print(f"Database: {args.db}")
    print(f"JSON Directory: {args.dir}\n")
    
    if args.drop:
        confirm = input("⚠️  Are you sure you want to drop existing collections? (yes/no): ")
        if confirm.lower() != 'yes':
            print("❌ Import cancelled.")
            sys.exit(0)
    
    importer = MongoDBImporter(args.uri, args.db, args.dir)
    
    try:
        importer.import_all(drop_existing=args.drop)
        importer.verify_import()
    except Exception as e:
        print(f"\n❌ Import failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        importer.close()
    
    print("\n✨ Import successful!")


if __name__ == '__main__':
    main()

