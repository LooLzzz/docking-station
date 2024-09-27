import subprocess

__all__ = [
    'Singleton',
    'subprocess_stream_generator',
    'tryparse_float',
]


class Singleton(type):
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super(Singleton, cls).__call__(*args, **kwargs)
        return cls._instances[cls]


def tryparse_float(value):
    try:
        return float(value)

    except ValueError:
        pass

    return None


def subprocess_stream_generator(cmd: list[str]):
    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )

    line: str
    for line in process.stdout:
        lines = [ll
                 for l in line.split('\n')
                 if (ll := l.strip())]
        for i in lines:
            yield i
