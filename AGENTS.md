# AGENTS.md

## VISION

This codebase implements a production-ready Google Custom Search API wrapper designed for scalable applications requiring reliable search functionality. The project prioritizes defensive programming patterns over raw performance, choosing robustness and developer experience as primary design goals.

Key design rationales not evident from code inspection:

- **Cache Implementation Strategy**: The project utilizes the existing lru-cache dependency for automatic memory management and TTL handling. This design choice eliminates manual cache maintenance overhead while providing superior memory efficiency through automatic eviction policies. The LRU-cache configuration balances performance with memory constraints in production environments.

- **Rate Limiting Philosophy**: The Bottleneck configuration (60 requests/minute, 200ms minimum interval) is intentionally conservative relative to Google's actual limits. This buffer prevents quota exhaustion in production environments where multiple service instances might share the same API key.

- **Error Handling Hierarchy**: The module implements a three-tier error handling strategy: structured logging via qerrors for analysis, minimal logging for production visibility, and graceful degradation with empty arrays. This approach balances operational visibility with application stability.

- **Environment Variable Separation**: Required vs optional environment variables are architecturally separated to enable graceful degradation. Core search functionality remains available even when AI-enhanced error analysis (OPENAI_TOKEN) is unavailable.

- **Module Export Strategy**: The codebase exports both public functions and internal functions explicitly for testing purposes. This design enables comprehensive unit testing while maintaining clear API boundaries for consumers.

- **Connection Pooling Rationale**: Custom axios instance with keepAlive agents and socket limits (20 max, 10 free) optimizes for sustained API usage patterns typical in production search applications, reducing connection overhead.

- **Code Consolidation Philosophy**: The project implements centralized utilities (debugUtils.js, errorUtils.js, envValidator.js) to eliminate code duplication across modules. This DRY approach reduces maintenance overhead while ensuring consistent behavior patterns throughout the codebase.

- **Dependency Optimization Strategy**: The codebase maximizes utilization of existing dependencies rather than implementing custom solutions. The recent migration from custom Map-based caching to LRU-cache exemplifies this principle, reducing code complexity while improving performance.

## FUNCTIONALITY

### AI Agent Guidelines

When working with this codebase, AI agents should:

- **Preserve Cache Behavior**: Always maintain the LRU-cache implementation's automatic memory management and TTL handling. The library-based approach provides superior memory efficiency and should not be replaced with manual implementations without comprehensive performance analysis.

- **Maintain Rate Limiting Configuration**: The current Bottleneck settings represent production-tested values. Changes to rate limiting parameters require careful consideration of Google API quotas and real-world usage patterns.

- **Respect Error Handling Patterns**: Follow the established pattern of qerrors for structured logging, minLogger for production output, and graceful degradation with fallback values. Do not introduce throwing errors in core search functions.

- **Environment Variable Validation**: Use the centralized constants and validation utilities for any new environment variable requirements. Maintain the distinction between required and optional variables.

### Testing Boundaries

- Tests must never require actual API credentials or network access
- Mock implementations should preserve the behavioral contracts of real services  
- Cache behavior testing should work with LRU-cache's built-in TTL mechanisms and may require alternative approaches for time-based scenarios

### Agent Behavioral Expectations

- **Debug Mode Awareness**: The DEBUG flag controls extensive logging throughout the codebase. Agents should understand this affects performance and output verbosity in development environments.

- **CODEX Mode Handling**: When CODEX environment variable is set to any truthy value, the module operates in offline mode with mock responses. Agents must preserve this capability for development environments without API access.

- **Parallel Search Optimization**: The getTopSearchResults function implements parallel processing with duplicate term filtering. Agents should maintain this optimization pattern when extending functionality.

## SCOPE

### In-Scope

- Google Custom Search API integration and optimization
- Rate limiting and quota management
- Caching strategies for search results
- Error handling and logging infrastructure
- Offline development and testing capabilities
- Environment variable validation and configuration management

### Out-of-Scope

- Other search providers or APIs (this module is Google-specific)
- Frontend UI components or user interfaces
- Authentication systems beyond API key management
- Data persistence beyond in-memory caching
- Real-time search features or websocket connections
- Search result parsing beyond Google's standard response format

### Change Boundaries

- **Permitted**: Performance optimizations, additional validation, enhanced error messaging, test coverage improvements
- **Restricted**: Breaking changes to public API without deprecation cycle, removal of offline testing capabilities, changes that require external dependencies beyond current scope

## CONSTRAINTS

### Immutable Components

- **Public API Surface**: The exported functions `googleSearch`, `getTopSearchResults`, and `fetchSearchItems` must maintain backward compatibility
- **Environment Variable Names**: `GOOGLE_API_KEY`, `GOOGLE_CX`, `OPENAI_TOKEN`, `CODEX`, `LOG_LEVEL` are established contracts
- **Cache Key Format**: The query:num pattern for cache keys is relied upon by consuming applications

### Special Process Requirements

- **Dependency Changes**: Any new npm dependencies require security audit and bundle size impact analysis
- **Rate Limiting Modifications**: Changes to Bottleneck configuration require load testing validation
- **Test Infrastructure**: Modifications to test utilities in `__tests__/utils/` require cross-test validation

### Workflow Exceptions

- **Cache Implementation**: Changes to LRU-cache configuration require explicit test coverage and performance validation to ensure memory efficiency is maintained
- **Error Handling**: Modifications to qerrors integration must preserve both development and production logging capabilities
- **API Response Format**: Google Custom Search API response structure changes require corresponding updates to item extraction and caching logic

## POLICY

### Development Standards

- **Test Coverage**: All new functions require both unit and integration test coverage
- **Environment Compatibility**: Code must support both development (mocked) and production (live API) environments
- **Error Resilience**: Functions should return safe defaults rather than throwing errors when possible

### Security Requirements

- **API Key Handling**: Never log or expose API keys in any context
- **Input Validation**: All user-provided search queries must pass validation before processing
- **Dependency Auditing**: Regular security audits required for all npm dependencies

### Maintenance Policies

- **Documentation Synchronization**: Code changes must be accompanied by corresponding documentation updates
- **Backward Compatibility**: Public API changes require deprecation notices and migration guides
- **Performance Monitoring**: Rate limiting and cache effectiveness should be measurable through logging

### Organizational Standards

- **Code Comments**: All functions require both technical and rationale documentation as per established patterns
- **Testing Philosophy**: Prefer integration tests that exercise real workflows over isolated unit tests
- **Error Reporting**: Use structured error logging for production debugging while maintaining development-friendly output