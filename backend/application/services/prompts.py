from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import yaml

PROMPT_FILE = Path(__file__).with_name("prompt.yaml")


@dataclass(frozen=True, slots=True)
class Prompt:
    instructions: str
    input_template: str

    def render(self, **values: str) -> str:
        try:
            return self.input_template.format(**values)
        except KeyError as exc:
            raise ValueError(
                f"Missing value {exc.args[0]!r} for prompt template"
            ) from exc


@lru_cache(maxsize=1)
def load_prompts() -> dict[str, Prompt]:
    with PROMPT_FILE.open(encoding="utf-8") as prompt_file:
        raw_prompts = yaml.safe_load(prompt_file)

    if not isinstance(raw_prompts, dict):
        raise TypeError("Prompt catalog must be a YAML mapping")

    prompts: dict[str, Prompt] = {}
    for name, value in raw_prompts.items():
        if not isinstance(name, str) or not isinstance(value, dict):
            raise TypeError("Each prompt must be a named YAML mapping")

        instructions = value.get("instructions")
        input_template = value.get("input_template")
        if not isinstance(instructions, str) or not instructions.strip():
            raise ValueError(f"Prompt {name!r} has no instructions")
        if not isinstance(input_template, str) or not input_template.strip():
            raise ValueError(f"Prompt {name!r} has no input template")

        prompts[name] = Prompt(
            instructions=instructions.strip(),
            input_template=input_template.strip(),
        )

    return prompts


def get_prompt(name: str) -> Prompt:
    try:
        return load_prompts()[name]
    except KeyError as exc:
        raise ValueError(f"Unknown AI prompt: {name}") from exc
