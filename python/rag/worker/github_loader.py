from typing import List

from conductor.client.worker.worker_task import worker_task
from langchain_community.document_loaders import GitLoader
from langchain.text_splitter import (
    RecursiveCharacterTextSplitter,
    Language,
)
import tempfile
import os

from worker.web_page_loader import make_doc_id


def code_filter(file_path):
    code_extensions = {'.py', '.js', '.java', '.go', '.cpp', '.hpp', '.rs'}
    return any(file_path.endswith(ext) for ext in code_extensions)


@worker_task(task_definition_name='load_github_repo')
def load_github_repo(repo_url: str, branch: str = 'main') -> List:
    file_filter = code_filter
    # Create a temporary directory to clone the repo
    with tempfile.TemporaryDirectory() as temp_dir:
        # Initialize the GitLoader
        loader = GitLoader(
            clone_url=repo_url,
            branch=branch,
            repo_path=temp_dir,
            file_filter=file_filter
        )

        # Load all documents from the repository
        documents = loader.load()

        # Process each document based on its file type
        split_docs = []
        for doc in documents:
            file_path = doc.metadata['source']
            content = doc.page_content

            # Determine the language based on file extension
            if file_path.endswith('.py'):
                splitter = RecursiveCharacterTextSplitter.from_language(
                    language=Language.PYTHON,
                    chunk_size=2000,
                    chunk_overlap=200,
                )
            elif file_path.endswith('.js'):
                splitter = RecursiveCharacterTextSplitter.from_language(
                    language=Language.JS,
                    chunk_size=2000,
                    chunk_overlap=200,
                )
            elif file_path.endswith('.java'):
                splitter = RecursiveCharacterTextSplitter.from_language(
                    language=Language.JAVA,
                    chunk_size=2000,
                    chunk_overlap=200,
                )
            elif file_path.endswith('.go'):
                splitter = RecursiveCharacterTextSplitter.from_language(
                    language=Language.GO,
                    chunk_size=2000,
                    chunk_overlap=200,
                )
            elif file_path.endswith('.cpp') or file_path.endswith('.hpp') or file_path.endswith('.h'):
                splitter = RecursiveCharacterTextSplitter.from_language(
                    language=Language.CPP,
                    chunk_size=2000,
                    chunk_overlap=200,
                )
            elif file_path.endswith('.rs'):
                splitter = RecursiveCharacterTextSplitter.from_language(
                    language=Language.RUST,
                    chunk_size=2000,
                    chunk_overlap=200,
                )
            else:
                # Default to a generic code splitter for unknown file types
                splitter = RecursiveCharacterTextSplitter(
                    chunk_size=2000,
                    chunk_overlap=200,
                    length_function=len,
                    separators=["\n\n", "\n", " ", ""]
                )

            # Split the document
            splits = splitter.split_text(content)

            # Create new documents with the splits
            source_url = f"{repo_url.removesuffix('.git')}/blob/{branch}/{file_path}"
            for i, split in enumerate(splits):
                metadata = doc.metadata.copy()
                metadata['chunk'] = i
                split_docs.append({
                    'doc_id': make_doc_id(source_url, i),
                    'content': f'File: {file_path}\n\n{split}',
                    'metadata': metadata
                })

        for doc in split_docs[100:102]:
            print('-------')
            print(f'{doc}')
            print('-------')
        return split_docs


def example_usage():
    # Example: Load only specific code files
    def code_filter(file_path):
        code_extensions = {'.py', '.js', '.java', '.go', '.cpp', '.hpp', '.rs'}
        return any(file_path.endswith(ext) for ext in code_extensions)

    # Replace with your GitHub repository URL
    repo_url = "https://github.com/username/repository.git"

    try:
        # Load code files from the repository
        documents = load_github_repo(
            repo_url=repo_url,
            branch="main",
            file_filter=code_filter
        )

        # Process the documents
        for doc in documents:
            print(f"Source: {doc['metadata']['source']}")
            print(f"Chunk: {doc['metadata']['chunk']}")
            print(f"Content preview: {doc['content'][:100]}...")
            print("-" * 80)

    except Exception as e:
        print(f"Error loading repository: {str(e)}")
