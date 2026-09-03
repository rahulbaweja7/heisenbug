def chunk_list(items, size):
    """Split items into consecutive batches of at most `size` elements."""
    chunks = []
    for i in range(0, len(items), size):
        chunks.append(items[i : i + size])
    return chunks
