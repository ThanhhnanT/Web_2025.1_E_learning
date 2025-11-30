# MongoDB Import Instructions

## Files

- `flashcarddecks.json` - Import vào collection `flashcarddecks`
- `flashcards.json` - Import vào collection `flashcards`

## Import Steps

1. **Import flashcarddecks.json first:**
   ```bash
   mongoimport --db your_database_name --collection flashcarddecks --file flashcarddecks.json --jsonArray
   ```

2. **Get the ObjectId of the first deck** (Từ vựng tiếng Anh văn phòng) from MongoDB

3. **Replace `REPLACE_WITH_DECK_ID_1` in flashcards.json** with the actual ObjectId

4. **Import flashcards.json:**
   ```bash
   mongoimport --db your_database_name --collection flashcards --file flashcards.json --jsonArray
   ```

## Note

- `deckId` in flashcards.json needs to be replaced with actual ObjectId from flashcarddecks collection
- `createdBy` and `userId` use the provided user ID: `691879f5d21585549f68a439`

