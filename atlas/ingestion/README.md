# Atlas Ingestion System

**Separate from runtime environment**

This system builds the cognitive map by:
- Controlled, scheduled snapshotting of approved domains
- Building web graph, topic graph, knowledge graph, content index
- No autonomous crawling without explicit rules

## Architecture

The ingestion system runs separately from the runtime Atlas system. It:
1. Takes approved domains/sources
2. Crawls and indexes content (with explicit rules)
3. Builds the cognitive map structures
4. Exports data for runtime use

## Runtime Cannot Trigger Ingestion

The runtime Atlas system has **zero outbound internet access**. It only:
- Traverses the pre-built graph
- Performs local semantic retrieval
- Does local reasoning
- Executes tools (DAW, filesystem, etc.)

Ingestion happens in a separate, controlled environment.

