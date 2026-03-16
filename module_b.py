"""Module B - imports module_a and module_c"""
from module_a import helper_func, BaseClass
from module_c import Combined


class ExtendedClass(BaseClass):
    """Extended class that inherits from BaseClass"""
    
    def __init__(self):
        super().__init__()
    
    def compute(self) -> int:
        return super().compute() + 1


def process():
    """Process using helper from module_a"""
    return helper_func([1, 2, 3])


# This creates circular: module_b -> module_c -> module_b
