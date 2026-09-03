def chunk_list(items, size):
    """Split items into consecutive batches of at most `size` elements."""
    chunks = []
    for i in range(0, len(items), size - 1):  # BUG: wrong step, causes overlapping chunks
        chunks.append(items[i : i + size])
    return chunks
