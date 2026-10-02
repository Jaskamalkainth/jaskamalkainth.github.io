---
title: "Elasticsearch Notes: Inverted Indexes, Shards, Segments and Query DSL"
description: "Elasticsearch from the bottom up: inverted indexes, Lucene shards and segments, why updates are costly, and curl examples for Query DSL, filters and aggregations."
date: 2019-06-08
last_modified_at: 2026-10-02
keywords: [Elasticsearch, Lucene, inverted index, shards, segments, Query DSL, search engine]
related: ["/blog_posts/bloom_filters.html", "/blog_posts/segment_tree_problems.html"]
faq:
  - q: "What is an inverted index in Elasticsearch?"
    a: "An inverted index maps each term to the list of documents that contain it, stored as a sorted term dictionary with postings (document IDs and frequencies). Because the dictionary is sorted, Lucene can find terms and term prefixes quickly instead of scanning every document."
  - q: "What is the difference between a shard and a segment?"
    a: "A shard is a single Lucene index, and an Elasticsearch index is split across one or more shards that can live on different nodes. Each shard is in turn made of immutable segments, small self-contained inverted indexes that are searched together and periodically merged."
  - q: "Why is updating a document in Elasticsearch expensive?"
    a: "Segments are immutable, so an update marks the old document as deleted and indexes a new copy. That costs as much as a fresh insert plus the delete, and the space is only reclaimed when segments are merged."
  - q: "What is the difference between a query and a filter in Elasticsearch?"
    a: "A query (must/should) scores documents by how well they match. A filter (filter/must_not) only decides whether a document matches, without scoring, which makes it cheaper and cacheable. Range conditions such as a price or date window are usually filters."
---

# Elasticsearch Notes

> **In short:** Elasticsearch is a distributed search and analytics engine built on Apache Lucene. An index is split into **shards**; each shard is a Lucene index made of immutable **segments**; each segment is an **inverted index** mapping terms to the documents that contain them. You talk to it with JSON over HTTP, using the Query DSL to combine scored queries, unscored filters and aggregations.

*These notes were written in 2019 against Elasticsearch 6.x. The concepts still hold, but mapping types were removed in 7.x: the URLs below such as `customer/external/1` are `customer/_doc/1` in Elasticsearch 7 and 8.*

___
Elasticsearch is a real time, search and analytics engine.
* Open-source
* High Availability - Keeps redundant data (replicas)
* Schema free - You need not know the details about your database. for ex: what does this column do? you don't care, if you use ES. :)
* Scales massively - One node running in one machine merges with other node running in other machine in the form of clusters.
* Uses RESTful API - JSON over HTTP
* Distributed multi-tenancy - If you need separate instance for an Application for every usecase. Single cluster in a DB can store many different characteristics.
* Lucene based.
* Uses _version numbers for optimistic concurrency control - every time we interact with a doc , its _version number increments. This is used to make sure that we don't miss any changes without locking.

## Elasticsearch from the Bottom up
### Inverted Indexes and Index Terms

We have a cluster of nodes in ES , within a cluster we have an ES index which spans multiple nodes through shards.
Shard is a lucene index.
Lucene is full text search library used by Elasticsearch. within a lucene index, we have segments (mini index) within segment we have,
*  *INVERTED INDEX*
     
    ``` sorted dictionary[terms]  | freq | docs   [format used to store inverted indexes]```
         
    In this sorted dictionary say we want words with ‘c’ beginning , so for this we can do binary search on it.
    now find every term containing “ours” ? (brute: all terms, which is bad)
    In other words, we can efficiently find things given term prefixes. When all we have is an inverted index, we want       everything to look like a string prefix problem. So we can do some transformations.
    * To find everything with a common suffix, we can index the reverse and we can search for everything with the common reverse(suffix).
    * To find substrings, terms are splitted into smaller terms called "n-grams". Ex: "yours" can be split into "yo", "you","our","urs","rs", this means that we could get occurrences of "ours" by searching for "our" and "urs"
    *  Geographical coordinate points such as (10.1,12.32) can be converted into "geo hashes", in this case "jkd224fk". The longer the string, the greater the precision.
    * Soundex and metaphone can be used to find strings that sound similar when pronounced out loud. Phonetic matching is enabled which uses above mentioned algorithms.
    * Lucene stores 123 as "1"-hundreds, "12"-tens and "123". Hence, searching for everything in the range[100,199] is therefore everything matching the "1"-hundreds-term. This can be done in a trie like fashion, so range searches can be done efficiently.
    * To do "Did you mean?" type searches and find spellings that are close to the input, a "Levenshtein" automaton can be built to effectively traverse the dictionary. This is too complex. 
    

### Building Indexes and Index Segments

Few factors which are important while building inverted indexes are speed, index compactness, indexing speed and update time.
Various compression techniques for ex: Delta encoding is used to minimize index sizes. Lucene does not update these small data structures. This is different from B-Trees , which can be updated.
Segments are immutable. When you delete a document , bitmap[fileremove] = 1 but the segment doesn’t change.
These Data structures are stored in segments. Lucene searches all the segments and merge the results.
Lucene also Caches all the things. Merging happens therefore indexes gets reduced by adding stuff.
when you search these shards, same as searching segments and then merge the data.
searching 1 ES Index with 2 shards is same as 2 ES index with 1 shard each.
Can’t split a shard but we can move one shard to other.
User put his doc in an Index and then that index decides in which shard to put that data. When you query for a particular doc in an index, that index searches all the shards.


>Updating a previously indexed document is a delete followed by a re-insertion of the document. Note that this means that updating a document is even more expensive than adding it in the first place. 
These indexes are built first in-memory, then occasionally flushed in segments to disk.


___

## Installation
```
brew install elasticsearch   # or run the official Docker image
```
___
## Exploring your cluster / Modifying data / Exploring Data

> The pretty parameter, again, just tells Elasticsearch to return pretty-printed JSON results.
### Cluster health
```
curl -XGET 'localhost:9200/_cat/health?v&pretty'
```
 * GET is a verb( PUT, POST, HEAD).
 * localhost is a node.
 * 9200 is HTTP port.
 * pretty is to make output easier to read.

### List nodes
```
curl -XGET 'localhost:9200/_cat/nodes?v&pretty'
```
### Create an index
```
curl -XPUT 'localhost:9200/customer?pretty&pretty'
curl -XGET 'localhost:9200/_cat/indices?v&pretty'
```
### Index and Query a Document
```
curl -XPUT 'localhost:9200/customer/external/1?pretty&pretty' -H 'Content-Type: application/json' -d'
{
  "name": "John Doe"
}'
curl -XGET 'localhost:9200/customer/external/1?pretty&pretty'
```
### Delete an Index
```
curl -XDELETE 'localhost:9200/customer?pretty&pretty'
curl -XGET 'localhost:9200/_cat/indices?v&pretty'
```
### Summary
```
curl -XPUT 'localhost:9200/customer?pretty'
curl -XPUT 'localhost:9200/customer/external/1?pretty' -H 'Content-Type: application/json' -d'
{
  "name": "John Doe"
}'
curl -XGET 'localhost:9200/customer/external/1?pretty'
curl -XDELETE 'localhost:9200/customer?pretty'
```
### Updating Documents
```
curl -XPOST 'localhost:9200/customer/external/1/_update?pretty&pretty' -H 'Content-Type: application/json' -d'
{
  "doc": { "name": "Jane Doe" }
}'
```
### Deleting Documents
```
curl -XDELETE 'localhost:9200/customer/external/2?pretty&pretty'
```
### Bulk-load a sample index (bank, 1000 docs)

```
curl -H "Content-Type: application/json" -XPOST 'localhost:9200/bank/account/_bulk?pretty&refresh' --data-binary "@accounts.json"
curl 'localhost:9200/_cat/indices?v'
```
### Query DSL

> match_all query is simply a search for all documents in the specified index ( bank ).
```
curl -XGET 'localhost:9200/bank/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "query": { "match_all": {} }
}'
```

> Note that if size is not specified, it defaults to 10.
```
curl -XGET 'localhost:9200/bank/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "query": { "match_all": {} },
  "size": 1
}'
```
> match_all and returns documents 11 through 20:
```
curl -XGET 'localhost:9200/bank/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "query": { "match_all": {} },
  "from": 10,
  "size": 10
}'
```
>This example does a match_all and sorts the results by account balance in descending order and returns the top 10 (default size) documents.
```
curl -XGET 'localhost:9200/bank/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "query": { "match_all": {} },
  "sort": { "balance": { "order": "desc" } }
}'
```
> This example shows how to return two fields, account_number and balance (inside of _source), from the search.
```
curl -XGET 'localhost:9200/bank/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "query": { "match_all": {} },
  "_source": ["account_number", "balance"]
}'
```
>This example returns the account numbered 20.
```
curl -XGET 'localhost:9200/bank/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "query": { "match": { "account_number": 20 } }
}'
```
>This example returns all accounts containing the term "mill" in the address.
```
curl -XGET 'localhost:9200/bank/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "query": { "match": { "address": "mill" } }
}'
```
>This example is a variant of match (match_phrase) that returns all accounts containing the phrase "mill lane" in the address:
```
curl -XGET 'localhost:9200/bank/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "query": { "match_phrase": { "address": "mill lane" } }
}'
```
### Bool query

>This allows us to compose smaller queries into bigger queries using Boolean logic.
**must (and)** ,  **should (or)** , **must_not** clause is used.
>This example composes two match queries and returns all accounts containing "mill" and "lane" in the address:
```
curl -XGET 'localhost:9200/bank/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "query": {
    "bool": {
      "must": [
        { "match": { "address": "mill" } },
        { "match": { "address": "lane" } }
      ]
    }
  }
}'
```
>We can combine must, should, and must_not clauses simultaneously inside a bool query. 
```
curl -XGET 'localhost:9200/bank/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "query": {
    "bool": {
      "must": [
        { "match": { "age": "40" } }
      ],
      "must_not": [
        { "match": { "state": "ID" } }
      ]
    }
  }
}'
```

___

### Executing Filters

>The score is a numeric value that is a relative measure of how well the document matches the search query that we specified. The higher the score, the more relevant the document is, the lower the score, the less relevant the document is.


>Range query, which allows us to filter documents by a range of values.

```
curl -XGET 'localhost:9200/bank/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "query": {
    "bool": {
      "must": { "match_all": {} },
      "filter": {
        "range": {
          "balance": {
            "gte": 20000,
            "lte": 30000
          }
        }
      }
    }
  }
}'
```
___

### Executing Aggregations

>Aggregations provide the ability to group and extract statistics from your data. 
```
curl -XGET 'localhost:9200/bank/_search?pretty' -H 'Content-Type: application/json' -d'
{
  "size": 0,
  "aggs": {
    "group_by_state": {
      "terms": {
        "field": "state.keyword"
      }
    }
  }
}'
```
>size = 0 means , we only want to see aggregated results.

___

### Conclusion

Till now, we've learned the basics of what Elasticsearch is and how to work with it using some of the basic REST APIs.

___

