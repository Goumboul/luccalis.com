---
title: my TEXT column didn't sort like javascript
description: a collation bug i found while building a trello clone.
date: 2026-11-06
kind: note
tags: [postgresql, collation]
---

i'm building a trello clone for school. to keep lists in order, each list has a `position` that's a string (fractional indexing). when you move a list, you just give it a new string that sorts between its two neighbours. only one row changes.

the strings are generated in typescript, and compared with `<`. but the page shows them with `ORDER BY position` in postgres. so two different things decide what "sorted" means. i never checked that they agree.

## they don't

javascript compares bytes, basically. so `B` < `Z` < `_` < `a`.

postgres compares text with the collation of the database. the docker image uses `en_US.utf8`, which sorts like a dictionary: it ignores case and symbols at first.

```sql
SELECT k FROM unnest(ARRAY['a0', 'Zz', 'b', 'B', '_x']) AS k ORDER BY k;
-- a0, b, B, _x, Zz

SELECT k FROM unnest(ARRAY['a0', 'Zz', 'b', 'B', '_x']) AS k ORDER BY k COLLATE "C";
-- B, Zz, _x, a0, b
```

same strings, two different orders.

## the fix

`COLLATE "C"` compares bytes, like javascript:

```sql
ALTER TABLE "List" ALTER COLUMN position TYPE text COLLATE "C";
```

careful: this rebuilds the indexes on the column. fine on a small table, not on a big one.

i also added a test: insert keys with mixed case and symbols, read them back with `ORDER BY`, and check it's the same as sorting them in javascript. it failed before the fix, passes after.

## plot twist

my key generator only uses `0-9` and `a-z`. on those characters, both orders are the same. so nothing was actually broken yet. it would have broken the day someone changed the alphabet.

what i keep from this: when two systems sort strings, check they agree.
