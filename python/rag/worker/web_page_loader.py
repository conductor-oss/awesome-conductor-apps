import hashlib
from html.parser import HTMLParser
from typing import List

import requests
from conductor.client.worker.worker_task import worker_task
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Document ids are stored in a VARCHAR(255) column by the pgvector store
MAX_DOC_ID_LENGTH = 255


def make_doc_id(source: str, chunk: int) -> str:
    doc_id = f'{source}#{chunk}'
    if len(doc_id) <= MAX_DOC_ID_LENGTH:
        return doc_id
    digest = hashlib.sha1(source.encode()).hexdigest()[:12]
    suffix = f'~{digest}#{chunk}'
    return source[:MAX_DOC_ID_LENGTH - len(suffix)] + suffix


class TextExtractor(HTMLParser):
    """Collects visible text, skipping scripts, styles and site navigation."""
    SKIP = {'script', 'style', 'nav', 'header', 'footer'}

    def __init__(self):
        super().__init__()
        self.skipping = 0
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP:
            self.skipping += 1

    def handle_endtag(self, tag):
        if tag in self.SKIP and self.skipping:
            self.skipping -= 1

    def handle_data(self, data):
        if not self.skipping and data.strip():
            self.parts.append(data.strip())


@worker_task(task_definition_name='load_web_page')
def load_web_page(url: str, chunk_size: int = 8000, chunk_overlap: int = 200) -> List:
    response = requests.get(url, timeout=30)
    response.raise_for_status()

    parser = TextExtractor()
    parser.feed(response.text)
    text = '\n'.join(parser.parts)

    splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    return [
        {'doc_id': make_doc_id(url, i), 'content': chunk, 'metadata': {'source': url, 'chunk': i}}
        for i, chunk in enumerate(splitter.split_text(text))
    ]
