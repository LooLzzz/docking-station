
__all__ = [
    'tryparse_float',
]


def tryparse_float(value):
    try:
        return float(value)

    except ValueError:
        pass

    return None
