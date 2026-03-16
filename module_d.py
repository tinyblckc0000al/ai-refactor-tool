"""Module D - creates circular with module_c"""
from module_c import Combined


def another_wrapper():
    """Another wrapper using module_c"""
    combined = Combined()
    return combined.run()


# Also import from b to create chain: d -> c -> b -> d
from module_b import ExtendedClass
