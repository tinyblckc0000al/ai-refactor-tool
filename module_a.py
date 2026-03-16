"""Module A - provides utilities"""
from typing import List


def helper_func(data: List[int]) -> int:
    """A helper function"""
    return sum(data)


class BaseClass:
    """Base class"""
    def __init__(self):
        self.value = 0
    
    def compute(self) -> int:
        return self.value * 2
