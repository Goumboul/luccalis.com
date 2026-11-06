---
title: Your TEXT column doesn't sort the way JavaScript does
description: Fractional keys stored as TEXT in PostgreSQL, a database created with en_US.utf8, and why ORDER BY and Array.sort() can disagree.
date: 2026-11-06
kind: note
tags: [postgresql, collation]
---

I'm building a Trello clone for school. Lists and cards are ordered with fractional indexing: instead of an integer position that forces you to renumber everything on each move, every item gets a string key, and moving an item means generating a new key that sorts between its two new neighbours. Only the moved row is written.

The keys live in a `TEXT` column, and the page shows them with `ORDER BY position`. The key generator, on the other hand, runs in TypeScript and compares strings with `<`. That's two different definitions of "sorted", and I had never checked that they agree.

## They don't

JavaScript compares strings by UTF-16 code units. For ASCII, that's byte order: `0-9` < `A-Z` < `_` < `a-z`.

PostgreSQL compares `TEXT` using the column's collation, which defaults to the database's. The official Docker image creates databases with `en_US.utf8`, and that collation sorts like a dictionary: it ignores case and punctuation on the first pass.

```sql
SELECT datcollate FROM pg_database WHERE datname = current_database();
-- en_US.utf8

SELECT k FROM unnest(ARRAY['a0', 'Zz', 'b', 'B', '_x']) AS k ORDER BY k;
-- a0, b, B, _x, Zz

SELECT k FROM unnest(ARRAY['a0', 'Zz', 'b', 'B', '_x']) AS k ORDER BY k COLLATE "C";
-- B, Zz, _x, a0, b
```

Same five strings, two orders. With `en_US`, `_x` comes before `Zz` because the underscore is skipped and `x` < `z`. Byte by byte, `Z` (0x5A) comes before `_` (0x5F). If the generator computes a key between two neighbours using byte order, and the database then sorts with `en_US`, the item can land somewhere else on the next page load.

## The fix

The `C` collation compares bytes, which is exactly what fractional keys need:

```sql
ALTER TABLE "List" ALTER COLUMN position TYPE text COLLATE "C";
```

Changing a column's collation rebuilds every index on it, including the unique index on `(boardId, position)`. That's instant on a small table but takes a lock that blocks writes for the whole rebuild, so on a big table it needs a maintenance window.

The test that caught it inserts keys mixing cases and punctuation, reads them back with `ORDER BY position`, and checks that the result equals the same array sorted in JavaScript. It failed before the migration and passes after.

## The honest part

Our key generator only emits `0-9` and `a-z`, and on that alphabet both orders happen to agree. So nothing was broken yet. The bug was waiting for someone to switch libraries, or widen the alphabet to base 62 for shorter keys.

That's the lesson I'm keeping: whenever two systems both "sort strings", there are two definitions of order. Pin the one you rely on, here with `COLLATE "C"`, and write the test that compares them.
