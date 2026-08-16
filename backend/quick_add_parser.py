import re
from schemas import QuickAddParsedTask


PRIORITY_HIGH_KEYWORDS = [
    "urgent",
    "asap",
]

PRIORITY_LOW_KEYWORDS = [
    "whenever",
    "low priority",
]


DATE_PHRASES = [
    "today",
    "tomorrow",
    "next week",
    "next monday",
    "next tuesday",
    "next wednesday",
    "next thursday",
    "next friday",
    "next saturday",
    "next sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
]


def contains_keyword(text: str, keyword: str) -> bool:
    """
    Case-insensitive keyword matching.
    """
    return re.search(
        rf"\b{re.escape(keyword)}\b",
        text,
        flags=re.IGNORECASE,
    ) is not None


def find_all_spans(text: str, keyword: str) -> list[tuple[int, int]]:
    """
    Find every case-insensitive occurrence of a keyword
    while preserving the original-cased source text.
    """

    return [
        match.span()
        for match in re.finditer(
            rf"\b{re.escape(keyword)}\b",
            text,
            flags=re.IGNORECASE,
        )
    ]


def remove_spans(text: str, spans: list[tuple[int, int]]) -> str:
    """
    Remove spans from the original text.
    """

    if not spans:
        return text

    # Process backwards so earlier indexes remain valid.
    for start, end in sorted(
        spans,
        key=lambda span: span[0],
        reverse=True,
    ):
        text = text[:start] + text[end:]

    return text


def parse_quick_add(description: str) -> QuickAddParsedTask:
    """
    Deterministic, zero-network mock parser.

    The algorithm intentionally mirrors the expected
    LLM-style structured response.
    """

    # ---------------------------------------------------------
    # A. Lower-cased working copy for matching
    # ---------------------------------------------------------

    working_text = description.lower()


    # ---------------------------------------------------------
    # B. Priority
    # ---------------------------------------------------------

    priority = "medium"

    if any(
        contains_keyword(working_text, keyword)
        for keyword in PRIORITY_HIGH_KEYWORDS
    ):
        priority = "high"

    elif any(
        contains_keyword(working_text, keyword)
        for keyword in PRIORITY_LOW_KEYWORDS
    ):
        priority = "low"


    # ---------------------------------------------------------
    # C. Due-date hint
    # ---------------------------------------------------------

    due_date_hint = None

    matched_date_phrase = None

    for phrase in DATE_PHRASES:

        if contains_keyword(
            working_text,
            phrase,
        ):
            matched_date_phrase = phrase
            due_date_hint = phrase
            break


    # ---------------------------------------------------------
    # D. Build title
    #
    # Remove:
    #   - EVERY priority keyword occurrence
    #   - EVERY occurrence of the matched date phrase
    #
    # Use original-cased description.
    # ---------------------------------------------------------

    spans_to_remove = []


    # Remove EVERY occurrence of ALL priority keywords.
    for keyword in (
        PRIORITY_HIGH_KEYWORDS
        + PRIORITY_LOW_KEYWORDS
    ):
        spans_to_remove.extend(
            find_all_spans(
                description,
                keyword,
            )
        )


    # Remove EVERY occurrence of the matched date phrase.
    if matched_date_phrase:
        spans_to_remove.extend(
            find_all_spans(
                description,
                matched_date_phrase,
            )
        )


    title = remove_spans(
        description,
        spans_to_remove,
    ).strip()


    if not title:
        title = "Untitled task"


    return QuickAddParsedTask(
        title=title,
        priority=priority,
        due_date_hint=due_date_hint,
    )