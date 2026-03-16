"""Test module for AI Refactor Tool"""
import os
import sys
from typing import List, Dict


class DataProcessor:
    """Process data with various transformations"""
    
    def __init__(self, name: str):
        self.name = name
        self.data: List[int] = []
    
    def add(self, value: int) -> None:
        """Add a value to data"""
        self.data.append(value)
    
    def sum_all(self) -> int:
        """Sum all values"""
        return sum(self.data)
    
    def filter_even(self) -> List[int]:
        """Filter even numbers"""
        return [x for x in self.data if x % 2 == 0]


def process_items(items: List[int]) -> Dict[str, int]:
    """Process a list of items"""
    processor = DataProcessor("temp")
    for item in items:
        processor.add(item)
    
    return {
        "sum": processor.sum_all(),
        "count": len(items),
        "evens": len(processor.filter_even())
    }


def main():
    """Main entry point"""
    result = process_items([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    print(f"Result: {result}")


if __name__ == "__main__":
    main()
