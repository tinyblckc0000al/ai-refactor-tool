"""Module C - imports from B"""
from module_b import ExtendedClass, process


def wrapper():
    """Wrapper that uses module_b"""
    return process()


class Combined:
    """Uses ExtendedClass from module_b"""
    def __init__(self):
        self.extended = ExtendedClass()
    
    def run(self):
        return self.extended.compute()
