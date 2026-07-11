def generate_title(prompt: str) -> str:

    words = prompt.strip().split()

    title = " ".join(words[:5])

    if len(words) > 5:
        title += "..."

    return title.title()