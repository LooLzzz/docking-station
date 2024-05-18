
__all__ = [
    'snake_case_to_camel_case',
    'snake_case_to_pascal_case',
]


def snake_case_to_camel_case(name: str) -> str:
    parts = name.split('_')
    return parts[0] + ''.join(
        [c.capitalize() for c in parts[1:]]
    )


def snake_case_to_pascal_case(name: str) -> str:
    parts = name.split('_')
    return ''.join(
        [c.capitalize() for c in parts]
    )
