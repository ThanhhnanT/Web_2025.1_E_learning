# Database Migration Scripts

This directory contains scripts for migrating data between database schema versions.

## Transform to New Structure

**File:** `transform-to-new-structure.ts`

**Purpose:** Transforms the old flat content/answer structure to the new hierarchical structure with TestSections, QuestionGroups, and Questions.

### What it does:

1. **Updates Test documents** with new fields:
   - `testType` (IELTS, HSK, etc.)
   - `skill` (listening, reading, etc.)
   - `series` (e.g., "Cambridge IELTS 20")
   - `testNumber` (e.g., "Test 1")
   - `sourceUrl`

2. **Creates TestSection documents** for each part:
   - One section per part (Part 1, Part 2, etc.)
   - Stores resources (audio, passage, transcript)
   - Maps to listening/reading section type

3. **Creates QuestionGroup documents**:
   - Groups questions with shared context
   - Stores shared content (passages, diagrams, etc.)
   - Defines question ranges

4. **Creates Question documents**:
   - Individual question with specific type
   - Stores correct answers and alternatives
   - Determines question type from answer pattern:
     - A, B, C, D → Multiple Choice
     - TRUE/FALSE/NOT GIVEN → True/False/Not Given
     - YES/NO/NOT GIVEN → Yes/No/Not Given
     - Text → Fill in the Blank

### Running the migration:

```bash
cd backend
npm run build
npm run migration:transform
```

Or directly with ts-node:

```bash
cd backend
npx ts-node src/migrations/transform-to-new-structure.ts
```

### Important Notes:

- **Backup your database** before running migrations
- The migration is **idempotent** - you can run it multiple times
- Old data (contents, answers) is **NOT deleted** - it remains for backward compatibility
- Check the console output for any errors or warnings
- Migration creates new collections: `testsections`, `questiongroups`, `questions`

### Rollback:

If you need to rollback, you can:
1. Restore from backup
2. Or manually delete documents from new collections:
   - `testsections`
   - `questiongroups`
   - `questions`
3. Revert Test documents to remove new fields

### Verification:

After migration, verify:
1. All tests have sections: `GET /tests/:id/structure`
2. Sections have questions: `GET /tests/:id/sections/:sectionId`
3. Full test structure loads: `GET /tests/:id/full`

