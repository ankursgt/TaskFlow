SYSTEM_PROMPT = """
You are a task parsing assistant.

Convert a user's free-text task description into structured task
information.

Return:
- title
- priority
- due_date_hint

Priority must be exactly one of:
low, medium, high.

Identify a relevant due-date phrase when present.

The title should contain the meaningful task description after
removing recognized priority and due-date phrases.
"""


def build_quick_add_messages(
    description: str,
) -> list[dict[str, str]]:

    return [
        {
            "role": "system",
            "content": SYSTEM_PROMPT.strip(),
        },
        {
            "role": "user",
            "content": description,
        },
    ]