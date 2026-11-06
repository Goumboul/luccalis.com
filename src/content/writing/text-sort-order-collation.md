---
title: My TEXT column didn't sort like JavaScript
description: A collation bug I found while building a Trello clone.
date: 2026-11-06
kind: note
tags: [postgresql, collation]
---

I'm building a Trello clone for school. To keep the lists in order, each list has a `position`, which is a string. When you move a list, it gets a new string that sorts between its two new neighbours. This way, only one row changes in the database.

The strings are generated in TypeScript and compared with `<`. But the page displays them with `ORDER BY position` in Postgres. So two different systems decide what "sorted" means, and I never checked that they agree.

## They don't agree

JavaScript compares strings byte by byte. For example, `B` comes before `Z`, `Z` comes before `_`, and `_` comes before `a`.

Postgres compares text using the collation of the database. The official Docker image uses `en_US.utf8`, which sorts like a dictionary: it ignores case and symbols at first.

```sql
SELECT k FROM unnest(ARRAY['a0', 'Zz', 'b', 'B', '_x']) AS k ORDER BY k;
-- a0, b, B, _x, Zz

SELECT k FROM unnest(ARRAY['a0', 'Zz', 'b', 'B', '_x']) AS k ORDER BY k COLLATE "C";
-- B, Zz, _x, a0, b
```

The two queries sort the same strings in two different orders.

## The fix

The `C` collation compares bytes, like JavaScript does:

```sql
ALTER TABLE "List" ALTER COLUMN position TYPE text COLLATE "C";
```

This command rebuilds the indexes on the column. It's fast on a small table, but it can block writes for a long time on a big one.

I also added a test. It inserts keys with mixed case and symbols, reads them back with `ORDER BY`, and checks that the order is the same as in JavaScript. The test failed before the fix and passes after it.

## Nothing was broken yet

My key generator only uses `0-9` and `a-z`, and on these characters both orders are the same. So the bug never happened. It would have appeared the day someone changed the alphabet.

The lesson I keep from this: when two systems sort strings, check that they agree.
