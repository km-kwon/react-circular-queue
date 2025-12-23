# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-12-23

### Changed

- Added GitHub repository URL to package.json
- Added homepage and bug tracker links
- Improved npm package metadata

## [1.0.0] - 2025-12-22

### Added

- Initial release
- CircularBuffer low-level API for direction-based circular buffer operations
- BufferManager high-level API with convenient push/pop/peek methods
- React hook: `useCircularBuffer` for stateful React integration
- Full TypeScript support with generics
- Zero dependencies (React as optional peer dependency)
- O(1) push/pop/peek operations
- Support for React 16.8+, 17, 18, 19
- Comprehensive documentation and examples
- Type-safe implementation with complete API reference
