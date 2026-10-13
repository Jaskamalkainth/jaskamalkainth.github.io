---
title: "Lakehouse vs Data Lake: Differences and When to Use Each"
description: "A data lake is object storage of open files; a lakehouse adds a table format (Delta Lake, Iceberg, Hudi) for ACID, updates and time travel. When to use which."
date: 2026-10-13
last_modified_at: 2026-10-13
keywords: [lakehouse vs data lake, data lakehouse, data lake, Delta Lake, Apache Iceberg, Apache Hudi, open table format, data warehouse]
categories: data-engineering
related: ["/blog_posts/elasticsearchNotes.html", "/blog_posts/bloom_filters.html"]
faq:
  - q: "Is a lakehouse just a data lake with a new name?"
    a: "No. The storage is the same (Parquet files on S3, ADLS or GCS), but a lakehouse adds a transaction log or metadata layer, called a table format, on top. That layer turns a folder of files into a table with atomic commits, schema enforcement, row-level updates and deletes, and time travel, which a plain folder of files cannot offer."
  - q: "Do I still need a data warehouse if I have a lakehouse?"
    a: "Often not for new projects, because SQL engines such as Spark, Trino, DuckDB, Snowflake and BigQuery can query lakehouse tables directly. A managed warehouse can still be simpler when your data is small, your team only writes SQL, or you need very high-concurrency dashboards with no platform engineering. Many companies run both and point the warehouse at Iceberg or Delta tables."
  - q: "Delta Lake vs Apache Iceberg vs Apache Hudi: which should I pick?"
    a: "Pick the format your main engine and catalog support best. Delta Lake is the native format of Databricks, Iceberg has the broadest multi-engine and multi-vendor support (Snowflake, AWS, Trino, Spark, Flink), and Hudi focuses on streaming upserts and incremental processing. All three store data as Parquet and give ACID commits and time travel, so the choice is mostly about ecosystem."
  - q: "Does deleting a row in a lakehouse remove the data immediately?"
    a: "No. A delete writes a new table version that no longer references the row, but the old Parquet files stay on storage so time travel keeps working. The bytes are only removed when you run a cleanup job, such as VACUUM in Delta Lake or expire_snapshots plus orphan-file removal in Iceberg. For GDPR erasure, schedule that cleanup."
  - q: "When is a plain data lake enough?"
    a: "A plain data lake is enough when data is written once and never updated: raw landing zones, archives, logs, and unstructured files such as images, audio and PDFs for machine learning. If only one batch job writes each folder and readers tolerate eventual consistency, a table format adds operational work without much benefit."
---

# Lakehouse vs Data Lake: Differences and When to Use Each

> **In short:** a **data lake** is low-cost object storage (S3, ADLS, GCS) holding raw files in open formats like Parquet, JSON and images, read with schema-on-read. A **lakehouse** keeps that same storage but adds an open table format (Delta Lake, Apache Iceberg or Apache Hudi) that gives ACID transactions, schema enforcement, updates, deletes and time travel. Use a lake for raw and unstructured data; use a lakehouse for tables people query and change.

The two terms get used interchangeably in vendor marketing, which is confusing because the difference is concrete: it is one metadata layer. Below I explain what that layer does, show it working in about 20 lines of Python, and give a decision guide for when each one is the right tool.

## What is a data lake?

A data lake is a storage system with a file API, usually cloud object storage, where you dump data in open file formats without forcing it into a schema first. The idea is *schema-on-read*: store everything cheaply now, decide how to interpret it when you query it. The term is usually credited to James Dixon of Pentaho, around 2010.

A typical lake is just a folder tree:

```text
s3://company-lake/
  raw/clickstream/date=2026-10-12/part-0001.json.gz
  raw/app_db/orders/date=2026-10-12/part-0001.parquet
  ml/images/product-photos/123.jpg
```

That simplicity is its strength and its weakness. Any engine (Spark, Trino, DuckDB, pandas, PyTorch) can read the files, and storage costs little. But a folder of files has no idea what a *transaction* is. A job that crashes halfway leaves half its files behind, two writers can overwrite each other, readers can see a partial write, and changing one row means rewriting whole files by hand. Unmanaged lakes that nobody trusts are often called "data swamps".

## What is a data lakehouse?

A lakehouse is a data lake plus a **table format**: a transaction log or metadata tree, stored next to the data files, that records exactly which files make up each version of a table. The term was popularised by the CIDR 2021 paper [*Lakehouse: A New Generation of Open Platforms that Unify Data Warehousing and Advanced Analytics*](https://www.cidrdb.org/cidr2021/papers/cidr2021_paper17.pdf) (Armbrust, Ghodsi, Xin and Zaharia), which defines it by three traits: open direct-access formats such as Parquet, first-class support for machine learning and data science, and state-of-the-art SQL performance.

The paper's motivation is the *two-tier* setup most companies ran: ETL raw data into a lake, then ETL a subset again into a warehouse such as Redshift or Snowflake. The authors list four problems with that: keeping the two copies consistent (reliability), warehouse data lagging the lake (staleness), ML tools working poorly on warehouses, and paying twice for storage plus proprietary lock-in. A lakehouse tries to give you warehouse features directly on the lake copy.

The three main open table formats are:

| Format | Metadata layout | Known for |
|---|---|---|
| [Delta Lake](https://delta.io/) | `_delta_log/` folder of JSON commits plus Parquet checkpoints | Native format of Databricks; simple log design |
| [Apache Iceberg](https://iceberg.apache.org/) | Metadata files → manifest lists → manifests | Broadest multi-engine and vendor support; hidden partitioning |
| [Apache Hudi](https://hudi.apache.org/) | `.hoodie/` timeline of actions | Streaming upserts and incremental reads |

All three keep the actual data as Parquet files, so the storage cost is the same as a plain lake. On top of the table format you normally run a **catalog** (Hive Metastore, AWS Glue, Unity Catalog, an Iceberg REST catalog) that maps table names to their current metadata and handles permissions.

## Lakehouse vs data lake: the differences side by side

| | Data lake | Lakehouse |
|---|---|---|
| Storage | Object storage (S3, ADLS, GCS, HDFS) | Same object storage |
| File formats | Anything: Parquet, ORC, CSV, JSON, images, audio | Parquet (or ORC/Avro) under a table format |
| Unit of data | Files and folders | Tables with versions |
| Transactions | None; partial writes are visible | ACID commits; readers see a whole version or nothing |
| Schema | On read; drift goes unnoticed | Enforced on write, with explicit schema evolution |
| Update / delete a row | Rewrite files yourself | `UPDATE`, `DELETE`, `MERGE` |
| Time travel | No | Query any retained version |
| Concurrent writers | Unsafe without external locking | Optimistic concurrency control |
| Query speed | Engine must list files and read footers | File stats in metadata allow skipping files |
| Best for | Raw, append-only and unstructured data | Curated tables for BI, ML features, CDC |
| Operational work | Low | Compaction, snapshot expiry, catalog |

## How does a lakehouse table work? A runnable example

The quickest way to see the difference is to make a table. This uses the [`deltalake`](https://delta-io.github.io/delta-rs/) Python package (Delta Lake without Spark) and [DuckDB](https://duckdb.org/docs/stable/core_extensions/delta). I ran it with `deltalake` 1.6.6 and `duckdb` 1.5.6 (`pip install deltalake pandas duckdb`).

```python
import pandas as pd
from deltalake import DeltaTable, write_deltalake

path = "orders"  # a local folder here; s3://bucket/orders in production

# Version 0: create the table
write_deltalake(path, pd.DataFrame({"order_id": [1, 2], "amount": [250.0, 99.5]}))

# Version 1: append new orders (an atomic commit, not loose files)
write_deltalake(path, pd.DataFrame({"order_id": [3], "amount": [1200.0]}), mode="append")

# Schema enforcement: a write with the wrong column type is rejected
try:
    write_deltalake(path, pd.DataFrame({"order_id": ["four"], "amount": [10.0]}), mode="append")
except Exception as e:
    print("rejected:", str(e).splitlines()[0][:70])

# Version 2: delete a row in place
DeltaTable(path).delete("order_id = 2")

dt = DeltaTable(path)
print("current version:", dt.version())
print("rows now:", sorted(dt.to_pandas()["order_id"]))
print("rows at v1:", sorted(DeltaTable(path, version=1).to_pandas()["order_id"]))
print("history:", [h["operation"] for h in dt.history()])
```

Output:

```text
rejected: Cast error: Cannot cast string 'four' to value of Int64 type
current version: 2
rows now: [1, 3]
rows at v1: [1, 2, 3]
history: ['DELETE', 'WRITE', 'WRITE']
```

The folder now holds three Parquet files and a `_delta_log/` directory with one JSON file per commit (`00000000000000000000.json` to `...02.json`). The log says which files are live in each version, which is all a lakehouse really is.

Now read the same folder two ways with DuckDB, once as a table and once as a plain lake of Parquet files:

```python
import duckdb

print(duckdb.sql("SELECT count(*), sum(amount) FROM delta_scan('orders')").fetchall())
print(duckdb.sql("SELECT count(*) FROM 'orders/*.parquet'").fetchall())
```

```text
[(2, 1450.0)]
[(4,)]
```

The table answer is correct: 2 orders. The raw-file answer is 4: the delete wrote a new file containing only order 1 and marked the original file (orders 1 and 2) as removed in the log, but both files are still in the folder. Reading the folder directly counts order 1 twice and brings back the deleted order 2. Any tool that reads a lakehouse table as plain files gets wrong numbers. In a lakehouse the metadata, not the folder listing, is the source of truth.

That old file is also why a delete does not free space or erase data right away. Delta Lake keeps unreferenced files until you run [`VACUUM`](https://docs.delta.io/delta-utility/) (default retention 7 days); Iceberg uses [`expire_snapshots` and `remove_orphan_files`](https://iceberg.apache.org/docs/latest/spark-procedures/). If you need GDPR-style erasure, that cleanup job is part of the delete.

## When should you use a data lake?

A plain lake, with no table format, is the right choice when:

- **Data is written once and never changed.** Raw API dumps, application logs, clickstream landing zones and archives.
- **The data isn't tabular.** Images, audio, video, PDFs and model checkpoints for ML training. Table formats don't help with a folder of JPEGs.
- **One writer owns each folder** and readers can tolerate seeing new files a little late.
- **You are keeping a raw copy for replay.** If a downstream table has a bug, you rebuild it from the untouched raw files.

In these cases a table format mainly adds maintenance (compaction, snapshot expiry, a catalog) for features you won't use.

## When should you use a lakehouse?

Move a dataset into a lakehouse table when any of these is true:

- **Rows change.** Change data capture from an operational database, upserts with `MERGE`, late-arriving corrections, or deletes for privacy requests.
- **Several jobs write the same table**, or readers must never see a half-finished write.
- **BI dashboards or analysts query it directly**, so wrong counts are visible to the business. File statistics in the metadata let engines skip files, similar in spirit to how a [Bloom filter](/blog_posts/bloom_filters.html) lets you skip a lookup; Parquet itself also supports [Bloom filters per column chunk](https://parquet.apache.org/docs/file-format/bloomfilter/).
- **You need reproducibility.** Time travel lets you retrain an ML model on exactly the data a past model saw, or audit what a report showed last month.
- **Several engines share one copy.** Spark writes, Trino or DuckDB reads, and a warehouse queries the same Iceberg or Delta tables, so there is no second ETL into a warehouse.

## How do lakes and lakehouses fit together in practice?

Most real platforms use both, layer by layer. A common pattern, which Databricks calls the [medallion architecture](https://www.databricks.com/blog/what-is-medallion-architecture), looks like this:

1. **Bronze (raw):** files land as they arrive. This is often a plain data lake, or an append-only table.
2. **Silver (cleaned):** deduplicated, typed, joined data in lakehouse tables, updated with `MERGE`.
3. **Gold (serving):** aggregated tables for dashboards and ML features, also lakehouse tables.

Unstructured data (images, audio) stays as plain files in the lake, often with a lakehouse table that stores its paths and labels. A lakehouse is also not a search engine: for full-text or relevance search over the same data you still index it into something like [Elasticsearch](/blog_posts/elasticsearchNotes.html).

## What are the downsides of a lakehouse?

- **Maintenance:** frequent small writes create many small files, so you need scheduled compaction (`OPTIMIZE` in Delta, [`rewrite_data_files`](https://iceberg.apache.org/docs/latest/spark-procedures/) in Iceberg) and snapshot or log cleanup.
- **Catalog choice matters:** the catalog decides which engines can write safely and who controls permissions, and switching later is work.
- **Engine support varies:** not every engine supports every feature or the latest version of each table format spec, so check your engines before turning on new table features.
- **Not a transactional database:** commits take seconds, not milliseconds. Serve your application from Postgres or MySQL and replicate into the lakehouse.

## Sources

- Armbrust, Ghodsi, Xin, Zaharia, [*Lakehouse: A New Generation of Open Platforms that Unify Data Warehousing and Advanced Analytics*](https://www.cidrdb.org/cidr2021/papers/cidr2021_paper17.pdf), CIDR 2021
- [Delta Lake documentation](https://docs.delta.io/) and the [delta-rs Python package](https://delta-io.github.io/delta-rs/)
- [Apache Iceberg table spec](https://iceberg.apache.org/spec/) and [maintenance guide](https://iceberg.apache.org/docs/latest/maintenance/)
- [Apache Hudi overview](https://hudi.apache.org/docs/overview)
- [DuckDB Delta extension](https://duckdb.org/docs/stable/core_extensions/delta)
- [Data lake (Wikipedia)](https://en.wikipedia.org/wiki/Data_lake), for the origin of the term
