import xml.etree.ElementTree as ET
from typing import List

import requests
from conductor.client.worker.worker_task import worker_task


@worker_task(task_definition_name='sitemap_urls')
def parse_sitemap(url: str, max_urls: int = 150) -> List[str]:
    # Fetch the sitemap content
    response = requests.get(url)
    response.raise_for_status()  # Raise an error if the request fails

    # Parse the XML content
    root = ET.fromstring(response.content)

    # Extract URLs from the sitemap
    urls = []
    for url in root.findall(".//{http://www.sitemaps.org/schemas/sitemap/0.9}url"):
        loc = url.find("{http://www.sitemaps.org/schemas/sitemap/0.9}loc")
        if loc is not None:
            urls.append(loc.text)

    return urls[:max_urls]
