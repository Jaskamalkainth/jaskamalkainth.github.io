# Bloom Filter Visualization

This is an interactive visualization of a Bloom filter data structure, based on the implementation described in the [Bloom Filters blog post](../../../bloom_filters.md).

## Features

- **Interactive Demo**: Add and query strings with a visual representation of the bit array
- **Animated Preview**: Watch an automatic animation that demonstrates how Bloom filters work
- **False Positive Demonstration**: See how false positives can occur in Bloom filters
- **Mathematical Analysis**: Shows the calculated false positive rate based on current parameters

## Implementation Details

This visualization implements a JavaScript version of the Bloom filter with the same two hash functions described in the blog post:

1. Hash function 1: Uses base value 31
2. Hash function 2: Uses base value 3727

The visualization allows you to:
- Insert strings into the Bloom filter
- Check if strings exist in the Bloom filter
- See which bits are set for each string
- Understand when false positives occur
- Adjust the bit array size to see how it affects false positive rates

## Files

- `index.html` - The main interactive visualization
- `bloom-filter-preview.js` - Animated preview script that demonstrates the basic concept
- `README.md` - This documentation file

## Usage

To use this visualization, simply open `index.html` in a web browser. No additional dependencies are required.

## Related Resources

- [Original C++ Implementation](https://github.com/Jaskamalkainth/BloomFilter)
- [Blog Post on Bloom Filters](../../../bloom_filters.md) 