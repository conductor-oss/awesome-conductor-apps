# Documentation and Code Search (RAG) with Conductor

Ask questions about a documentation site and a code repository, and get answers grounded in their content. Built with [Conductor](https://github.com/conductor-oss/conductor)'s built-in LLM and vector database tasks.

## How it works

| Workflow | What it does |
| --- | --- |
| `index_site` | Reads a sitemap and runs one `index_page` sub-workflow per page: fetch the page, split its text into chunks (8000 chars, 200 overlap) and index each chunk with `LLM_INDEX_TEXT`. |
| `github_repo_index` | Clones a GitHub repository, splits its code files into chunks and indexes each chunk. |
| `site-search` | Searches the documentation and code indexes in parallel (`LLM_SEARCH_INDEX`), then `LLM_CHAT_COMPLETE` answers the question from the relevant results and lists its sources. |

Workers (started by `main.py`):

* [`worker/sitemap_loader.py`](worker/sitemap_loader.py): `sitemap_urls` lists the pages in a sitemap.
* [`worker/web_page_loader.py`](worker/web_page_loader.py): `load_web_page` fetches a page and splits its text into chunks.
* [`worker/github_loader.py`](worker/github_loader.py): `load_github_repo` clones a repository and splits its code into chunks.

## Run it locally

Requires Python 3.10+, Docker, the [Conductor CLI](https://github.com/conductor-oss/conductor-cli) and an OpenAI API key.

1. Start a pgvector database:

   ```shell
   docker run -d --name rag-pgvector -p 5433:5432 \
     -e POSTGRES_USER=conductor -e POSTGRES_PASSWORD=conductor -e POSTGRES_DB=vectors \
     pgvector/pgvector:pg17
   docker exec rag-pgvector psql -U conductor -d vectors -c "CREATE EXTENSION IF NOT EXISTS vector;"
   ```

2. Start a local Conductor server with OpenAI and the vector database configured. Run it from a directory outside this repository, because the server creates its database files in the current directory:

   ```shell
   export OPENAI_API_KEY=<<YOUR_OPENAI_API_KEY>>
   export CONDUCTOR_VECTORDB_INSTANCES_0_NAME=pgvector-local
   export CONDUCTOR_VECTORDB_INSTANCES_0_TYPE=postgres
   export CONDUCTOR_VECTORDB_INSTANCES_0_POSTGRES_DATASOURCEURL=jdbc:postgresql://localhost:5433/vectors
   export CONDUCTOR_VECTORDB_INSTANCES_0_POSTGRES_USER=conductor
   export CONDUCTOR_VECTORDB_INSTANCES_0_POSTGRES_PASSWORD=conductor
   export CONDUCTOR_VECTORDB_INSTANCES_0_POSTGRES_DIMENSIONS=1536
   export CONDUCTOR_VECTORDB_INSTANCES_0_POSTGRES_DISTANCEMETRIC=cosine
   export CONDUCTOR_VECTORDB_INSTANCES_0_POSTGRES_TABLEPREFIX=rag
   conductor server start
   ```

3. In this directory, install the requirements and start the workers:

   ```shell
   pip3 install -r requirements.txt
   export CONDUCTOR_SERVER_URL=http://localhost:8080/api
   python3 main.py
   ```

4. In a second terminal, register the workflows and index the default sources (the [conductor-oss.org](https://conductor-oss.org) sitemap, up to 150 pages, and this repository):

   ```shell
   export CONDUCTOR_SERVER_URL=http://localhost:8080/api
   python3 index.py
   ```

   Use `--sitemap`, `--max-pages`, `--repo` and `--branch` to index other sources. Run `python3 index.py --help` for details.

5. Ask a question:

   ```shell
   python3 workflow.py "How does Netflix use Conductor for media processing?"
   ```

   The answer model defaults to `gpt-5-nano`. Set `OPENAI_DEFAULT_MODEL` to use another one.

## Notes

* The workflows default to the `pgvector-local` vector database, the `docs` and `code` indexes, and OpenAI's `text-embedding-3-small` (1536 dimensions). Each can be overridden through the workflow inputs.
* Re-running an indexer updates existing chunks rather than duplicating them, because each chunk's id is its source URL plus its chunk number.
* Large repositories produce large task payloads. Start with small or medium-sized repositories.
