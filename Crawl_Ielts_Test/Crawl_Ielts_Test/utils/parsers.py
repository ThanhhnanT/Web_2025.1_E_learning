import re
from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional, Tuple

from bs4 import BeautifulSoup, NavigableString, Tag
from slugify import slugify


@dataclass
class SeriesMeta:
    series: Optional[str]
    test_number: Optional[str]


def slug_from_url(url: str) -> str:
    tail = url.rstrip("/").split("/")[-1]
    if not tail:
        return slugify(url)
    return slugify(tail)


def normalise_space(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip())


def html_to_text(html_fragment: str) -> str:
    soup = BeautifulSoup(html_fragment, "html.parser")
    return normalise_space(" ".join(soup.stripped_strings))


def infer_series_meta(title: str, url: str) -> SeriesMeta:
    slug = slug_from_url(url)
    match = re.search(r"ielts[-_]?(\d+)", slug)
    series = None
    if match:
        series = f"Cambridge IELTS {int(match.group(1))}"
    number_match = re.search(r"test[-_]?(\d+)", slug)
    test_number = None
    if number_match:
        test_number = f"Test {int(number_match.group(1))}"
    if not series:
        title_match = re.search(r"(Cambridge\s+IELTS\s+\d+)", title, re.IGNORECASE)
        if title_match:
            series = title_match.group(1).title()
    return SeriesMeta(series=series, test_number=test_number)


def _collect_until(tag: Tag, stop_predicate) -> List[Tag]:
    collected: List[Tag] = []
    for sibling in tag.next_siblings:
        if isinstance(sibling, NavigableString):
            if sibling.strip():
                collected.append(sibling)
            continue
        if stop_predicate(sibling):
            break
        collected.append(sibling)
    return collected


def _extract_audio(tag: Tag) -> Optional[str]:
    audio_tag = tag.find_next("audio")
    if not isinstance(audio_tag, Tag):
        return None
    source = audio_tag.find("source")
    if source and source.get("src"):
        return source["src"].split("?")[0]
    if audio_tag.get("src"):
        return audio_tag["src"].split("?")[0]
    return None


def _is_part_heading(tag: Tag) -> bool:
    if not isinstance(tag, Tag):
        return False
    if tag.name not in {"h2", "h3", "h4"}:
        return False
    text = tag.get_text(strip=True).lower()
    return text.startswith("part ")


def extract_listening_parts(article: Tag) -> List[Dict]:
    parts: List[Dict] = []
    for heading in article.find_all(_is_part_heading):
        text = heading.get_text(strip=True)
        match = re.search(r"part\s*(\d+)", text, re.IGNORECASE)
        if not match:
            continue
        part_no = int(match.group(1))
        audio_url = _extract_audio(heading)
        transcript_div = heading.find_next(lambda tag: isinstance(tag, Tag)
                                           and tag.name == "div"
                                           and "et_pb_text_inner" in (tag.get("class") or [])
                                           and tag.find("p"))
        transcript_html = str(transcript_div) if transcript_div else ""
        transcript_text = html_to_text(transcript_html) if transcript_html else ""
        parts.append({
            "part": part_no,
            "title": f"Part {part_no}",
            "audio": audio_url,
            "transcriptHtml": transcript_html,
            "transcriptText": transcript_text,
        })
    return parts


def _expand_question_token(token: str) -> List[int]:
    token = token.strip().replace("–", "-").replace("—", "-")
    if not token:
        return []
    if any(ch.isalpha() for ch in token):
        # token likely includes words, skip
        return []
    numbers = []
    if "-" in token:
        start, end = token.split("-", 1)
        if start.isdigit() and end.isdigit():
            start_i, end_i = int(start), int(end)
            if end_i >= start_i:
                numbers.extend(range(start_i, end_i + 1))
            return numbers
    for piece in re.split(r"[,&]", token):
        piece = piece.strip()
        if piece.isdigit():
            numbers.append(int(piece))
    if not numbers and token.isdigit():
        numbers.append(int(token))
    return numbers


def _split_answer_values(raw: str) -> List[str]:
    values = []
    for chunk in re.split(r",|/|\\+|;|&", raw):
        cleaned = chunk.strip(" .:-").strip()
        if cleaned:
            values.append(cleaned)
    if not values and raw.strip():
        values.append(raw.strip())
    return values


def parse_answer_lines(lines: Iterable[str]) -> List[Dict]:
    answers: List[Dict] = []
    for line in lines:
        normalized = normalise_space(line.replace("…", " "))
        prefix = []
        idx = 0
        while idx < len(normalized) and (normalized[idx].isdigit() or normalized[idx] in {"&", "-", "–", "—"}):
            prefix.append(normalized[idx])
            idx += 1
        question_part = "".join(prefix)
        if not question_part:
            continue
        question_numbers = _expand_question_token(question_part)
        if not question_numbers:
            continue
        answer_raw = normalized[idx:].strip(" :-")
        if not answer_raw:
            continue
        values = _split_answer_values(answer_raw)
        for number in question_numbers:
            answers.append({
                "question": number,
                "raw": answer_raw,
                "value": values,
            })
    return answers


def parse_listening_answers(article: Tag) -> List[Dict]:
    parts: List[Dict] = []
    for toggle in article.select(".et_pb_toggle"):
        title_el = toggle.select_one(".et_pb_toggle_title")
        if not title_el:
            continue
        title_text = title_el.get_text(strip=True)
        match = re.search(r"part\s*(\d+)", title_text, re.IGNORECASE)
        if not match:
            continue
        part_no = int(match.group(1))
        lines = []
        for p in toggle.select(".et_pb_toggle_content p"):
            text = p.get_text(" ", strip=True)
            if text:
                lines.append(text)
        answers = parse_answer_lines(lines)
        if not answers:
            continue
        question_numbers = [row["question"] for row in answers]
        part_payload = {
            "part": part_no,
            "questionRange": [min(question_numbers), max(question_numbers)],
            "answers": answers,
        }
        parts.append(part_payload)
    return sorted(parts, key=lambda entry: entry["part"])


def _is_question_heading(tag: Tag) -> bool:
    if not isinstance(tag, Tag):
        return False
    if tag.name not in {"h4", "h5"}:
        return False
    text = tag.get_text(strip=True).lower()
    return "question" in text


def extract_reading_parts(article: Tag) -> List[Dict]:
    parts: List[Dict] = []
    headings = article.find_all("h3")
    passage_headings: List[Tuple[int, Tag]] = []
    for heading in headings:
        text = heading.get_text(strip=True)
        match = re.search(r"reading\s+passage\s+(\d+)", text, re.IGNORECASE)
        if match:
            passage_headings.append((int(match.group(1)), heading))
    def closest_passage(tag: Tag) -> Optional[Tag]:
        return tag.find_previous(lambda el: isinstance(el, Tag) and el.name == "h3"
                                 and "reading passage" in el.get_text(strip=True).lower())

    for idx, (part_no, heading) in enumerate(passage_headings):
        next_heading = passage_headings[idx + 1][1] if idx + 1 < len(passage_headings) else None
        passage_nodes = []
        for node in heading.next_siblings:
            if isinstance(node, NavigableString):
                continue
            if next_heading and (node == next_heading or (hasattr(node, "find") and node.find(lambda tag: tag == next_heading))):
                break
            if isinstance(node, Tag) and _is_question_heading(node):
                break
            passage_nodes.append(node)
        passage_html = "".join(str(node) for node in passage_nodes if hasattr(node, "name"))
        question_sections = []
        cursor = heading.find_next(_is_question_heading)
        while cursor:
            owner = closest_passage(cursor)
            if owner is not heading:
                break
            if not _is_question_heading(cursor):
                cursor = cursor.find_next(_is_question_heading)
                continue
            block_nodes = _collect_until(cursor, lambda tag: _is_question_heading(tag) or
                                         (isinstance(tag, Tag) and tag.name == "h3"
                                          and "reading passage" in tag.get_text(strip=True).lower()))
            html_block = str(cursor) + "".join(str(n) for n in block_nodes)
            question_sections.append({
                "heading": cursor.get_text(" ", strip=True),
                "html": html_block,
            })
            cursor = cursor.find_next(_is_question_heading)
            if cursor and closest_passage(cursor) is not heading:
                break
        parts.append({
            "part": part_no,
            "title": f"Reading Passage {part_no}",
            "passageHtml": passage_html,
            "questionSections": question_sections,
        })
    return parts


def _numbers_from_heading(heading: str) -> List[int]:
    heading = heading.lower()
    if "question" not in heading:
        return []
    matches = [int(num) for num in re.findall(r"\d+", heading)]
    if "to" in heading or "-" in heading:
        if len(matches) >= 2:
            start, end = matches[0], matches[1]
            if end >= start:
                return list(range(start, end + 1))
    if ("and" in heading or "&" in heading) and len(matches) > 1:
        return matches
    if len(matches) == 1:
        return [matches[0]]
    return matches


def _extract_answers_from_section(html_fragment: str, fallback_numbers: List[int]) -> List[Dict]:
    soup = BeautifulSoup(html_fragment, "html.parser")
    answers: List[Dict] = []
    pending_number: Optional[int] = None
    consumed: List[int] = []
    for strong in soup.find_all("strong"):
        text = strong.get_text(strip=True)
        if not text:
            continue
        if text.isdigit():
            pending_number = int(text)
            continue
        if pending_number is not None:
            values = _split_answer_values(text)
            answers.append({
                "question": pending_number,
                "raw": text,
                "value": values,
            })
            consumed.append(pending_number)
            pending_number = None
    if answers:
        return answers
    option_values = []
    for strong in soup.find_all("strong"):
        text = strong.get_text(strip=True)
        if re.fullmatch(r"[A-Z]", text):
            option_values.append(text)
    if fallback_numbers and option_values:
        for idx, number in enumerate(fallback_numbers):
            if idx >= len(option_values):
                break
            answers.append({
                "question": number,
                "raw": option_values[idx],
                "value": [option_values[idx]],
            })
    return answers


def parse_reading_answers(parts: List[Dict]) -> List[Dict]:
    answer_parts: List[Dict] = []
    for part in parts:
        part_answers: List[Dict] = []
        for section in part.get("questionSections", []):
            html_fragment = section["html"]
            numbers = _numbers_from_heading(section.get("heading", ""))
            answers = _extract_answers_from_section(html_fragment, numbers)
            part_answers.extend(answers)
        if not part_answers:
            continue
        questions = [row["question"] for row in part_answers]
        answer_parts.append({
            "part": part["part"],
            "questionRange": [min(questions), max(questions)],
            "answers": part_answers,
        })
    return answer_parts

